import React, { useEffect, useMemo, useState } from "react";
import { Download, Filter, Loader2, Search } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { getCompanyAdmins } from "../../services/companyAdminCloud";
import { formatDuration } from "../../services/challengeService";
import { firebaseConfigured, realtimeDb } from "../../services/firebaseClient";

const USERS_PATH = "users";
const ATTEMPTS_PATH = "attempts";

const toTimestamp = (value) => {
  if (Number.isFinite(Number(value))) {
    return Number(value);
  }
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const formatDate = (value) => {
  const date = new Date(toTimestamp(value));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeUsers = (raw) => {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw).flatMap(([companyId, companyUsers]) => {
    if (!companyUsers || typeof companyUsers !== "object") {
      return [];
    }

    return Object.entries(companyUsers).map(([userId, user]) => ({
      rowId: `${companyId}:${userId}`,
      userId,
      companyId,
      name: user?.name || "Player",
      email: user?.email || "",
      phone: user?.phone || "",
      city: user?.city || user?.location || "",
      createdAt: toTimestamp(user?.createdAt),
    }));
  });
};

const normalizeAttempts = (raw) => {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw).flatMap(([companyId, companyAttempts]) => {
    if (!companyAttempts || typeof companyAttempts !== "object") {
      return [];
    }

    return Object.entries(companyAttempts).map(([attemptId, attempt]) => ({
      attemptId,
      companyId,
      userId: attempt?.userId || "",
      completionTimeSec: Number(attempt?.completionTimeSec) || 0,
      status: attempt?.status === "solved" ? "solved" : "failed",
      timestamp: toTimestamp(attempt?.timestamp),
    }));
  });
};

const getCid = (userId) =>
  `#CHAL-${String(userId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "USER"}`;

const statusClass = (status) => {
  if (status === "Solved") {
    return "bg-mint/10 text-mint";
  }
  if (status === "Not Solved") {
    return "bg-accent/10 text-accent";
  }
  return "bg-soft-yellow/20 text-yellow-700";
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
};

const ParticipantManagement = () => {
  const cloudUnavailable = !firebaseConfigured || !realtimeDb;
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [companyMap, setCompanyMap] = useState({});
  const [pageError, setPageError] = useState(
    cloudUnavailable ? "Firebase is not configured. Add VITE_FIREBASE_* keys." : ""
  );
  const [loadingUsers, setLoadingUsers] = useState(!cloudUnavailable);
  const [loadingAttempts, setLoadingAttempts] = useState(!cloudUnavailable);

  useEffect(() => {
    if (cloudUnavailable) {
      return undefined;
    }

    const usersRef = ref(realtimeDb, USERS_PATH);
    const attemptsRef = ref(realtimeDb, ATTEMPTS_PATH);

    const unsubUsers = onValue(
      usersRef,
      (snapshot) => {
        setUsers(normalizeUsers(snapshot.val()));
        setLoadingUsers(false);
      },
      (error) => {
        setUsers([]);
        setLoadingUsers(false);
        setPageError(error?.message || "Could not load users from cloud.");
      }
    );

    const unsubAttempts = onValue(
      attemptsRef,
      (snapshot) => {
        setAttempts(normalizeAttempts(snapshot.val()));
        setLoadingAttempts(false);
      },
      (error) => {
        setAttempts([]);
        setLoadingAttempts(false);
        setPageError(error?.message || "Could not load attempts from cloud.");
      }
    );

    return () => {
      unsubUsers();
      unsubAttempts();
    };
  }, [cloudUnavailable]);

  useEffect(() => {
    let active = true;

    if (cloudUnavailable) {
      return () => {
        active = false;
      };
    }

    getCompanyAdmins()
      .then((rows) => {
        if (!active) {
          return;
        }
        const map = rows.reduce((acc, item) => {
          acc[item.companyId || item.id] = item.name || "";
          return acc;
        }, {});
        setCompanyMap(map);
      })
      .catch(() => {
        if (active) {
          setCompanyMap({});
        }
      });

    return () => {
      active = false;
    };
  }, [cloudUnavailable]);

  const loading = loadingUsers || loadingAttempts;

  const rows = useMemo(() => {
    const attemptsByUser = new Map();

    attempts.forEach((attempt) => {
      if (!attempt.userId || !attempt.companyId) {
        return;
      }
      const key = `${attempt.companyId}:${attempt.userId}`;
      const bucket = attemptsByUser.get(key) || [];
      bucket.push(attempt);
      attemptsByUser.set(key, bucket);
    });

    return users
      .map((user) => {
        const key = `${user.companyId}:${user.userId}`;
        const userAttempts = attemptsByUser.get(key) || [];
        const solvedAttempt = userAttempts
          .filter((attempt) => attempt.status === "solved")
          .sort((a, b) => a.completionTimeSec - b.completionTimeSec)[0];

        const status = solvedAttempt
          ? "Solved"
          : userAttempts.length > 0
          ? "Not Solved"
          : "Not Played";

        return {
          id: user.rowId,
          cid: getCid(user.userId),
          name: user.name || "Player",
          email: user.email || "--",
          phone: user.phone || "--",
          city: user.city || companyMap[user.companyId] || user.companyId,
          attempts: userAttempts.length,
          finalTime: solvedAttempt ? formatDuration(solvedAttempt.completionTimeSec) : "--:--",
          status,
          joined: formatDate(user.createdAt),
          companyId: user.companyId,
          userId: user.userId,
        };
      })
      .sort((a, b) => (a.joined < b.joined ? 1 : -1));
  }, [attempts, companyMap, users]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.cid,
        row.name,
        row.email,
        row.phone,
        row.city,
        row.status,
        row.companyId,
        row.userId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [query, rows]);

  const handleExportCsv = () => {
    const headers = [
      "CID",
      "Name",
      "Email",
      "Phone",
      "CityOrCompany",
      "Attempts",
      "FinalTime",
      "Status",
      "Joined",
      "CompanyId",
      "UserId",
    ];

    const lines = filteredRows.map((row) =>
      [
        row.cid,
        row.name,
        row.email,
        row.phone,
        row.city,
        row.attempts,
        row.finalTime,
        row.status,
        row.joined,
        row.companyId,
        row.userId,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participants-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search participants by ID, name or email..."
            className="w-full bg-white pl-12 pr-6 py-4 rounded-2xl border border-gray-100 soft-shadow outline-none focus:ring-4 focus:ring-sky-blue/10 transition-all font-medium"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white px-6 py-4 rounded-2xl border border-gray-100 border-b-4 hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all font-bold text-gray-600"
          >
            <Filter size={18} />
            Filter
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-sky-blue text-white px-6 py-4 rounded-2xl shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all font-black"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {pageError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 font-semibold">
          {pageError}
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                CID
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Name
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                City / Company
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest text-center">
                Attempts
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest text-center">
                Final Time
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Status
              </th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">
                Joined
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-8 py-10 text-center text-gray-500 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Loading participants...
                  </span>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-8 py-10 text-center text-gray-400 font-semibold">
                  No real participant records found.
                </td>
              </tr>
            ) : (
              filteredRows.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-bold text-sky-blue bg-sky-blue/5 px-2 py-1 rounded-lg">
                      {participant.cid}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-800">{participant.name}</div>
                    <div className="text-xs font-medium text-gray-400">{participant.email}</div>
                  </td>
                  <td className="px-8 py-6 font-medium text-gray-600">{participant.city}</td>
                  <td className="px-8 py-6 text-center font-black text-gray-500">
                    {participant.attempts}
                  </td>
                  <td className="px-8 py-6 text-center font-black text-gray-800 tabular-nums">
                    {participant.finalTime}
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${statusClass(
                        participant.status
                      )}`}
                    >
                      {participant.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-medium text-gray-400 text-sm italic">
                    {participant.joined}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantManagement;

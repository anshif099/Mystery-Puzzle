import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Loader2 } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { getCompanyAdmins } from "../../services/companyAdminCloud";
import { formatDuration } from "../../services/challengeService";
import { firebaseConfigured, realtimeDb } from "../../services/firebaseClient";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const USERS_PATH = "users";
const ATTEMPTS_PATH = "attempts";
const CAMPAIGNS_PATH = "campaigns";
const DAY_MS = 24 * 60 * 60 * 1000;

const toTimestamp = (value) => {
  if (Number.isFinite(Number(value))) {
    return Number(value);
  }
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const startOfDay = (timestamp) => {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const getLastDays = (today, count) => {
  return Array.from({ length: count }, (_, index) => {
    const offset = count - index - 1;
    const dayStart = today - offset * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const date = new Date(dayStart);
    return {
      start: dayStart,
      end: dayEnd,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
};

const DEFAULT_ANALYTICS_DAYS = getLastDays(startOfDay(Date.now()), 7);

const normalizeUsers = (raw) => {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw).flatMap(([companyId, companyUsers]) => {
    if (!companyUsers || typeof companyUsers !== "object") {
      return [];
    }

    return Object.entries(companyUsers).map(([userId, user]) => ({
      companyId,
      userId,
      userKey: `${companyId}:${userId}`,
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

    return Object.entries(companyAttempts).map(([, attempt]) => ({
      companyId,
      campaignId: attempt?.campaignId || "legacy_main",
      userId: attempt?.userId || "",
      userKey: `${companyId}:${attempt?.userId || ""}`,
      completionTimeSec: Number(attempt?.completionTimeSec) || 0,
      status: attempt?.status === "solved" ? "solved" : "failed",
      timestamp: toTimestamp(attempt?.timestamp),
    }));
  });
};

const normalizeCampaigns = (raw) => {
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw).flatMap(([companyId, campaignGroup]) => {
    if (!campaignGroup || typeof campaignGroup !== "object") {
      return [];
    }

    const rows = [];
    const hasLegacyFields = [
      "title",
      "isActive",
      "puzzleImage",
      "difficulty",
      "timerSeconds",
      "maxAttempts",
      "campaignKey",
    ].some((field) => campaignGroup[field] !== undefined);

    if (hasLegacyFields) {
      rows.push({
        companyId,
        campaignId: "legacy_main",
        title: campaignGroup?.title || "Main Campaign",
        isActive: Boolean(campaignGroup?.isActive),
      });
    }

    if (campaignGroup?.items && typeof campaignGroup.items === "object") {
      rows.push(
        ...Object.entries(campaignGroup.items).map(([campaignId, item]) => ({
          companyId,
          campaignId,
          title: item?.title || "Campaign",
          isActive: Boolean(item?.isActive),
        }))
      );
    }

    return rows;
  });
};

const buildFallbackCompanyName = (companyId) => {
  if (!companyId) {
    return "Unknown Company";
  }
  const short = String(companyId).slice(-6).toUpperCase();
  return `Company ${short}`;
};

const cardBaseClass =
  "bg-white p-6 rounded-[32px] soft-shadow border border-gray-50 flex flex-col gap-2";

const Analytics = () => {
  const cloudUnavailable = !firebaseConfigured || !realtimeDb;
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [companyMap, setCompanyMap] = useState({});
  const [error, setError] = useState(
    cloudUnavailable ? "Firebase is not configured. Add VITE_FIREBASE_* keys." : ""
  );
  const [loadingUsers, setLoadingUsers] = useState(!cloudUnavailable);
  const [loadingAttempts, setLoadingAttempts] = useState(!cloudUnavailable);
  const [loadingCampaigns, setLoadingCampaigns] = useState(!cloudUnavailable);

  useEffect(() => {
    if (cloudUnavailable) {
      return undefined;
    }

    const usersRef = ref(realtimeDb, USERS_PATH);
    const attemptsRef = ref(realtimeDb, ATTEMPTS_PATH);
    const campaignsRef = ref(realtimeDb, CAMPAIGNS_PATH);

    const unsubUsers = onValue(
      usersRef,
      (snapshot) => {
        setUsers(normalizeUsers(snapshot.val()));
        setLoadingUsers(false);
      },
      (listenError) => {
        setUsers([]);
        setLoadingUsers(false);
        setError(listenError?.message || "Could not load users.");
      }
    );

    const unsubAttempts = onValue(
      attemptsRef,
      (snapshot) => {
        setAttempts(normalizeAttempts(snapshot.val()));
        setLoadingAttempts(false);
      },
      (listenError) => {
        setAttempts([]);
        setLoadingAttempts(false);
        setError(listenError?.message || "Could not load attempts.");
      }
    );

    const unsubCampaigns = onValue(
      campaignsRef,
      (snapshot) => {
        setCampaigns(normalizeCampaigns(snapshot.val()));
        setLoadingCampaigns(false);
      },
      (listenError) => {
        setCampaigns([]);
        setLoadingCampaigns(false);
        setError(listenError?.message || "Could not load campaigns.");
      }
    );

    return () => {
      unsubUsers();
      unsubAttempts();
      unsubCampaigns();
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
        const nextMap = rows.reduce((acc, row) => {
          acc[row.companyId || row.id] = row.name || "";
          return acc;
        }, {});
        setCompanyMap(nextMap);
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

  const loading = loadingUsers || loadingAttempts || loadingCampaigns;

  const chartState = useMemo(() => {
    const days = DEFAULT_ANALYTICS_DAYS;
    const firstDayStart = days[0].start;
    const campaignTitleMap = campaigns.reduce((acc, item) => {
      acc[`${item.companyId}:${item.campaignId}`] = item.title || "Campaign";
      return acc;
    }, {});

    const usersBeforeWindow = users.filter((user) => user.createdAt < firstDayStart).length;
    const usersPerDay = days.map((day) =>
      users.filter(
        (user) => user.createdAt >= day.start && user.createdAt < day.end
      ).length
    );

    const participantsOverTime = usersPerDay.map(
      (_, index) => usersBeforeWindow + usersPerDay.slice(0, index + 1).reduce((sum, value) => sum + value, 0)
    );

    const userKeys = new Set(users.map((user) => user.userKey));
    const attemptKeys = new Set();
    const solvedKeys = new Set();

    attempts.forEach((attempt) => {
      if (!attempt.userKey || !attempt.userId) {
        return;
      }
      attemptKeys.add(attempt.userKey);
      if (attempt.status === "solved") {
        solvedKeys.add(attempt.userKey);
      }
    });

    const solvedCount = solvedKeys.size;
    const unsolvedCount = [...attemptKeys].filter((userKey) => !solvedKeys.has(userKey)).length;
    const inProgressCount = Math.max(0, userKeys.size - solvedCount - unsolvedCount);

    const companyBuckets = {};
    attempts
      .filter((attempt) => attempt.status === "solved")
      .forEach((attempt) => {
        if (!attempt.companyId) {
          return;
        }
        const bucketKey = `${attempt.companyId}:${attempt.campaignId || "legacy_main"}`;
        const bucket = companyBuckets[bucketKey] || {
          sum: 0,
          count: 0,
          companyId: attempt.companyId,
          campaignId: attempt.campaignId || "legacy_main",
        };
        bucket.sum += Number(attempt.completionTimeSec || 0);
        bucket.count += 1;
        companyBuckets[bucketKey] = bucket;
      });

    const campaignRows = Object.entries(companyBuckets)
      .map(([bucketKey, item]) => ({
        bucketKey,
        companyId: item.companyId,
        campaignId: item.campaignId,
        avgSec: item.count > 0 ? Math.round(item.sum / item.count) : 0,
        count: item.count,
        label: `${companyMap[item.companyId] || buildFallbackCompanyName(item.companyId)} - ${
          campaignTitleMap[bucketKey] || "Campaign"
        }`,
      }))
      .sort((a, b) => a.avgSec - b.avgSec)
      .slice(0, 10);

    const activeCampaigns = campaigns.filter((campaign) => campaign.isActive).length;

    return {
      participantsLabels: days.map((day) => day.label),
      participantsData: participantsOverTime,
      solvedCount,
      unsolvedCount,
      inProgressCount,
      campaignLabels: campaignRows.map((row) => row.label),
      campaignAverage: campaignRows.map((row) => row.avgSec),
      totalParticipants: users.length,
      totalAttempts: attempts.length,
      activeCampaigns,
      averageSolvedTime:
        attempts.filter((attempt) => attempt.status === "solved").length > 0
          ? Math.round(
              attempts
                .filter((attempt) => attempt.status === "solved")
                .reduce((sum, attempt) => sum + Number(attempt.completionTimeSec || 0), 0) /
                attempts.filter((attempt) => attempt.status === "solved").length
            )
          : 0,
    };
  }, [attempts, campaigns, companyMap, users]);

  const lineData = useMemo(
    () => ({
      labels: chartState.participantsLabels,
      datasets: [
        {
          label: "Participants",
          data: chartState.participantsData,
          borderColor: "#63D3A4",
          backgroundColor: "rgba(99, 211, 164, 0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [chartState.participantsData, chartState.participantsLabels]
  );

  const pieData = useMemo(
    () => ({
      labels: ["Solved", "Unsolved", "In Progress"],
      datasets: [
        {
          data: [
            chartState.solvedCount,
            chartState.unsolvedCount,
            chartState.inProgressCount,
          ],
          backgroundColor: ["#63D3A4", "#E8E78E", "#9AA6D6"],
          borderWidth: 0,
        },
      ],
    }),
    [chartState.inProgressCount, chartState.solvedCount, chartState.unsolvedCount]
  );

  const barData = useMemo(
    () => ({
      labels: chartState.campaignLabels.length ? chartState.campaignLabels : ["No Data"],
      datasets: [
        {
          label: "Avg completion time (s)",
          data: chartState.campaignAverage.length ? chartState.campaignAverage : [0],
          backgroundColor: "#6FA8DC",
          borderRadius: 12,
        },
      ],
    }),
    [chartState.campaignAverage, chartState.campaignLabels]
  );

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { weight: "bold" } },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
  };

  const barOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context) => ` ${formatDuration(context.raw)} (${context.raw}s)`,
        },
      },
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={cardBaseClass}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Total Participants
          </p>
          <p className="text-3xl font-black text-gray-900">{chartState.totalParticipants}</p>
        </div>
        <div className={cardBaseClass}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Total Attempts
          </p>
          <p className="text-3xl font-black text-gray-900">{chartState.totalAttempts}</p>
        </div>
        <div className={cardBaseClass}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Active Campaigns
          </p>
          <p className="text-3xl font-black text-gray-900">{chartState.activeCampaigns}</p>
        </div>
        <div className={cardBaseClass}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Avg Solved Time
          </p>
          <p className="text-3xl font-black text-gray-900">
            {formatDuration(chartState.averageSolvedTime)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-[40px] p-10 soft-shadow border border-gray-50 text-gray-500 font-semibold">
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Loading real analytics...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] soft-shadow border border-gray-50 h-[350px] lg:h-[400px]">
            <h3 className="text-sm lg:text-xl font-black mb-6 uppercase tracking-tight">
              Total Participants Over Time
            </h3>
            <div className="h-[250px] lg:h-[300px]">
              <Line data={lineData} options={commonOptions} />
            </div>
          </div>

          <div className="bg-white p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] soft-shadow border border-gray-50 h-[350px] lg:h-[400px]">
            <h3 className="text-sm lg:text-xl font-black mb-6 uppercase tracking-tight">
              Puzzle Success Rate
            </h3>
            <div className="h-[250px] lg:h-[300px]">
              <Pie data={pieData} options={commonOptions} />
            </div>
          </div>

          <div className="bg-white p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] soft-shadow border border-gray-50 h-[350px] lg:h-[400px] lg:col-span-2">
            <h3 className="text-sm lg:text-xl font-black mb-6 uppercase tracking-tight">
              Average Completion Time by Campaign
            </h3>
            <div className="h-[250px] lg:h-[300px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

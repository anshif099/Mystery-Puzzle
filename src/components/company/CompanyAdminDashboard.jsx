import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Copy,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  PauseCircle,
  PlayCircle,
  UploadCloud,
} from "lucide-react";
import {
  buildOverviewMetrics,
  buildParticipantRows,
  formatDuration,
  generateCampaignKey,
  saveCampaign,
  setCampaignLiveStatus,
  subscribeAttempts,
  subscribeCampaign,
  subscribeUsers,
} from "../../services/challengeService";
import {
  formatSubscriptionDate,
  getCompanyAdminAccessState,
  getCompanyAdminById,
} from "../../services/companyAdminCloud";

const normalizeDifficultyOption = (value) => {
  const raw = Number(value);
  if ([8, 12, 16, 24].includes(raw)) return raw;
  if (raw === 15) return 16;
  if (raw === 25 || raw === 35 || raw === 36 || raw === 5 || raw === 6) return 24;
  return 16;
};

const toDraft = (campaign) => ({
  puzzleImage: campaign?.puzzleImage || "",
  difficulty: String(normalizeDifficultyOption(campaign?.difficulty)),
  timerMinutes: String(Math.max(1, Math.round((campaign?.timerSeconds || 180) / 60))),
  maxAttempts: String(campaign?.maxAttempts || 3),
  campaignKey: campaign?.campaignKey || generateCampaignKey(),
});

const buildCountdown = (endsAt, now) => {
  const remaining = Math.max(0, Number(endsAt || 0) - Number(now || 0));
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { totalMs: remaining, days, hours, minutes, seconds };
};

const SidebarItem = ({ icon, label, active, onClick }) => {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-all ${
        active
          ? "bg-white/20 border-r-4 border-white text-white font-bold"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={20} />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
    <p className="mt-3 text-3xl font-black text-gray-900">{value}</p>
  </div>
);

const CountdownCard = ({ label, value }) => (
  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
    <p className="mt-3 text-4xl font-black text-gray-900 tabular-nums">
      {String(value).padStart(2, "0")}
    </p>
  </div>
);

const CompanyAdminDashboard = ({ session, onLogout }) => {
  const companyId = session?.companyId;
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [draft, setDraft] = useState(() => toDraft(null));
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [companyAdmin, setCompanyAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setError("Company session is missing.");
      return undefined;
    }

    setLoading(true);
    setError("");

    let unsubCampaign = () => {};
    let unsubUsers = () => {};
    let unsubAttempts = () => {};
    let isMounted = true;

    const syncAdmin = async () => {
      try {
        const profile = await getCompanyAdminById(companyId);
        if (!isMounted || !profile) {
          return;
        }
        setCompanyAdmin(profile);
      } catch {
        if (isMounted) {
          setCompanyAdmin(null);
        }
      }
    };

    syncAdmin();
    const adminRefresh = setInterval(syncAdmin, 60000);

    try {
      unsubCampaign = subscribeCampaign(companyId, (nextCampaign) => {
        setCampaign(nextCampaign);
        setDraft(toDraft(nextCampaign));
        setLoading(false);
      });
      unsubUsers = subscribeUsers(companyId, (rows) => setUsers(rows));
      unsubAttempts = subscribeAttempts(companyId, (rows) => setAttempts(rows));
    } catch (syncError) {
      setLoading(false);
      setError(syncError?.message || "Realtime sync failed.");
    }

    return () => {
      isMounted = false;
      clearInterval(adminRefresh);
      unsubCampaign();
      unsubUsers();
      unsubAttempts();
    };
  }, [companyId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const companyName = companyAdmin?.name || session?.companyName || "Company";
  const companyAdminName = companyAdmin?.admin || session?.name || "Company Admin";
  const companyAdminEmail = companyAdmin?.email || session?.email || "";
  const subscriptionEndsAt =
    Number(companyAdmin?.subscriptionEndsAt || session?.subscriptionEndsAt || 0);
  const subscriptionEndDate =
    companyAdmin?.subscriptionEndDate || session?.subscriptionEndDate || "";
  const accessState = getCompanyAdminAccessState(
    {
      status: companyAdmin?.status || "Active",
      subscriptionEndsAt,
    },
    now
  );
  const countdown = buildCountdown(subscriptionEndsAt, now);

  useEffect(() => {
    if (logoutTriggeredRef.current) {
      return undefined;
    }

    if (accessState === "Expired") {
      logoutTriggeredRef.current = true;
      setError("Subscription expired. Logging out...");
      const timeout = setTimeout(() => {
        onLogout();
      }, 1200);
      return () => clearTimeout(timeout);
    }

    if (accessState === "Disabled") {
      logoutTriggeredRef.current = true;
      setError("Company admin access is disabled. Logging out...");
      const timeout = setTimeout(() => {
        onLogout();
      }, 1200);
      return () => clearTimeout(timeout);
    }

    logoutTriggeredRef.current = false;
    return undefined;
  }, [accessState, onLogout]);

  const metrics = useMemo(() => buildOverviewMetrics(users, attempts), [users, attempts]);
  const participants = useMemo(() => buildParticipantRows(users, attempts), [users, attempts]);

  const campaignLink = useMemo(() => {
    if (!companyId || typeof window === "undefined") {
      return "";
    }
    const key = draft.campaignKey || campaign?.campaignKey || "";
    const base = `${window.location.origin}/play?companyId=${encodeURIComponent(companyId)}`;
    return key ? `${base}&campaign=${encodeURIComponent(key)}` : base;
  }, [companyId, campaign?.campaignKey, draft.campaignKey]);

  const qrImageSrc = useMemo(() => {
    if (!campaignLink) {
      return "";
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      campaignLink
    )}`;
  }, [campaignLink]);

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setMessage("");
    setError("");
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleDraftChange("puzzleImage", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCampaign = async () => {
    if (!companyId) {
      setError("Missing company ID.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        puzzleImage: draft.puzzleImage || "",
        difficulty: normalizeDifficultyOption(draft.difficulty),
        timerSeconds: (Number(draft.timerMinutes) || 3) * 60,
        maxAttempts: Number(draft.maxAttempts) || 3,
        campaignKey: draft.campaignKey || generateCampaignKey(),
        isActive: campaign?.isActive || false,
      };
      const saved = await saveCampaign(companyId, payload);
      setCampaign(saved);
      setDraft(toDraft(saved));
      setMessage("Campaign settings saved.");
    } catch (saveError) {
      setError(saveError?.message || "Failed to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCampaign = async () => {
    if (!campaign || !companyId) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await setCampaignLiveStatus(companyId, !campaign.isActive);
      setMessage(campaign.isActive ? "Campaign stopped." : "Campaign started.");
    } catch (toggleError) {
      setError(toggleError?.message || "Failed to change campaign status.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyQrLink = async () => {
    if (!campaignLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(campaignLink);
      setMessage("QR link copied.");
    } catch {
      setError("Could not copy link.");
    }
  };

  const titleByTab = {
    dashboard: "Company Dashboard",
    campaigns: "Campaign Management",
    subscription: "Subscription Countdown",
  };

  const subscriptionLabel =
    accessState === "Expired"
      ? "Expired"
      : subscriptionEndsAt
      ? `${countdown.days}d ${countdown.hours}h left`
      : "No expiry set";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative overflow-x-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-64 bg-mint h-screen fixed left-0 top-0 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-8 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons.png" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-white font-black text-lg tracking-tighter">ADMIN</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg lg:hidden text-white"
          >
            <LogOut size={18} className="rotate-180" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => {
              setActiveTab("dashboard");
              setIsSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={Flag}
            label="Campaign Management"
            active={activeTab === "campaigns"}
            onClick={() => {
              setActiveTab("campaigns");
              setIsSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={Clock3}
            label="Subscription Countdown"
            active={activeTab === "subscription"}
            onClick={() => {
              setActiveTab("subscription");
              setIsSidebarOpen(false);
            }}
          />
        </nav>

        <div className="px-4 pb-4">
          <div className="rounded-3xl bg-white/15 border border-white/10 p-4 text-white">
            <p className="text-[10px] uppercase tracking-widest font-black opacity-80">
              Subscription
            </p>
            <p className="mt-2 text-lg font-black">{subscriptionLabel}</p>
            <p className="text-xs opacity-80 mt-1">
              Valid till {formatSubscriptionDate(subscriptionEndDate) || "--"}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <SidebarItem icon={LogOut} label="Logout" onClick={onLogout} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="h-20 bg-lavender-blue fixed top-0 right-0 left-0 lg:left-64 z-30 shadow-lg flex items-center justify-between px-4 lg:px-8 text-white">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div className="flex flex-col">
              <h1 className="text-sm lg:text-xl font-black tracking-tight uppercase line-clamp-1">
                {titleByTab[activeTab]}
              </h1>
              <span className="text-[8px] lg:text-[10px] font-bold opacity-60 uppercase tracking-widest hidden xs:block">
                Mystery Puzzle Brand Reveal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-xs lg:text-sm font-black">{companyAdminName}</p>
              <p className="text-[8px] lg:text-[10px] font-bold opacity-60">{companyAdminEmail}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 hover:bg-accent/20 hover:text-accent rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 mt-20 p-4 lg:p-8 pt-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Company Admin Dashboard
                </p>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">
                  {companyName}
                </h1>
                <p className="text-gray-500 font-medium mt-2">
                  Company ID: <span className="font-bold text-gray-700">{companyId}</span>
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Access Status
                </p>
                <p
                  className={`mt-2 text-2xl font-black ${
                    accessState === "Active"
                      ? "text-mint"
                      : accessState === "Expired"
                      ? "text-yellow-600"
                      : "text-accent"
                  }`}
                >
                  {accessState}
                </p>
              </div>
            </div>

            {(message || error) && (
              <div
                className={`rounded-2xl p-4 font-semibold ${
                  error
                    ? "bg-red-50 border border-red-200 text-red-600"
                    : "bg-mint/10 border border-mint/30 text-mint"
                }`}
              >
                {error || message}
              </div>
            )}

            {activeTab === "dashboard" && (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard label="Total Participants" value={metrics.totalParticipants} />
                  <StatCard label="Total Puzzle Attempts" value={metrics.totalPuzzleAttempts} />
                  <StatCard label="Completed Puzzles" value={metrics.completedPuzzles} />
                  <StatCard
                    label="Average Completion Time"
                    value={formatDuration(metrics.averageCompletionTime)}
                  />
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-2xl font-black text-gray-900">Participant Data</h3>
                    <p className="text-gray-500 mt-2">Live updates from your campaign players.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left">
                      <thead>
                        <tr className="bg-gray-50/80">
                          {[
                            "Name",
                            "Email",
                            "Phone",
                            "Completion Time",
                            "Attempts",
                            "Status",
                          ].map((head) => (
                            <th
                              key={head}
                              className="px-6 py-4 text-xs uppercase tracking-widest font-black text-gray-500"
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {participants.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="px-6 py-8 text-center text-gray-400 font-semibold"
                            >
                              No participants yet.
                            </td>
                          </tr>
                        ) : (
                          participants.map((row) => (
                            <tr key={row.userId} className="border-t border-gray-100">
                              <td className="px-6 py-4 font-bold text-gray-800">{row.name}</td>
                              <td className="px-6 py-4 font-medium text-gray-600">{row.email}</td>
                              <td className="px-6 py-4 font-medium text-gray-600">{row.phone}</td>
                              <td className="px-6 py-4 font-black text-gray-800">
                                {row.completionTime}
                              </td>
                              <td className="px-6 py-4 font-black text-gray-700">
                                {row.attempts}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                    row.status === "Solved"
                                      ? "bg-mint/10 text-mint"
                                      : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === "campaigns" && (
              <div className="grid xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-2xl font-black text-gray-900">Campaign Control</h2>
                  <p className="text-gray-500 font-medium mt-2">
                    Configure puzzle challenge and control campaign status.
                  </p>

                  {loading ? (
                    <div className="mt-8 text-gray-500 font-semibold">Loading campaign...</div>
                  ) : (
                    <div className="mt-8 grid md:grid-cols-2 gap-5">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Puzzle Image
                        </label>
                        <label className="w-full border border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <UploadCloud size={20} className="text-gray-600" />
                          <span className="font-semibold text-gray-700">
                            Upload Puzzle Logo/Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {draft.puzzleImage && (
                          <img
                            src={draft.puzzleImage}
                            alt="Puzzle preview"
                            className="w-full max-h-64 object-contain rounded-2xl border border-gray-100 bg-gray-50"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Difficulty
                        </label>
                        <select
                          value={draft.difficulty}
                          onChange={(event) =>
                            handleDraftChange("difficulty", event.target.value)
                          }
                          className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                        >
                          <option value="8">8 Blocks</option>
                          <option value="12">12 Blocks</option>
                          <option value="16">16 Blocks</option>
                          <option value="24">24 Blocks</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Timer (Minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={draft.timerMinutes}
                          onChange={(event) =>
                            handleDraftChange("timerMinutes", event.target.value)
                          }
                          className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Max Attempts
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={draft.maxAttempts}
                          onChange={(event) =>
                            handleDraftChange("maxAttempts", event.target.value)
                          }
                          className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Campaign Key
                        </label>
                        <input
                          type="text"
                          value={draft.campaignKey}
                          onChange={(event) =>
                            handleDraftChange("campaignKey", event.target.value.toUpperCase())
                          }
                          className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveCampaign}
                          disabled={saving}
                          className="bg-mint text-white px-6 py-3 rounded-2xl font-black hover:bg-mint/90 transition-colors disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Campaign"}
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleCampaign}
                          disabled={saving}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-colors disabled:opacity-60 ${
                            campaign?.isActive
                              ? "bg-accent text-white hover:bg-accent/90"
                              : "bg-sky-blue text-white hover:bg-sky-blue/90"
                          }`}
                        >
                          {campaign?.isActive ? (
                            <PauseCircle size={18} />
                          ) : (
                            <PlayCircle size={18} />
                          )}
                          {campaign?.isActive ? "Stop Campaign" : "Start Campaign"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-gray-900">Campaign QR Code</h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Share this QR to allow users to login and play puzzle for your company
                    campaign.
                  </p>

                  <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4 flex justify-center">
                    {qrImageSrc ? (
                      <img
                        src={qrImageSrc}
                        alt="Campaign QR Code"
                        className="w-52 h-52 rounded-xl"
                      />
                    ) : (
                      <div className="h-52 w-52 flex items-center justify-center text-gray-400 font-semibold">
                        Save campaign to generate QR
                      </div>
                    )}
                  </div>

                  <div className="mt-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">QR Link</p>
                    <p className="text-sm font-semibold text-gray-700 break-all">
                      {campaignLink || "--"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyQrLink}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    <Copy size={17} />
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            {activeTab === "subscription" && (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <CountdownCard label="Days" value={countdown.days} />
                  <CountdownCard label="Hours" value={countdown.hours} />
                  <CountdownCard label="Minutes" value={countdown.minutes} />
                  <CountdownCard label="Seconds" value={countdown.seconds} />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Subscription Status
                    </p>
                    <h3
                      className={`mt-3 text-4xl font-black ${
                        accessState === "Active"
                          ? "text-mint"
                          : accessState === "Expired"
                          ? "text-yellow-600"
                          : "text-accent"
                      }`}
                    >
                      {accessState}
                    </h3>
                    <p className="mt-4 text-gray-600 font-medium">
                      Valid till:{" "}
                      <span className="font-black text-gray-900">
                        {formatSubscriptionDate(subscriptionEndDate) || "--"}
                      </span>
                    </p>
                    <p className="mt-4 text-gray-500 font-medium">
                      When the subscription validity ends, company admin access logs out
                      automatically and campaign access stops until the super admin extends it.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Campaign Summary
                    </p>
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Campaign Status</span>
                        <span
                          className={`font-black ${
                            campaign?.isActive ? "text-mint" : "text-accent"
                          }`}
                        >
                          {campaign?.isActive ? "Running" : "Stopped"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Participants</span>
                        <span className="font-black text-gray-900">
                          {metrics.totalParticipants}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Puzzle Attempts</span>
                        <span className="font-black text-gray-900">
                          {metrics.totalPuzzleAttempts}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Best Avg Time</span>
                        <span className="font-black text-gray-900">
                          {formatDuration(metrics.averageCompletionTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;

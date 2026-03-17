import React, { useEffect, useMemo, useState } from "react";
import { Copy, LogOut, PauseCircle, PlayCircle, UploadCloud } from "lucide-react";
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

const normalizeDifficultyOption = (value) => {
  const raw = Number(value);
  if (raw === 15 || raw === 16) return 15;
  if (raw === 24 || raw === 25) return 24;
  if (raw === 35 || raw === 36) return 35;
  return 15;
};

const toDraft = (campaign) => ({
  puzzleImage: campaign?.puzzleImage || "",
  difficulty: String(normalizeDifficultyOption(campaign?.difficulty)),
  timerMinutes: String(Math.max(1, Math.round((campaign?.timerSeconds || 180) / 60))),
  maxAttempts: String(campaign?.maxAttempts || 3),
  campaignKey: campaign?.campaignKey || generateCampaignKey(),
});

const CompanyAdminDashboard = ({ session, onLogout }) => {
  const companyId = session?.companyId;
  const companyName = session?.companyName || "Company";

  const [campaign, setCampaign] = useState(null);
  const [draft, setDraft] = useState(() => toDraft(null));
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setError("Company session is missing.");
      return;
    }

    setLoading(true);
    setError("");

    let unsubCampaign = () => {};
    let unsubUsers = () => {};
    let unsubAttempts = () => {};

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
      unsubCampaign();
      unsubUsers();
      unsubAttempts();
    };
  }, [companyId]);

  const metrics = useMemo(() => buildOverviewMetrics(users, attempts), [users, attempts]);
  const participants = useMemo(
    () => buildParticipantRows(users, attempts),
    [users, attempts]
  );

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 md:px-8 py-6 md:py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Company Admin Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">{companyName}</h1>
            <p className="text-gray-500 font-medium mt-2">
              Company ID: <span className="font-bold text-gray-700">{companyId}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
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

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total Participants", value: metrics.totalParticipants },
            { label: "Total Puzzle Attempts", value: metrics.totalPuzzleAttempts },
            { label: "Completed Puzzles", value: metrics.completedPuzzles },
            { label: "Average Completion Time", value: formatDuration(metrics.averageCompletionTime) },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-black text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

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
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
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
                    onChange={(event) => handleDraftChange("difficulty", event.target.value)}
                    className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                  >
                    <option value="15">15 Pieces (1 Blank)</option>
                    <option value="24">24 Pieces (1 Blank)</option>
                    <option value="35">35 Pieces (1 Blank)</option>
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
                    onChange={(event) => handleDraftChange("timerMinutes", event.target.value)}
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
                    onChange={(event) => handleDraftChange("maxAttempts", event.target.value)}
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
                    {campaign?.isActive ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                    {campaign?.isActive ? "Stop Campaign" : "Start Campaign"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900">Campaign QR Code</h3>
            <p className="text-gray-500 text-sm mt-2">
              Share this QR to allow users to login and play puzzle for your company campaign.
            </p>

            <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4 flex justify-center">
              {qrImageSrc ? (
                <img src={qrImageSrc} alt="Campaign QR Code" className="w-52 h-52 rounded-xl" />
              ) : (
                <div className="h-52 w-52 flex items-center justify-center text-gray-400 font-semibold">
                  Save campaign to generate QR
                </div>
              )}
            </div>

            <div className="mt-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold uppercase text-gray-500 mb-2">QR Link</p>
              <p className="text-sm font-semibold text-gray-700 break-all">{campaignLink || "--"}</p>
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
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400 font-semibold">
                      No participants yet.
                    </td>
                  </tr>
                ) : (
                  participants.map((row) => (
                    <tr key={row.userId} className="border-t border-gray-100">
                      <td className="px-6 py-4 font-bold text-gray-800">{row.name}</td>
                      <td className="px-6 py-4 font-medium text-gray-600">{row.email}</td>
                      <td className="px-6 py-4 font-medium text-gray-600">{row.phone}</td>
                      <td className="px-6 py-4 font-black text-gray-800">{row.completionTime}</td>
                      <td className="px-6 py-4 font-black text-gray-700">{row.attempts}</td>
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
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;

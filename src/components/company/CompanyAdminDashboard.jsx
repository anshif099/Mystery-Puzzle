import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Copy,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  PauseCircle,
  Pencil,
  PlayCircle,
  PlusCircle,
  Trash2,
  UploadCloud,
  RotateCcw,
  UserCircle,
} from "lucide-react";
import {
  buildOverviewMetrics,
  buildParticipantRows,
  deleteCampaign,
  formatDuration,
  generateCampaignKey,
  saveCampaign,
  setCampaignLiveStatus,
  subscribeAttempts,
  subscribeCampaigns,
  subscribeUsers,
} from "../../services/challengeService";
import { writeSession } from "../../services/session";
import {
  formatSubscriptionDate,
  getCompanyAdminAccessState,
  getCompanyAdminById,
} from "../../services/companyAdminCloud";
import {
  deleteSpinWheel,
  saveSpinWheel,
  setSpinWheelLiveStatus,
  subscribeSpinWheels,
} from "../../services/spinWheelService";
import CompanyProfile from "./CompanyProfile";

const normalizeDifficultyOption = (value) => {
  const raw = Number(value);
  if ([8, 12, 16, 24].includes(raw)) return raw;
  if (raw === 15) return 16;
  if (raw === 25 || raw === 35 || raw === 36 || raw === 5 || raw === 6) return 24;
  return 16;
};

const buildEmptyDraft = () => ({
  title: "",
  puzzleImage: "", // Only for puzzles
  difficulty: "16", // Only for puzzles
  timerMinutes: "3",
  maxAttempts: "3",
  campaignKey: generateCampaignKey(),
  revealType: "blur",
});

const buildEmptyWheelDraft = () => ({
  title: "",
  timerMinutes: "1", // Legacy/Hidden
  maxAttempts: "1",
  wheelKey: generateCampaignKey(),
  items: [
    { name: "Prize 1", image: "", chance: 25 },
    { name: "Prize 2", image: "", chance: 25 },
    { name: "Prize 3", image: "", chance: 25 },
    { name: "Prize 4", image: "", chance: 25 },
  ],
});

const toDraft = (campaign) =>
  campaign
    ? {
        title: campaign.title || "",
        puzzleImage: campaign.puzzleImage || "",
        difficulty: String(normalizeDifficultyOption(campaign.difficulty)),
        timerMinutes: String(Math.max(1, Math.round((campaign.timerSeconds || 180) / 60))),
        maxAttempts: String(campaign.maxAttempts || 3),
        campaignKey: campaign.campaignKey || generateCampaignKey(),
        revealType: campaign.revealType || "blur",
      }
    : buildEmptyDraft();

const toWheelDraft = (wheel) =>
  wheel
    ? {
        title: wheel.title || "",
        timerMinutes: String(Math.max(1, Math.round((wheel.timerSeconds || 60) / 60))),
        maxAttempts: String(wheel.maxAttempts || 1),
        wheelKey: wheel.wheelKey || generateCampaignKey(),
        items: Array.isArray(wheel.items) ? [...wheel.items] : [
          { name: "Prize 1", image: "", chance: 25 },
          { name: "Prize 2", image: "", chance: 25 },
          { name: "Prize 3", image: "", chance: 25 },
          { name: "Prize 4", image: "", chance: 25 },
        ],
      }
    : buildEmptyWheelDraft();

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
          ? "bg-[var(--color-mint-content-faint)] border-r-4 border-[var(--color-mint-content)] text-[var(--color-mint-content)] font-bold"
          : "text-[var(--color-mint-content-muted)] hover:bg-[var(--color-mint-content-faint)] hover:text-[var(--color-mint-content)]"
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

const SummaryCard = ({ label, value, tone = "default" }) => (
  <div className="rounded-2xl bg-gray-50 px-3.5 py-2.5 min-w-[110px] flex-1 sm:flex-none">
    <p className="text-[9px] uppercase tracking-wider font-black text-gray-400 whitespace-nowrap">
      {label}
    </p>
    <p
      className={`mt-0.5 text-lg font-black whitespace-nowrap ${
        tone === "success"
          ? "text-mint"
          : tone === "warning"
          ? "text-yellow-600"
          : tone === "danger"
          ? "text-accent"
          : "text-gray-900"
      }`}
    >
      {value}
    </p>
  </div>
);

const CompanyAdminDashboard = ({ session, onLogout }) => {
  const companyId = session?.companyId;
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [spinWheels, setSpinWheels] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState("");
  const [selectedSpinWheelId, setSelectedSpinWheelId] = useState("");
  const [editingSpinWheelId, setEditingSpinWheelId] = useState("");
  const [draft, setDraft] = useState(() => buildEmptyDraft());
  const [wheelDraft, setWheelDraft] = useState(() => buildEmptyWheelDraft());
  const [users, setUsers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [companyAdmin, setCompanyAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const features = useMemo(() => {
    const list = Array.isArray(companyAdmin?.features) 
      ? companyAdmin.features 
      : Array.isArray(session?.features) 
      ? session.features 
      : ["Puzzle"];
    return list;
  }, [companyAdmin, session]);

  const handleBackToSuperAdmin = () => {
    if (session?.originalSession) {
      writeSession({ ...session.originalSession, loggedAt: Date.now() });
      window.location.href = "/";
    }
  };

  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setError("Company session is missing.");
      return undefined;
    }

    setLoading(true);
    setError("");
    setCampaigns([]);
    setSpinWheels([]);
    setSelectedCampaignId("");
    setEditingCampaignId("");
    setSelectedSpinWheelId("");
    setEditingSpinWheelId("");
    setDraft(buildEmptyDraft());
    setWheelDraft(buildEmptyWheelDraft());

    let unsubCampaigns = () => {};
    let unsubWheels = () => {};
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
      unsubCampaigns = subscribeCampaigns(companyId, (next) => {
        if (isMounted) {
          setCampaigns(next);
          setLoading(false);
        }
      });
      unsubWheels = subscribeSpinWheels(companyId, (next) => {
        if (isMounted) {
          setSpinWheels(next);
        }
      });
      unsubUsers = subscribeUsers(companyId, (next) => {
        if (isMounted) setUsers(next);
      });
      unsubAttempts = subscribeAttempts(companyId, (next) => {
        if (isMounted) setAttempts(next);
      });
    } catch (syncError) {
      setLoading(false);
      setError(syncError?.message || "Realtime sync failed.");
    }

    return () => {
      isMounted = false;
      clearInterval(adminRefresh);
      unsubCampaigns();
      unsubWheels();
      unsubUsers();
      unsubAttempts();
    };
  }, [companyId]);

  useEffect(() => {
    setSelectedSpinWheelId((currentId) => {
      if (spinWheels.some((item) => item.wheelId === currentId)) {
        return currentId;
      }
      return spinWheels[0]?.wheelId || "";
    });
  }, [spinWheels]);

  useEffect(() => {
    if (!editingSpinWheelId) return;
    const editingWheel = spinWheels.find((item) => item.wheelId === editingSpinWheelId);
    if (!editingWheel) {
      setEditingSpinWheelId("");
      setWheelDraft(buildEmptyWheelDraft());
      return;
    }
    setWheelDraft(toWheelDraft(editingWheel));
  }, [spinWheels, editingSpinWheelId]);

  useEffect(() => {
    setSelectedCampaignId((currentId) => {
      if (campaigns.some((item) => item.campaignId === currentId)) {
        return currentId;
      }
      return campaigns[0]?.campaignId || "";
    });
  }, [campaigns]);

  useEffect(() => {
    if (!editingCampaignId) {
      return;
    }

    const editingCampaign = campaigns.find((item) => item.campaignId === editingCampaignId);
    if (!editingCampaign) {
      setEditingCampaignId("");
      setDraft(buildEmptyDraft());
      return;
    }

    setDraft(toDraft(editingCampaign));
  }, [campaigns, editingCampaignId]);

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

  useLayoutEffect(() => {
    // Primary Color
    const color = companyAdmin?.themeColor || session?.themeColor || "#63D3A4";
    const hex = color.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty("--color-mint-rgb", `${r}, ${g}, ${b}`);
      
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const isDarkText = luminance > 0.75;
      const contrastHex = isDarkText ? "#1f2937" : "#ffffff";
      document.documentElement.style.setProperty("--color-mint-content", contrastHex);
      
      // Compute a lighter version of the contrast hex for borders / subtle backgrounds
      // Using hex opacity
      document.documentElement.style.setProperty("--color-mint-content-muted", isDarkText ? "#1f293799" : "#ffffffcc");
      document.documentElement.style.setProperty("--color-mint-content-faint", isDarkText ? "#1f293733" : "#ffffff33");
    } else {
      document.documentElement.style.setProperty("--color-mint-rgb", `99, 211, 164`);
      document.documentElement.style.setProperty("--color-mint-content", `#ffffff`);
      document.documentElement.style.setProperty("--color-mint-content-muted", `#ffffffcc`);
      document.documentElement.style.setProperty("--color-mint-content-faint", `#ffffff33`);
    }

    // Secondary Color
    const secondaryColor = companyAdmin?.themeSecondaryColor || session?.themeSecondaryColor || "#9AA6D6";
    const sHex = secondaryColor.replace("#", "");
    if (sHex.length === 6) {
      const sr = parseInt(sHex.substring(0, 2), 16);
      const sg = parseInt(sHex.substring(2, 4), 16);
      const sb = parseInt(sHex.substring(4, 6), 16);
      document.documentElement.style.setProperty("--color-lavender-blue-rgb", `${sr}, ${sg}, ${sb}`);

      const sLuminance = (0.299 * sr + 0.587 * sg + 0.114 * sb) / 255;
      const sIsDarkText = sLuminance > 0.75;
      document.documentElement.style.setProperty("--color-lavender-blue-content", sIsDarkText ? "#1f2937" : "#ffffff");
      document.documentElement.style.setProperty("--color-lavender-blue-content-muted", sIsDarkText ? "#1f2937cc" : "#ffffffcc");
    } else {
      document.documentElement.style.setProperty("--color-lavender-blue-rgb", `154, 166, 214`);
      document.documentElement.style.setProperty("--color-lavender-blue-content", `#ffffff`);
      document.documentElement.style.setProperty("--color-lavender-blue-content-muted", `#ffffffcc`);
    }

    return () => {
      document.documentElement.style.setProperty("--color-mint-rgb", `99, 211, 164`);
      document.documentElement.style.setProperty("--color-mint-content", `#ffffff`);
      document.documentElement.style.setProperty("--color-mint-content-muted", `#ffffffcc`);
      document.documentElement.style.setProperty("--color-mint-content-faint", `#ffffff33`);
      document.documentElement.style.setProperty("--color-lavender-blue-rgb", `154, 166, 214`);
      document.documentElement.style.setProperty("--color-lavender-blue-content", `#ffffff`);
      document.documentElement.style.setProperty("--color-lavender-blue-content-muted", `#ffffffcc`);
    };
  }, [companyAdmin?.themeColor, companyAdmin?.themeSecondaryColor, session?.themeColor, session?.themeSecondaryColor]);

  const metrics = useMemo(() => buildOverviewMetrics(users, attempts), [users, attempts]);
  const participants = useMemo(() => buildParticipantRows(users, attempts), [users, attempts]);
  const allowedCampaigns = Math.max(0, Number(companyAdmin?.campaigns ?? session?.campaigns ?? 0));
  const activeCampaignCount = useMemo(
    () => campaigns.filter((item) => item.isActive).length,
    [campaigns]
  );
  const remainingCampaignSlots = Math.max(0, allowedCampaigns - campaigns.length);
  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.campaignId === selectedCampaignId) || null,
    [campaigns, selectedCampaignId]
  );
  const editingCampaign = useMemo(
    () => campaigns.find((item) => item.campaignId === editingCampaignId) || null,
    [campaigns, editingCampaignId]
  );

  const selectedSpinWheel = useMemo(
    () => spinWheels.find((item) => item.wheelId === selectedSpinWheelId) || null,
    [spinWheels, selectedSpinWheelId]
  );
  const editingWheel = useMemo(
    () => spinWheels.find((item) => item.wheelId === editingSpinWheelId) || null,
    [spinWheels, editingSpinWheelId]
  );

  const campaignLink = useMemo(() => {
    if (!companyId || !selectedCampaign || typeof window === "undefined") {
      return "";
    }
    const base =
      `${window.location.origin}/play?companyId=${encodeURIComponent(companyId)}` +
      `&campaignId=${encodeURIComponent(selectedCampaign.campaignId)}`;
    return selectedCampaign.campaignKey
      ? `${base}&campaign=${encodeURIComponent(selectedCampaign.campaignKey)}`
      : base;
  }, [companyId, selectedCampaign]);

  const qrImageSrc = useMemo(() => {
    if (!campaignLink) {
      return "";
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      campaignLink
    )}`;
  }, [campaignLink]);

  const wheelLink = useMemo(() => {
    if (!companyId || !selectedSpinWheel || typeof window === "undefined") {
      return "";
    }
    const base =
      `${window.location.host === "localhost" ? "http://localhost:5173" : window.location.origin}/play?companyId=${encodeURIComponent(companyId)}` +
      `&campaignId=${encodeURIComponent(selectedSpinWheel.wheelId)}&type=wheel`;
    return selectedSpinWheel.wheelKey
      ? `${base}&campaign=${encodeURIComponent(selectedSpinWheel.wheelKey)}`
      : base;
  }, [companyId, selectedSpinWheel]);

  const wheelQrImageSrc = useMemo(() => {
    if (!wheelLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      wheelLink
    )}`;
  }, [wheelLink]);

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setMessage("");
    setError("");
  };

  const handleWheelDraftChange = (field, value) => {
    setWheelDraft((prev) => ({ ...prev, [field]: value }));
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

  const handleCreateNewCampaign = () => {
    setEditingCampaignId("");
    setDraft(buildEmptyDraft());
    setMessage("");

    if (allowedCampaigns <= 0) {
      setError("Campaign limit is 0. Contact super admin.");
      return;
    }

    if (campaigns.length >= allowedCampaigns) {
      setError("Reached maximum campaign limit.");
      return;
    }

    setError("");
  };

  const handleSaveCampaign = async () => {
    if (!companyId) {
      setError("Missing company ID.");
      return;
    }

    const isEditing = Boolean(editingCampaignId);
    const currentEditingCampaign =
      campaigns.find((item) => item.campaignId === editingCampaignId) || null;

    if (!isEditing) {
      if (allowedCampaigns <= 0) {
        setError("Campaign limit is 0. Contact super admin.");
        return;
      }

      if (campaigns.length >= allowedCampaigns) {
        setError("Reached maximum campaign limit.");
        return;
      }
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        title:
          draft.title.trim() ||
          currentEditingCampaign?.title ||
          `Campaign ${campaigns.length + (isEditing ? 0 : 1)}`,
        puzzleImage: draft.puzzleImage || currentEditingCampaign?.puzzleImage || "",
        difficulty: normalizeDifficultyOption(draft.difficulty),
        timerSeconds: Math.max(1, Number(draft.timerMinutes) || 3) * 60,
        maxAttempts: Math.max(1, Number(draft.maxAttempts) || 3),
        campaignKey:
          (draft.campaignKey || currentEditingCampaign?.campaignKey || generateCampaignKey())
            .trim()
            .toUpperCase(),
        isActive: currentEditingCampaign?.isActive || false,
        revealType: draft.revealType || "blur",
      };
      const saved = await saveCampaign(companyId, payload, editingCampaignId);
      setSelectedCampaignId(saved.campaignId);
      setEditingCampaignId(saved.campaignId);
      setDraft(toDraft(saved));
      setMessage(isEditing ? "Campaign updated." : "Campaign saved.");
    } catch (saveError) {
      setError(saveError?.message || "Failed to delete campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSpinWheel = async () => {
    if (!companyId) {
      setError("Missing company ID.");
      return;
    }
    const isEditing = Boolean(editingSpinWheelId);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        title: wheelDraft.title.trim() || (isEditing ? editingWheel?.title : `Wheel ${spinWheels.length + 1}`),
        timerSeconds: 0, // No timer for spin wheels
        maxAttempts: Math.max(1, Number(wheelDraft.maxAttempts) || 1),
        wheelKey: (wheelDraft.wheelKey || generateCampaignKey()).trim().toUpperCase(),
        items: wheelDraft.items || [],
        isActive: editingWheel?.isActive || false,
      };
      const saved = await saveSpinWheel(companyId, payload, editingSpinWheelId);
      setSelectedSpinWheelId(saved.wheelId);
      setEditingSpinWheelId(saved.wheelId);
      setMessage(isEditing ? "Spin wheel updated." : "Spin wheel saved.");
    } catch (err) {
      setError(err?.message || "Failed to save spin wheel.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSpinWheel = (wheel) => {
    setSelectedSpinWheelId(wheel.wheelId);
    setEditingSpinWheelId(wheel.wheelId);
    setWheelDraft(toWheelDraft(wheel));
    setMessage("");
    setError("");
  };

  const handleDeleteSpinWheel = async (wheel) => {
    if (!companyId || !wheel?.wheelId) return;
    if (!window.confirm(`Delete ${wheel.title}?`)) return;
    setSaving(true);
    try {
      await deleteSpinWheel(companyId, wheel.wheelId);
      if (editingSpinWheelId === wheel.wheelId) {
        setEditingSpinWheelId("");
        setWheelDraft(buildEmptyWheelDraft());
      }
    } catch (err) {
      setError(err?.message || "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSpinWheel = async (wheel) => {
    if (!companyId || !wheel?.wheelId) return;
    setSaving(true);
    try {
      await setSpinWheelLiveStatus(companyId, wheel.wheelId, !wheel.isActive);
    } catch (err) {
      setError(err?.message || "Status update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewWheel = () => {
    setEditingSpinWheelId("");
    setWheelDraft(buildEmptyWheelDraft());
    setMessage("");
    setError("");
  };

  const handleCopyWheelLink = () => {
    if (!wheelLink) return;
    navigator.clipboard.writeText(wheelLink);
    setMessage("Link copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleAddItem = () => {
    setWheelDraft(prev => ({
      ...prev,
      items: [...prev.items, { name: `Prize ${prev.items.length + 1}`, image: "" }]
    }));
  };

  const handleRemoveItem = (index) => {
    setWheelDraft(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setWheelDraft(prev => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  };

  const handleItemImageUpload = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleItemChange(index, "image", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleEditCampaign = (nextCampaign) => {
    setSelectedCampaignId(nextCampaign.campaignId);
    setEditingCampaignId(nextCampaign.campaignId);
    setDraft(toDraft(nextCampaign));
    setMessage("");
    setError("");
  };

  const handleDeleteSavedCampaign = async (nextCampaign) => {
    if (!companyId || !nextCampaign?.campaignId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${nextCampaign.title || "this campaign"}? This removes its saved settings.`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteCampaign(companyId, nextCampaign.campaignId);

      if (editingCampaignId === nextCampaign.campaignId) {
        setEditingCampaignId("");
        setDraft(buildEmptyDraft());
      }

      if (selectedCampaignId === nextCampaign.campaignId) {
        const remaining = campaigns.filter((item) => item.campaignId !== nextCampaign.campaignId);
        setSelectedCampaignId(remaining[0]?.campaignId || "");
      }

      setMessage("Campaign deleted.");
    } catch (deleteError) {
      setError(deleteError?.message || "Failed to delete campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCampaign = async (nextCampaign) => {
    if (!nextCampaign || !companyId) {
      setError("Save a campaign first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await setCampaignLiveStatus(companyId, nextCampaign.campaignId, !nextCampaign.isActive);
      setSelectedCampaignId(nextCampaign.campaignId);
      setMessage(nextCampaign.isActive ? "Campaign stopped." : "Campaign started.");
    } catch (toggleError) {
      setError(toggleError?.message || "Failed to change campaign status.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyQrLink = async () => {
    if (!campaignLink) {
      setError("Select a saved campaign first.");
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
    profile: "Company Profile",
    campaigns: "Puzzle Management",
    spin_wheel: "Spin Wheel Management",
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
          <div className="flex items-center gap-3 w-full">
            {companyAdmin?.logo ? (
              <img src={companyAdmin.logo} alt="Company Logo" className="h-[3.2rem] w-auto max-w-full object-contain rounded-lg bg-[var(--color-mint-content-faint)] p-1 drop-shadow-sm" />
            ) : (
              <img src="/icons.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 bg-[var(--color-mint-content-faint)] hover:brightness-95 rounded-lg lg:hidden text-[var(--color-mint-content)]"
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
          {features.includes("Puzzle") && (
            <SidebarItem
              icon={Flag}
              label="Puzzle Management"
              active={activeTab === "campaigns"}
              onClick={() => {
                setActiveTab("campaigns");
                setIsSidebarOpen(false);
              }}
            />
          )}
          {features.includes("Spin Wheel") && (
            <SidebarItem
              icon={RotateCcw}
              label="Spin Wheel Management"
              active={activeTab === "spin_wheel"}
              onClick={() => {
                setActiveTab("spin_wheel");
                setIsSidebarOpen(false);
              }}
            />
          )}
          <SidebarItem
            icon={UserCircle}
            label="Company Profile"
            active={activeTab === "profile"}
            onClick={() => {
              setActiveTab("profile");
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
          <div className="rounded-3xl bg-[var(--color-mint-content-faint)] border border-[var(--color-mint-content-faint)] p-4 text-[var(--color-mint-content)]">
            <p className="text-[10px] uppercase tracking-widest font-black opacity-80">
              Subscription
            </p>
            <p className="mt-2 text-lg font-black">{subscriptionLabel}</p>
            <p className="text-xs opacity-80 mt-1">
              Valid till {formatSubscriptionDate(subscriptionEndDate) || "--"}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-mint-content-faint)]">
          <SidebarItem icon={LogOut} label="Logout" onClick={onLogout} active={false} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="h-20 bg-lavender-blue fixed top-0 right-0 left-0 lg:left-64 z-30 shadow-lg flex items-center justify-between px-4 lg:px-8 text-[var(--color-lavender-blue-content)]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 hover:bg-black/5 rounded-xl transition-colors lg:hidden"
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
            {session?.isImpersonating && (
              <button
                type="button"
                onClick={handleBackToSuperAdmin}
                className="bg-accent/10 text-accent font-bold px-4 py-2 rounded-xl text-xs hover:bg-accent hover:text-white transition-all whitespace-nowrap hidden sm:block"
              >
                Back to Super Admin
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black tracking-wide leading-none">{companyAdmin?.admin || "Admin"}</p>
              <p className="text-[10px] text-[var(--color-lavender-blue-content-muted)] font-bold mt-1 tracking-wider">{companyAdmin?.email}</p>
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
                            "Prize",
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
                              colSpan="7"
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
                              <td className="px-6 py-4 font-bold text-mint uppercase truncate max-w-[150px]">
                                {row.prize || "--"}
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
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">Campaign Control</h2>
                        <p className="text-gray-500 font-medium mt-2">
                          Save campaigns, edit them anytime, and stay inside the limit given by the
                          super admin.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateNewCampaign}
                        className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl font-black hover:bg-gray-800 transition-colors"
                      >
                        <PlusCircle size={18} />
                        New Campaign
                      </button>
                    </div>

                    <div className="mt-6 grid sm:grid-cols-3 gap-4">
                      <SummaryCard label="Allowed Campaigns" value={allowedCampaigns} />
                      <SummaryCard label="Saved Campaigns" value={campaigns.length} />
                      <SummaryCard
                        label="Remaining Slots"
                        value={remainingCampaignSlots}
                        tone={remainingCampaignSlots > 0 ? "success" : "warning"}
                      />
                    </div>

                    {loading ? (
                      <div className="mt-8 text-gray-500 font-semibold">Loading campaigns...</div>
                    ) : (
                      <div className="mt-8 grid md:grid-cols-2 gap-5">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Campaign Title
                          </label>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(event) => handleDraftChange("title", event.target.value)}
                            placeholder="Example: Summer Brand Reveal"
                            className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                          />
                        </div>

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
 
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                            Reveal Image
                          </label>
                          <select
                            value={draft.revealType}
                            onChange={(event) =>
                              handleDraftChange("revealType", event.target.value)
                            }
                            className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                          >
                             <option value="always_blur">Always Blurred</option>
                             <option value="preview_5s">Show for 5 Seconds, then Blur</option>
                             <option value="always_show">Always Visible</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleSaveCampaign}
                            disabled={saving}
                            className="bg-mint text-white px-6 py-3 rounded-2xl font-black hover:bg-mint/90 transition-colors disabled:opacity-60"
                          >
                            {saving
                              ? "Saving..."
                              : editingCampaign
                              ? "Update Campaign"
                              : "Save Campaign"}
                          </button>

                          {editingCampaign && (
                            <button
                              type="button"
                              onClick={handleCreateNewCampaign}
                              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">Saved Campaigns</h3>
                        <p className="text-gray-500 font-medium mt-2">
                          Every saved campaign appears here with edit, delete, preview, and
                          start/stop controls.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">
                          Usage
                        </p>
                        <p className="mt-1 text-xl font-black text-gray-900">
                          {campaigns.length}/{allowedCampaigns}
                        </p>
                      </div>
                    </div>

                    {loading ? (
                      <div className="mt-8 text-gray-500 font-semibold">Loading campaigns...</div>
                    ) : campaigns.length === 0 ? (
                      <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400 font-semibold">
                        No campaigns saved yet.
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {campaigns.map((item) => (
                          <div
                            key={item.campaignId}
                            className={`rounded-3xl border p-5 transition-colors ${
                              selectedCampaignId === item.campaignId
                                ? "border-mint bg-mint/5"
                                : "border-gray-100 bg-gray-50/70"
                            }`}
                          >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="text-xl font-black text-gray-900 break-words">
                                    {item.title}
                                  </h4>
                                  <span
                                    className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                      item.isActive
                                        ? "bg-mint/10 text-mint"
                                        : "bg-accent/10 text-accent"
                                    }`}
                                  >
                                    {item.isActive ? "Live" : "Stopped"}
                                  </span>
                                  {editingCampaignId === item.campaignId && (
                                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-blue/10 text-sky-blue">
                                      Editing
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-xs font-mono text-gray-500 break-all">
                                  ID: {item.campaignId}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <SummaryCard
                                    label="Difficulty"
                                    value={`${normalizeDifficultyOption(item.difficulty)} blocks`}
                                  />
                                  <SummaryCard
                                    label="Timer"
                                    value={formatDuration(item.timerSeconds)}
                                  />
                                  <SummaryCard label="Max Attempts" value={item.maxAttempts} />
                                  <SummaryCard
                                    label="Updated"
                                    value={new Date(item.updatedAt).toLocaleDateString()}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 xl:justify-end">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCampaignId(item.campaignId)}
                                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditCampaign(item)}
                                  className="inline-flex items-center gap-2 bg-sky-blue text-white px-4 py-2 rounded-2xl font-black hover:bg-sky-blue/90 transition-colors"
                                >
                                  <Pencil size={16} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCampaign(item)}
                                  disabled={saving}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black transition-colors disabled:opacity-60 ${
                                    item.isActive
                                      ? "bg-accent text-white hover:bg-accent/90"
                                      : "bg-mint text-white hover:bg-mint/90"
                                  }`}
                                >
                                  {item.isActive ? (
                                    <PauseCircle size={16} />
                                  ) : (
                                    <PlayCircle size={16} />
                                  )}
                                  {item.isActive ? "Stop" : "Start"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSavedCampaign(item)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-2 bg-white text-accent border border-red-200 px-4 py-2 rounded-2xl font-black hover:bg-red-50 transition-colors disabled:opacity-60"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900">Campaign QR Code</h3>
                    <p className="text-gray-500 text-sm mt-2">
                      {selectedCampaign
                        ? `Selected campaign: ${selectedCampaign.title}`
                        : "Select a saved campaign to generate QR and share it."}
                    </p>

                    <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4 flex justify-center">
                      {qrImageSrc ? (
                        <img
                          src={qrImageSrc}
                          alt="Campaign QR Code"
                          className="w-52 h-52 rounded-xl"
                        />
                      ) : (
                        <div className="h-52 w-52 flex items-center justify-center text-center text-gray-400 font-semibold">
                          Save and select a campaign to generate QR
                        </div>
                      )}
                    </div>

                    <div className="mt-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-2">QR Link</p>
                      <p className="text-sm font-semibold text-gray-700 break-all">
                        {campaignLink || "--"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleCopyQrLink}
                        disabled={!campaignLink}
                        className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
                      >
                        <Copy size={17} />
                        Copy Link
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCampaign(selectedCampaign)}
                        disabled={!selectedCampaign || saving}
                        className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-colors disabled:opacity-60 ${
                          selectedCampaign?.isActive
                            ? "bg-accent text-white hover:bg-accent/90"
                            : "bg-sky-blue text-white hover:bg-sky-blue/90"
                        }`}
                      >
                        {selectedCampaign?.isActive ? (
                          <PauseCircle size={17} />
                        ) : (
                          <PlayCircle size={17} />
                        )}
                        {selectedCampaign?.isActive ? "Stop" : "Start"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900">Campaign Limits</h3>
                    <p className="text-gray-500 text-sm mt-2">
                      Company admins cannot create more campaigns than the super admin allowed.
                    </p>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Allowed</span>
                        <span className="font-black text-gray-900">{allowedCampaigns}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Saved</span>
                        <span className="font-black text-gray-900">{campaigns.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Remaining</span>
                        <span
                          className={`font-black ${
                            remainingCampaignSlots > 0 ? "text-mint" : "text-yellow-600"
                          }`}
                        >
                          {remainingCampaignSlots}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Live Campaigns</span>
                        <span className="font-black text-gray-900">{activeCampaignCount}</span>
                      </div>
                    </div>
                  </div>
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
                        <span className="font-semibold text-gray-500">Saved Campaigns</span>
                        <span className="font-black text-gray-900">{campaigns.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
                        <span className="font-semibold text-gray-500">Live Campaigns</span>
                        <span className="font-black text-gray-900">{activeCampaignCount}</span>
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

            {activeTab === "spin_wheel" && (
              <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">
                          {editingSpinWheelId ? "Edit Spin Wheel" : "Create Spin Wheel"}
                        </h3>
                        <p className="text-gray-500 font-medium mt-1">
                          Configure your spin-to-win campaign settings.
                        </p>
                      </div>
                      <button
                        onClick={handleCreateNewWheel}
                        className="flex items-center gap-2 bg-gray-50 text-gray-700 px-5 py-3 rounded-2xl font-black hover:bg-gray-100 transition-colors shrink-0"
                      >
                        <PlusCircle size={20} />
                        New Wheel
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pb-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Campaign Title
                        </label>
                        <input
                          type="text"
                          value={wheelDraft.title}
                          onChange={(e) => handleWheelDraftChange("title", e.target.value)}
                          placeholder="Example: Holiday Prize Spin"
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
                          value={wheelDraft.maxAttempts}
                          onChange={(e) => handleWheelDraftChange("maxAttempts", e.target.value)}
                          className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Wheel Key
                        </label>
                        <input
                          type="text"
                          value={wheelDraft.wheelKey}
                          onChange={(e) => handleWheelDraftChange("wheelKey", e.target.value.toUpperCase())}
                          className="w-full bg-gray-50 p-4 rounded-2xl border border-transparent focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-black uppercase tracking-widest text-gray-700">
                            Wheel Items ({wheelDraft.items.length})
                          </label>
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-mint font-black text-xs uppercase tracking-wider hover:underline"
                          >
                            + Add Item
                          </button>
                        </div>

                        <div className="grid gap-3">
                          {wheelDraft.items.map((item, index) => (
                            <div key={index} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-wrap md:flex-nowrap items-start gap-4">
                              <div className="shrink-0">
                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 overflow-hidden bg-white">
                                  {item.image ? (
                                    <img src={item.image} alt="Prize" className="w-full h-full object-cover" />
                                  ) : (
                                    <UploadCloud size={16} className="text-gray-400" />
                                  )}
                                  <input type="file" accept="image/*" onChange={(e) => handleItemImageUpload(index, e)} className="hidden" />
                                </label>
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                  <input
                                    type="text"
                                    value={item.name}
                                    placeholder="Prize name"
                                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                    className="w-full bg-transparent p-2 border-b border-gray-200 outline-none focus:border-mint font-bold"
                                  />
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-400">WIN CHANCE:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.chance || 0}
                                      onChange={(e) => handleItemChange(index, "chance", Number(e.target.value))}
                                      className="w-20 bg-white/50 px-2 py-1 rounded-lg border border-gray-100 outline-none focus:border-mint text-xs font-bold"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">%</span>
                                  </div>
                                </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-2 text-accent/40 hover:text-accent"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 pt-6">
                        <button
                          onClick={handleSaveSpinWheel}
                          disabled={saving}
                          className="bg-mint text-white px-8 py-4 rounded-2xl font-black hover:bg-mint/90 transition-colors disabled:opacity-60 shadow-lg shadow-mint/10"
                        >
                          {saving ? "Saving..." : editingSpinWheelId ? "Update Wheel" : "Save Wheel"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">Saved Spin Wheels</h3>
                        <p className="text-gray-500 font-medium mt-1">
                          Manage your active and inactive wheels.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-widest font-black text-gray-500">
                          Usage
                        </p>
                        <p className="mt-1 text-xl font-black text-gray-900">
                          {spinWheels.length}/{allowedCampaigns}
                        </p>
                      </div>
                    </div>
                    
                    {spinWheels.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-400 font-semibold">
                        No spin wheels created yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {spinWheels.map((wheel) => (
                          <div
                            key={wheel.wheelId}
                            className={`rounded-3xl border p-5 transition-colors ${
                              selectedSpinWheelId === wheel.wheelId
                                ? "border-mint bg-mint/5"
                                : "border-gray-100 bg-gray-50/70"
                            }`}
                          >
                            <div className="flex flex-col xl:flex-row items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-xl font-black text-gray-900">{wheel.title}</h4>
                                  <span
                                    className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                      wheel.isActive ? "bg-mint/10 text-mint" : "bg-accent/10 text-accent"
                                    }`}
                                  >
                                    {wheel.isActive ? "Live" : "Stopped"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-mono text-gray-500">ID: {wheel.wheelId}</p>
                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  <SummaryCard label="Items" value={wheel.items?.length || 0} />
                                  <SummaryCard label="Max Attempts" value={wheel.maxAttempts} />
                                  <SummaryCard label="Key" value={wheel.wheelKey} />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 xl:justify-end">
                                <button
                                  onClick={() => setSelectedSpinWheelId(wheel.wheelId)}
                                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl font-black hover:bg-gray-200"
                                >
                                  Preview
                                </button>
                                <button
                                  onClick={() => handleEditSpinWheel(wheel)}
                                  className="bg-sky-blue text-white px-4 py-2 rounded-2xl font-black hover:bg-sky-blue/90"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleSpinWheel(wheel)}
                                  disabled={saving}
                                  className={`px-4 py-2 rounded-2xl font-black text-white ${
                                    wheel.isActive ? "bg-accent hover:bg-accent/90" : "bg-mint hover:bg-mint/90"
                                  }`}
                                >
                                  {wheel.isActive ? "Stop" : "Start"}
                                </button>
                                <button
                                  onClick={() => handleDeleteSpinWheel(wheel)}
                                  className="bg-white text-accent border border-red-200 px-4 py-2 rounded-2xl font-black hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900">Wheel QR Code</h3>
                    <p className="text-gray-500 text-sm mt-2">
                      {selectedSpinWheel
                        ? `Selected: ${selectedSpinWheel.title}`
                        : "Select a wheel to generate QR."}
                    </p>

                    <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4 flex justify-center">
                      {wheelQrImageSrc ? (
                        <img src={wheelQrImageSrc} alt="Wheel QR" className="w-52 h-52 rounded-xl" />
                      ) : (
                        <div className="h-52 w-52 flex items-center justify-center text-gray-400 font-semibold text-center">
                          Save/Select a wheel to generate QR
                        </div>
                      )}
                    </div>

                    <div className="mt-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 overflow-hidden">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-2">QR Link</p>
                      <p className="text-sm font-semibold text-gray-700 break-all font-mono">
                        {wheelLink || "--"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={handleCopyWheelLink}
                        disabled={!wheelLink}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-gray-800 transition-colors disabled:opacity-60"
                      >
                        <Copy size={20} />
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <CompanyProfile 
                companyAdmin={companyAdmin} 
                onUpdate={(updated) => setCompanyAdmin(updated)} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;

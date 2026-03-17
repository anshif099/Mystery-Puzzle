import { signInWithPopup, signOut } from "firebase/auth";
import { get, onValue, push, ref, set, update } from "firebase/database";
import { firebaseAuth, firebaseConfigured, googleProvider, realtimeDb } from "./firebaseClient";
import { getCompanyAdminById } from "./companyAdminCloud";

const CAMPAIGN_PATH = "campaigns";
const USERS_PATH = "users";
const ATTEMPTS_PATH = "attempts";
const REQUEST_TIMEOUT_MS = 15000;

const ensureDb = () => {
  if (!firebaseConfigured || !realtimeDb) {
    throw new Error("Firebase Realtime Database is not configured.");
  }
};

const withTimeout = async (promise, message) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const normalizeCampaign = (data, companyId) => ({
  companyId,
  isActive: Boolean(data?.isActive),
  puzzleImage: data?.puzzleImage || "",
  difficulty: Number(data?.difficulty) || 16,
  timerSeconds: Number(data?.timerSeconds) || 180,
  maxAttempts: Number(data?.maxAttempts) || 3,
  campaignKey: data?.campaignKey || "",
  updatedAt: Number(data?.updatedAt) || Date.now(),
});

const normalizeUser = (data, userId) => ({
  userId,
  name: data?.name || "Player",
  phone: data?.phone || "",
  email: data?.email || "",
  provider: data?.provider || "form",
  createdAt: Number(data?.createdAt) || Date.now(),
});

const normalizeAttempt = (data, attemptId) => ({
  attemptId,
  userId: data?.userId || "",
  companyId: data?.companyId || "",
  name: data?.name || "",
  email: data?.email || "",
  phone: data?.phone || "",
  attemptNumber: Number(data?.attemptNumber) || 1,
  completionTimeSec: Number(data?.completionTimeSec) || 0,
  status: data?.status === "solved" ? "solved" : "failed",
  timestamp: Number(data?.timestamp) || Date.now(),
});

export const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const generateCampaignKey = () =>
  Math.random().toString(36).slice(2, 10).toUpperCase();

export const getCampaign = async (companyId) => {
  ensureDb();
  const snapshot = await withTimeout(
    get(ref(realtimeDb, `${CAMPAIGN_PATH}/${companyId}`)),
    "Request timed out while loading campaign."
  );
  if (!snapshot.exists()) {
    return normalizeCampaign(null, companyId);
  }
  return normalizeCampaign(snapshot.val(), companyId);
};

export const saveCampaign = async (companyId, payload) => {
  ensureDb();

  const existing = await getCampaign(companyId);
  const next = normalizeCampaign(
    {
      ...existing,
      ...payload,
      updatedAt: Date.now(),
      campaignKey: payload?.campaignKey || existing.campaignKey || generateCampaignKey(),
    },
    companyId
  );

  await withTimeout(
    set(ref(realtimeDb, `${CAMPAIGN_PATH}/${companyId}`), next),
    "Request timed out while saving campaign."
  );
  return next;
};

export const setCampaignLiveStatus = async (companyId, isActive) => {
  ensureDb();
  await withTimeout(
    update(ref(realtimeDb, `${CAMPAIGN_PATH}/${companyId}`), {
      isActive: Boolean(isActive),
      updatedAt: Date.now(),
    }),
    "Request timed out while updating campaign status."
  );
};

export const getUsersByCompany = async (companyId) => {
  ensureDb();
  const snapshot = await withTimeout(
    get(ref(realtimeDb, `${USERS_PATH}/${companyId}`)),
    "Request timed out while loading users."
  );
  const raw = snapshot.val() || {};
  return Object.entries(raw)
    .map(([userId, data]) => normalizeUser(data, userId))
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
};

export const registerFormUser = async ({ companyId, name, phone, email }) => {
  ensureDb();
  const users = await getUsersByCompany(companyId);
  const normalizedPhone = (phone || "").replace(/[^\d+]/g, "");
  const existingByPhone = users.find(
    (user) => normalizedPhone && user.phone.replace(/[^\d+]/g, "") === normalizedPhone
  );
  const existingByEmail = users.find(
    (user) =>
      email &&
      user.email &&
      user.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
  const existing = existingByPhone || existingByEmail;

  if (existing) {
    return { ...existing, alreadyExists: true };
  }

  const usersRef = ref(realtimeDb, `${USERS_PATH}/${companyId}`);
  const newUserRef = push(usersRef);
  const record = {
    name: name.trim(),
    phone: normalizedPhone,
    email: (email || "").trim().toLowerCase(),
    provider: "form",
    createdAt: Date.now(),
  };

  await withTimeout(
    set(newUserRef, record),
    "Request timed out while saving user."
  );
  return normalizeUser(record, newUserRef.key);
};

export const signInUserWithGoogle = async ({ companyId }) => {
  ensureDb();
  if (!firebaseAuth || !googleProvider) {
    throw new Error("Google login is not configured.");
  }

  const result = await signInWithPopup(firebaseAuth, googleProvider);
  const profile = result.user;
  const userId = profile.uid;
  const record = {
    name: profile.displayName || "Google User",
    phone: profile.phoneNumber || "",
    email: (profile.email || "").trim().toLowerCase(),
    provider: "google",
    authUid: profile.uid,
    createdAt: Date.now(),
  };

  await withTimeout(
    set(ref(realtimeDb, `${USERS_PATH}/${companyId}/${userId}`), record),
    "Request timed out while saving Google user."
  );

  return normalizeUser(record, userId);
};

export const logoutGoogleSession = async () => {
  if (!firebaseAuth) {
    return;
  }
  try {
    await signOut(firebaseAuth);
  } catch {
    // Ignore sign out errors because local role session is still the source of truth.
  }
};

export const getAttemptsByCompany = async (companyId) => {
  ensureDb();
  const snapshot = await withTimeout(
    get(ref(realtimeDb, `${ATTEMPTS_PATH}/${companyId}`)),
    "Request timed out while loading attempts."
  );
  const raw = snapshot.val() || {};
  return Object.entries(raw)
    .map(([attemptId, data]) => normalizeAttempt(data, attemptId))
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
};

export const getUserAttemptStats = (attempts, userId) => {
  const userAttempts = attempts.filter((attempt) => attempt.userId === userId);
  const solved = userAttempts.find((attempt) => attempt.status === "solved");
  return {
    count: userAttempts.length,
    solved: Boolean(solved),
    solvedTimeSec: solved ? solved.completionTimeSec : 0,
  };
};

export const saveAttempt = async ({
  companyId,
  user,
  status,
  completionTimeSec,
}) => {
  ensureDb();
  const attempts = await getAttemptsByCompany(companyId);
  const currentCount = attempts.filter((item) => item.userId === user.userId).length;
  const attemptNumber = currentCount + 1;

  const record = {
    userId: user.userId,
    companyId,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    attemptNumber,
    completionTimeSec: Number(completionTimeSec) || 0,
    status: status === "solved" ? "solved" : "failed",
    timestamp: Date.now(),
  };

  const attemptRef = push(ref(realtimeDb, `${ATTEMPTS_PATH}/${companyId}`));
  await withTimeout(
    set(attemptRef, record),
    "Request timed out while saving attempt."
  );
  return normalizeAttempt(record, attemptRef.key);
};

export const subscribeCampaign = (companyId, callback) => {
  ensureDb();
  const campaignRef = ref(realtimeDb, `${CAMPAIGN_PATH}/${companyId}`);
  return onValue(campaignRef, (snapshot) => {
    callback(normalizeCampaign(snapshot.val(), companyId));
  });
};

export const subscribeUsers = (companyId, callback) => {
  ensureDb();
  const usersRef = ref(realtimeDb, `${USERS_PATH}/${companyId}`);
  return onValue(usersRef, (snapshot) => {
    const raw = snapshot.val() || {};
    const users = Object.entries(raw)
      .map(([userId, data]) => normalizeUser(data, userId))
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    callback(users);
  });
};

export const subscribeAttempts = (companyId, callback) => {
  ensureDb();
  const attemptsRef = ref(realtimeDb, `${ATTEMPTS_PATH}/${companyId}`);
  return onValue(attemptsRef, (snapshot) => {
    const raw = snapshot.val() || {};
    const attempts = Object.entries(raw)
      .map(([attemptId, data]) => normalizeAttempt(data, attemptId))
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    callback(attempts);
  });
};

export const buildOverviewMetrics = (users, attempts) => {
  const solvedAttempts = attempts.filter((item) => item.status === "solved");
  const solvedUsers = new Set(solvedAttempts.map((item) => item.userId));
  const average =
    solvedAttempts.length > 0
      ? Math.round(
          solvedAttempts.reduce((sum, item) => sum + Number(item.completionTimeSec || 0), 0) /
            solvedAttempts.length
        )
      : 0;

  return {
    totalParticipants: users.length,
    totalPuzzleAttempts: attempts.length,
    completedPuzzles: solvedUsers.size,
    averageCompletionTime: average,
  };
};

export const buildParticipantRows = (users, attempts) =>
  users.map((user) => {
    const userAttempts = attempts.filter((item) => item.userId === user.userId);
    const solvedAttempt = userAttempts
      .filter((item) => item.status === "solved")
      .sort((a, b) => a.completionTimeSec - b.completionTimeSec)[0];
    const latestAttempt = userAttempts[0];

    return {
      userId: user.userId,
      name: user.name || "Player",
      email: user.email || "--",
      phone: user.phone || "--",
      completionTime: solvedAttempt ? formatDuration(solvedAttempt.completionTimeSec) : "--:--",
      attempts: userAttempts.length,
      status: solvedAttempt ? "Solved" : latestAttempt ? "Not Solved" : "Not Solved",
    };
  });

export const buildLeaderboard = (users, attempts) => {
  const userById = Object.fromEntries(users.map((user) => [user.userId, user]));
  const solvedAttempts = attempts.filter((item) => item.status === "solved");
  const bestMap = {};

  solvedAttempts.forEach((attempt) => {
    const existing = bestMap[attempt.userId];
    if (!existing || attempt.completionTimeSec < existing.completionTimeSec) {
      bestMap[attempt.userId] = attempt;
    }
  });

  return Object.values(bestMap)
    .map((attempt) => {
      const user = userById[attempt.userId] || {};
      const attemptsUsed = attempts.filter((item) => item.userId === attempt.userId).length;
      return {
        userId: attempt.userId,
        name: user.name || attempt.name || "Player",
        attemptsUsed,
        completionTimeSec: attempt.completionTimeSec,
      };
    })
    .sort((a, b) => {
      if (a.completionTimeSec !== b.completionTimeSec) {
        return a.completionTimeSec - b.completionTimeSec;
      }
      return a.attemptsUsed - b.attemptsUsed;
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      completionTime: formatDuration(row.completionTimeSec),
    }));
};

export const validatePlayAccess = async ({ companyId, campaignKey }) => {
  const company = await getCompanyAdminById(companyId);
  if (!company || company.status === "Disabled") {
    throw new Error("Invalid company link.");
  }

  const campaign = await getCampaign(companyId);
  if (!campaign.isActive) {
    throw new Error("Campaign is not active right now.");
  }

  if (campaign.campaignKey && campaign.campaignKey !== (campaignKey || "")) {
    throw new Error("QR link is invalid for this campaign.");
  }

  return { company, campaign };
};

import { get, ref } from "firebase/database";
import { firebaseConfigured, realtimeDb } from "./firebaseClient";
import { getCompanyAdmins } from "./companyAdminCloud";

const CAMPAIGN_PATH = "campaigns";
const USERS_PATH = "users";
const ATTEMPTS_PATH = "attempts";

const ensureDb = () => {
  if (!firebaseConfigured || !realtimeDb) {
    throw new Error("Firebase Realtime Database is not configured.");
  }
};

export const getSuperAdminMetrics = async () => {
  ensureDb();
  
  const [admins, campaignsSnap, usersSnap, attemptsSnap] = await Promise.all([
    getCompanyAdmins(),
    get(ref(realtimeDb, CAMPAIGN_PATH)),
    get(ref(realtimeDb, USERS_PATH)),
    get(ref(realtimeDb, ATTEMPTS_PATH))
  ]);

  const campaignsRaw = campaignsSnap.val() || {};
  const usersRaw = usersSnap.val() || {};
  const attemptsRaw = attemptsSnap.val() || {};

  let totalCampaigns = 0;
  Object.values(campaignsRaw).forEach(companyData => {
    if (companyData && typeof companyData === 'object') {
      // Logic from extractCampaigns in challengeService.js
      if (companyData.title || companyData.isActive) totalCampaigns++; // Legacy check
      if (companyData.items) totalCampaigns += Object.keys(companyData.items).length;
    }
  });

  let totalParticipants = 0;
  Object.values(usersRaw).forEach(companyUsers => {
    if (companyUsers && typeof companyUsers === 'object') {
      totalParticipants += Object.keys(companyUsers).length;
    }
  });

  let totalAttempts = 0;
  let completedPuzzles = 0;
  let totalTime = 0;
  let solvedCount = 0;
  const solvedUserIds = new Set();

  Object.values(attemptsRaw).forEach(companyAttempts => {
    if (companyAttempts && typeof companyAttempts === 'object') {
      const attemptsList = Object.values(companyAttempts);
      totalAttempts += attemptsList.length;
      
      attemptsList.forEach(attempt => {
        if (attempt.status === "solved" || attempt.status === "Solved") {
          solvedCount++;
          totalTime += Number(attempt.completionTimeSec || 0);
          solvedUserIds.add(attempt.userId);
        }
      });
    }
  });

  const avgTime = solvedCount > 0 ? Math.round(totalTime / solvedCount) : 0;

  return {
    totalCampaigns,
    totalParticipants,
    completedPuzzles: solvedUserIds.size,
    avgCompletionTime: avgTime,
    totalCompanies: admins.length,
    totalAttempts: totalAttempts
  };
};

export const getSuperAdminRecentActivity = async () => {
  ensureDb();
  
  const [usersSnap, attemptsSnap] = await Promise.all([
    get(ref(realtimeDb, USERS_PATH)),
    get(ref(realtimeDb, ATTEMPTS_PATH))
  ]);

  const usersRaw = usersSnap.val() || {};
  const attemptsRaw = attemptsSnap.val() || {};
  
  const activities = [];

  // User Joins
  Object.entries(usersRaw).forEach(([companyId, companyUsers]) => {
    if (companyUsers && typeof companyUsers === 'object') {
      Object.entries(companyUsers).forEach(([userId, user]) => {
        activities.push({
          id: `user-${userId}`,
          type: 'join',
          title: 'New Participant Joined',
          description: `${user.name || 'A user'} just joined the platform.`,
          timestamp: Number(user.createdAt || 0),
          icon: '👤'
        });
      });
    }
  });

  // Puzzle Solves
  Object.entries(attemptsRaw).forEach(([companyId, companyAttempts]) => {
    if (companyAttempts && typeof companyAttempts === 'object') {
      Object.entries(companyAttempts).forEach(([attemptId, attempt]) => {
        if (attempt.status === "solved" || attempt.status === "Solved") {
          activities.push({
            id: `solve-${attemptId}`,
            type: 'solve',
            title: 'Puzzle Solved!',
            description: `${attempt.name || 'A user'} solved a puzzle in ${Math.floor(attempt.completionTimeSec / 60)}m ${attempt.completionTimeSec % 60}s.`,
            timestamp: Number(attempt.timestamp || 0),
            icon: '✅'
          });
        }
      });
    }
  });

  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
};

export const getSuperAdminLiveStatus = async () => {
  ensureDb();
  const attemptsSnap = await get(ref(realtimeDb, ATTEMPTS_PATH));
  const attemptsRaw = attemptsSnap.val() || {};
  
  const fiveMinsAgo = Date.now() - (5 * 60 * 1000);
  const activeUsers = new Set();

  Object.values(attemptsRaw).forEach(companyAttempts => {
    if (companyAttempts && typeof companyAttempts === 'object') {
      Object.values(companyAttempts).forEach(attempt => {
        if (Number(attempt.timestamp || 0) > fiveMinsAgo) {
          activeUsers.add(attempt.userId);
        }
      });
    }
  });

  return activeUsers.size;
};

import { get, push, ref, remove, set, update, onValue } from "firebase/database";
import { firebaseConfigured, realtimeDb } from "./firebaseClient";

const SPIN_WHEEL_PATH = "spin_wheels";
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

const normalizeSpinWheel = (data, companyId, wheelId) => ({
  wheelId,
  companyId,
  title: data?.title || "New Spin Wheel",
  isActive: Boolean(data?.isActive),
  timerSeconds: Number(data?.timerSeconds) || 60,
  maxAttempts: Number(data?.maxAttempts) || 1,
  wheelKey: data?.wheelKey || "",
  createdAt: Number(data?.createdAt) || Date.now(),
  updatedAt: Number(data?.updatedAt) || Date.now(),
});

export const getSpinWheels = async (companyId) => {
  ensureDb();
  const snapshot = await withTimeout(
    get(ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}`)),
    "Request timed out while loading spin wheels."
  );
  const raw = snapshot.val() || {};
  return Object.entries(raw)
    .map(([id, data]) => normalizeSpinWheel(data, companyId, id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getSpinWheel = async (companyId, wheelId = "", wheelKey = "") => {
  const wheels = await getSpinWheels(companyId);
  if (!wheels.length) return null;
  if (wheelId) return wheels.find((w) => w.wheelId === wheelId) || null;
  if (wheelKey) return wheels.find((w) => w.wheelKey === wheelKey) || null;
  return wheels[0];
};

export const saveSpinWheel = async (companyId, payload, wheelId = "") => {
  ensureDb();
  
  const next = {
    ...payload,
    updatedAt: Date.now(),
    createdAt: payload.createdAt || Date.now(),
    wheelKey: payload.wheelKey || Math.random().toString(36).slice(2, 10).toUpperCase(),
  };

  if (wheelId) {
    await withTimeout(
      set(ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}/${wheelId}`), next),
      "Request timed out while saving spin wheel."
    );
    return normalizeSpinWheel(next, companyId, wheelId);
  }

  const createdRef = push(ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}`));
  await withTimeout(
    set(createdRef, next),
    "Request timed out while saving spin wheel."
  );
  return normalizeSpinWheel(next, companyId, createdRef.key);
};

export const deleteSpinWheel = async (companyId, wheelId) => {
  ensureDb();
  await withTimeout(
    remove(ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}/${wheelId}`)),
    "Request timed out while deleting spin wheel."
  );
};

export const setSpinWheelLiveStatus = async (companyId, wheelId, isActive) => {
  ensureDb();
  await withTimeout(
    update(ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}/${wheelId}`), {
      isActive: Boolean(isActive),
      updatedAt: Date.now(),
    }),
    "Request timed out while updating spin wheel status."
  );
};

export const subscribeSpinWheels = (companyId, callback) => {
  ensureDb();
  const wheelsRef = ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}`);
  return onValue(wheelsRef, (snapshot) => {
    const raw = snapshot.val() || {};
    callback(
      Object.entries(raw)
        .map(([id, data]) => normalizeSpinWheel(data, companyId, id))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );
  });
};

export const subscribeSpinWheel = (companyId, wheelId, callback) => {
  ensureDb();
  const wheelRef = ref(realtimeDb, `${SPIN_WHEEL_PATH}/${companyId}/${wheelId}`);
  return onValue(wheelRef, (snapshot) => {
    callback(normalizeSpinWheel(snapshot.val(), companyId, wheelId));
  });
};

export const validateWheelAccess = async ({ companyId, wheelId, wheelKey }) => {
  const company = await getCompanyAdminById(companyId);
  if (!company) throw new Error("Invalid company link.");
  if (company.status === "Disabled") throw new Error("Company campaign disabled.");

  const wheel = await getSpinWheel(companyId, wheelId, wheelKey);
  if (!wheel) throw new Error("Invalid spin wheel link.");
  if (!wheel.isActive) throw new Error("Spin wheel is not active.");
  if (wheel.wheelKey && wheel.wheelKey !== (wheelKey || "")) {
    throw new Error("Invalid QR key.");
  }

  return { company, campaign: wheel };
};

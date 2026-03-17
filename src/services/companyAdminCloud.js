import { get, push, ref, remove, set, update } from "firebase/database";
import { firebaseConfigured, realtimeDb } from "./firebaseClient";

const COMPANY_ADMIN_PATH = "admins/company_admins";
const LEGACY_COMPANY_ADMIN_PATH = "companyAdmins";
const cacheKey = "company_admins_cache_v2";
const REQUEST_TIMEOUT_MS = 15000;

const toTimestamp = (value) => {
  if (Number.isFinite(Number(value))) {
    return Number(value);
  }

  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const sanitizeCompany = (data, id) => ({
  id,
  companyId: data?.companyId || id,
  name: data?.name || "",
  admin: data?.admin || "",
  email: data?.email || "",
  password: data?.password || "",
  campaigns: Number.isFinite(Number(data?.campaigns))
    ? Number(data.campaigns)
    : 0,
  status: data?.status === "Disabled" ? "Disabled" : "Active",
  createdAt: toTimestamp(data?.createdAt),
});

const sortByLatest = (rows) =>
  [...rows].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

const saveCache = (rows) => {
  localStorage.setItem(cacheKey, JSON.stringify(rows));
};

const readCache = () => {
  const raw = localStorage.getItem(cacheKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ensureRealtimeDb = () => {
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

const getAllAdminsRaw = async () => {
  ensureRealtimeDb();
  const snapshot = await withTimeout(
    get(ref(realtimeDb, COMPANY_ADMIN_PATH)),
    "Request timed out while loading company admins."
  );
  const primary = snapshot.val();
  if (primary && Object.keys(primary).length) {
    return primary;
  }

  const legacySnapshot = await withTimeout(
    get(ref(realtimeDb, LEGACY_COMPANY_ADMIN_PATH)),
    "Request timed out while loading legacy company admins."
  );
  return legacySnapshot.val() || {};
};

export const getCompanyAdmins = async () => {
  const raw = await getAllAdminsRaw();
  const rows = Object.entries(raw).map(([id, item]) => sanitizeCompany(item, id));
  const sorted = sortByLatest(rows);
  saveCache(sorted);
  return sorted;
};

export const getCompanyAdminById = async (companyId) => {
  ensureRealtimeDb();
  const snapshot = await withTimeout(
    get(ref(realtimeDb, `${COMPANY_ADMIN_PATH}/${companyId}`)),
    "Request timed out while loading company admin profile."
  );
  if (!snapshot.exists()) {
    return null;
  }
  return sanitizeCompany(snapshot.val(), companyId);
};

export const findCompanyAdminByCredentials = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const admins = await getCompanyAdmins();

  return (
    admins.find(
      (admin) =>
        admin.email.trim().toLowerCase() === normalizedEmail &&
        admin.password === normalizedPassword &&
        admin.status !== "Disabled"
    ) || null
  );
};

export const createCompanyAdmin = async (payload) => {
  ensureRealtimeDb();

  const createdRef = push(ref(realtimeDb, COMPANY_ADMIN_PATH));
  const companyId = createdRef.key;
  const record = {
    ...payload,
    companyId,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
    createdAt: Date.now(),
  };

  await withTimeout(
    set(createdRef, record),
    "Request timed out while creating company admin."
  );

  const created = sanitizeCompany(record, companyId);
  const next = sortByLatest([created, ...readCache()]);
  saveCache(next);
  return created;
};

export const updateCompanyAdmin = async (id, payload) => {
  ensureRealtimeDb();

  const body = {
    ...payload,
    companyId: payload.companyId || id,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
    createdAt: toTimestamp(payload.createdAt),
  };

  await withTimeout(
    update(ref(realtimeDb, `${COMPANY_ADMIN_PATH}/${id}`), body),
    "Request timed out while updating company admin."
  );

  const updated = sanitizeCompany(body, id);
  const next = readCache().map((row) => (row.id === id ? updated : row));
  saveCache(next);
  return updated;
};

export const deleteCompanyAdmin = async (id) => {
  ensureRealtimeDb();

  await withTimeout(
    remove(ref(realtimeDb, `${COMPANY_ADMIN_PATH}/${id}`)),
    "Request timed out while deleting company admin."
  );
  const next = readCache().filter((row) => row.id !== id);
  saveCache(next);
};

export const getCompanyAdminsCached = () => sortByLatest(readCache());

export const cloudCompanyAdminConfigured = () => firebaseConfigured;

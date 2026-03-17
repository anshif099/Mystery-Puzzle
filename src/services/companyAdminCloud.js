import { get, push, ref, remove, update } from "firebase/database";
import { firebaseConfigured, realtimeDb } from "./firebaseClient";

const COLLECTION_NAME = "companyAdmins";
const cacheKey = "company_admins_cache_v1";
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

export const getCompanyAdmins = async () => {
  ensureRealtimeDb();

  const snapshot = await withTimeout(
    get(ref(realtimeDb, COLLECTION_NAME)),
    "Request timed out while loading company admins."
  );
  const raw = snapshot.val();
  const rows = raw
    ? Object.entries(raw).map(([id, item]) => sanitizeCompany(item, id))
    : [];
  const sorted = sortByLatest(rows);
  saveCache(sorted);
  return sorted;
};

export const createCompanyAdmin = async (payload) => {
  ensureRealtimeDb();

  const record = {
    ...payload,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
    createdAt: Date.now(),
  };

  const createdRef = push(ref(realtimeDb, COLLECTION_NAME));
  await withTimeout(
    update(createdRef, record),
    "Request timed out while creating company admin."
  );

  const created = sanitizeCompany(record, createdRef.key);
  const next = sortByLatest([created, ...readCache()]);
  saveCache(next);
  return created;
};

export const updateCompanyAdmin = async (id, payload) => {
  ensureRealtimeDb();

  const body = {
    ...payload,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
    createdAt: toTimestamp(payload.createdAt),
  };

  await withTimeout(
    update(ref(realtimeDb, `${COLLECTION_NAME}/${id}`), body),
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
    remove(ref(realtimeDb, `${COLLECTION_NAME}/${id}`)),
    "Request timed out while deleting company admin."
  );
  const next = readCache().filter((row) => row.id !== id);
  saveCache(next);
};

export const getCompanyAdminsCached = () => sortByLatest(readCache());

export const cloudCompanyAdminConfigured = () => firebaseConfigured;

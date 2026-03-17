import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore/lite";
import { firebaseConfigured, firestoreDb } from "./firebaseClient";

const COLLECTION_NAME = "companyAdmins";
const cacheKey = "company_admins_cache_v1";
const REQUEST_TIMEOUT_MS = 15000;

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
  createdAt: Number.isFinite(Number(data?.createdAt))
    ? Number(data.createdAt)
    : Date.now(),
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

const ensureFirestore = () => {
  if (!firebaseConfigured || !firestoreDb) {
    throw new Error("Firebase is not configured.");
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
  ensureFirestore();

  const snapshot = await withTimeout(
    getDocs(collection(firestoreDb, COLLECTION_NAME)),
    "Request timed out while loading company admins."
  );
  const rows = snapshot.docs.map((item) =>
    sanitizeCompany(item.data(), item.id)
  );
  const sorted = sortByLatest(rows);
  saveCache(sorted);
  return sorted;
};

export const createCompanyAdmin = async (payload) => {
  ensureFirestore();

  const record = {
    ...payload,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
    createdAt: Date.now(),
  };

  const createdRef = await withTimeout(
    addDoc(collection(firestoreDb, COLLECTION_NAME), record),
    "Request timed out while creating company admin."
  );
  const created = sanitizeCompany(record, createdRef.id);
  const next = sortByLatest([created, ...readCache()]);
  saveCache(next);
  return created;
};

export const updateCompanyAdmin = async (id, payload) => {
  ensureFirestore();

  const body = {
    ...payload,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
  };

  await withTimeout(
    updateDoc(doc(firestoreDb, COLLECTION_NAME, id), body),
    "Request timed out while updating company admin."
  );
  const updated = sanitizeCompany(body, id);
  const next = readCache().map((row) => (row.id === id ? updated : row));
  saveCache(next);
  return updated;
};

export const deleteCompanyAdmin = async (id) => {
  ensureFirestore();

  await withTimeout(
    deleteDoc(doc(firestoreDb, COLLECTION_NAME, id)),
    "Request timed out while deleting company admin."
  );
  const next = readCache().filter((row) => row.id !== id);
  saveCache(next);
};

export const getCompanyAdminsCached = () => sortByLatest(readCache());

export const cloudCompanyAdminConfigured = () => firebaseConfigured;

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { firebaseConfigured, firestoreDb } from "./firebaseClient";

const COLLECTION_NAME = "companyAdmins";
const cacheKey = "company_admins_cache_v1";

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

export const getCompanyAdmins = async () => {
  ensureFirestore();

  const snapshot = await getDocs(collection(firestoreDb, COLLECTION_NAME));
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

  const createdRef = await addDoc(collection(firestoreDb, COLLECTION_NAME), record);
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

  await updateDoc(doc(firestoreDb, COLLECTION_NAME, id), body);
  const updated = sanitizeCompany(body, id);
  const next = readCache().map((row) => (row.id === id ? updated : row));
  saveCache(next);
  return updated;
};

export const deleteCompanyAdmin = async (id) => {
  ensureFirestore();

  await deleteDoc(doc(firestoreDb, COLLECTION_NAME, id));
  const next = readCache().filter((row) => row.id !== id);
  saveCache(next);
};

export const getCompanyAdminsCached = () => sortByLatest(readCache());

export const cloudCompanyAdminConfigured = () => firebaseConfigured;

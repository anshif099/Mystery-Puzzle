const CLOUD_BASE_URL = import.meta.env.VITE_COMPANY_ADMIN_API_URL;
const CLOUD_AUTH_TOKEN = import.meta.env.VITE_COMPANY_ADMIN_API_TOKEN;
const COLLECTION_PATH = "companyAdmins";

const cacheKey = "company_admins_cache_v1";

const isConfigured = () => Boolean(CLOUD_BASE_URL);

const buildUrl = (path = "") => {
  if (!isConfigured()) {
    throw new Error(
      "Cloud API is not configured. Set VITE_COMPANY_ADMIN_API_URL in your environment."
    );
  }

  const base = CLOUD_BASE_URL.endsWith("/")
    ? CLOUD_BASE_URL.slice(0, -1)
    : CLOUD_BASE_URL;
  const route = path ? `${COLLECTION_PATH}/${path}` : COLLECTION_PATH;
  const rawUrl = `${base}/${route}.json`;

  if (!CLOUD_AUTH_TOKEN) {
    return rawUrl;
  }

  return `${rawUrl}?auth=${encodeURIComponent(CLOUD_AUTH_TOKEN)}`;
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
  createdAt: data?.createdAt || new Date().toISOString(),
});

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

const sortByLatest = (rows) =>
  [...rows].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

export const getCompanyAdmins = async () => {
  const response = await fetch(buildUrl(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch company admins from cloud.");
  }

  const raw = await response.json();
  const rows = raw
    ? Object.entries(raw).map(([id, item]) => sanitizeCompany(item, id))
    : [];
  const sorted = sortByLatest(rows);
  saveCache(sorted);
  return sorted;
};

export const createCompanyAdmin = async (payload) => {
  const record = {
    ...payload,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
    createdAt: new Date().toISOString(),
  };

  const response = await fetch(buildUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error("Failed to create company admin.");
  }

  const result = await response.json();
  const created = sanitizeCompany(record, result.name);
  const next = sortByLatest([created, ...readCache()]);
  saveCache(next);
  return created;
};

export const updateCompanyAdmin = async (id, payload) => {
  const body = {
    ...payload,
    campaigns: Number(payload.campaigns || 0),
    status: payload.status === "Disabled" ? "Disabled" : "Active",
  };

  const response = await fetch(buildUrl(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Failed to update company admin.");
  }

  const updatedServerRecord = await response.json();
  const updated = sanitizeCompany(updatedServerRecord, id);
  const next = readCache().map((row) => (row.id === id ? updated : row));
  saveCache(next);
  return updated;
};

export const deleteCompanyAdmin = async (id) => {
  const response = await fetch(buildUrl(id), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to delete company admin.");
  }

  const next = readCache().filter((row) => row.id !== id);
  saveCache(next);
};

export const getCompanyAdminsCached = () => sortByLatest(readCache());

export const cloudCompanyAdminConfigured = isConfigured;

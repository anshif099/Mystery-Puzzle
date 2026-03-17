const SESSION_KEY = "mystery_puzzle_session_v1";

export const readSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const writeSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const sessionKey = SESSION_KEY;

const PLEX_TOKEN_KEY = "plex_token";
const PLEX_CLIENT_ID_KEY = "plex_client_id";

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore (e.g. storage disabled)
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getOrCreatePlexClientId(): string {
  const existing = safeLocalStorageGet(PLEX_CLIENT_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `client_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  safeLocalStorageSet(PLEX_CLIENT_ID_KEY, generated);
  return generated;
}

export function getPlexToken(): string | null {
  return safeLocalStorageGet(PLEX_TOKEN_KEY);
}

export function setPlexToken(token: string): void {
  safeLocalStorageSet(PLEX_TOKEN_KEY, token);
}

export function clearPlexToken(): void {
  safeLocalStorageRemove(PLEX_TOKEN_KEY);
}



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

async function tryGetTokenFromKeychain(): Promise<string | null> {
  const { safeInvoke } = await import("@/lib/tauri/invoke");
  const res = await safeInvoke<string | null>("plex_token_get");
  if (!res.ok) return null;
  return res.value ?? null;
}

async function trySetTokenToKeychain(token: string): Promise<boolean> {
  const { safeInvoke } = await import("@/lib/tauri/invoke");
  const res = await safeInvoke<void>("plex_token_set", { token });
  return res.ok;
}

async function tryDeleteTokenFromKeychain(): Promise<boolean> {
  const { safeInvoke } = await import("@/lib/tauri/invoke");
  const res = await safeInvoke<void>("plex_token_delete");
  return res.ok;
}

export async function getPlexToken(): Promise<string | null> {
  const keychainToken = await tryGetTokenFromKeychain();
  if (keychainToken) {
    // Ensure we don't leave a stale copy behind if we previously used localStorage.
    safeLocalStorageRemove(PLEX_TOKEN_KEY);
    return keychainToken;
  }

  return safeLocalStorageGet(PLEX_TOKEN_KEY);
}

export async function setPlexToken(token: string): Promise<void> {
  const storedInKeychain = await trySetTokenToKeychain(token);
  if (storedInKeychain) {
    safeLocalStorageRemove(PLEX_TOKEN_KEY);
    return;
  }

  safeLocalStorageSet(PLEX_TOKEN_KEY, token);
}

export async function clearPlexToken(): Promise<void> {
  await tryDeleteTokenFromKeychain();
  safeLocalStorageRemove(PLEX_TOKEN_KEY);
}



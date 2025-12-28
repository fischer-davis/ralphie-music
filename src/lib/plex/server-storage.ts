const PLEX_SERVER_URL_KEY = "plex_server_url";

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

export function normalizePlexServerUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const hadScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);

  // If user enters `host:32400`, assume http.
  const withScheme = hadScheme ? trimmed : `http://${trimmed}`;

  try {
    const url = new URL(withScheme);

    // Common case: user pastes just an IP/host. Plex PMS defaults to 32400.
    // Only apply this default when the user did NOT explicitly provide a scheme
    // (so `https://plex.example.com` can remain on 443 behind a proxy).
    if (!hadScheme && !url.port) {
      url.port = "32400";
    }

    // Remove trailing slash for consistent fetch paths.
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/+$/, "");
  } catch {
    // If it isn't a valid URL, return as-is; validation will fail later.
    return trimmed.replace(/\/+$/, "");
  }
}

export function getPlexServerUrl(): string | null {
  return safeLocalStorageGet(PLEX_SERVER_URL_KEY);
}

export function setPlexServerUrl(serverUrl: string): void {
  safeLocalStorageSet(PLEX_SERVER_URL_KEY, serverUrl);
}

export function clearPlexServerUrl(): void {
  safeLocalStorageRemove(PLEX_SERVER_URL_KEY);
}



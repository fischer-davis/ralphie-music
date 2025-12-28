import { getPlexHeaders } from "@/lib/plex/headers";
import { getOrCreatePlexClientId } from "@/lib/plex/storage";

const PLEX_TV_BASE = "https://plex.tv";

export type PlexPin = {
  id: number;
  code: string;
  expiresAt: string;
  authUrl: string;
};

function buildAuthUrl(code: string): string {
  const clientId = getOrCreatePlexClientId();

  // Plex expects these parameters in the hashbang portion (`#!?...`), not the normal querystring.
  // If they are put in `?query` before the hash, Plex may route to the home page and ignore them.
  const params = new URLSearchParams();
  params.set("clientID", clientId);
  params.set("code", code);
  params.set("context[device][product]", "Ralphie Music");
  params.set("context[device][platform]", "Tauri");

  return `https://app.plex.tv/auth#!?${params.toString()}`;
}

export async function createPlexPin(signal?: AbortSignal): Promise<PlexPin> {
  // Note: Plex device linking (`plex.tv/link`) expects the short code. Requesting
  // `strong=true` returns a longer code, which is not what we want for v1.
  const res = await fetch(`${PLEX_TV_BASE}/api/v2/pins`, {
    method: "POST",
    headers: getPlexHeaders(),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to create PIN (HTTP ${res.status})`);
  }

  const json = (await res.json()) as {
    id: number;
    code: string;
    expiresAt: string;
  };

  return {
    id: json.id,
    code: json.code,
    expiresAt: json.expiresAt,
    authUrl: buildAuthUrl(json.code),
  };
}

export async function pollPlexPinForToken(
  pin: Pick<PlexPin, "id" | "code">,
  options: {
    signal?: AbortSignal;
    intervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const intervalMs = options.intervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 2 * 60_000;

  const startedAt = Date.now();

  // Simple polling loop; we can optimize later with backoff + better status handling.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for Plex authorization");
    }

    const url = new URL(`${PLEX_TV_BASE}/api/v2/pins/${pin.id}`);
    url.searchParams.set("code", pin.code);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: getPlexHeaders(),
      signal: options.signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to poll PIN (HTTP ${res.status})`);
    }

    const json = (await res.json()) as { authToken?: string | null };
    if (json.authToken) return json.authToken;

    await new Promise<void>((resolve, reject) => {
      const handle = setTimeout(resolve, intervalMs);
      if (options.signal) {
        options.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(handle);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      }
    });
  }
}



import { getOrCreatePlexClientId } from "@/lib/plex/storage";

type PlexHeaderOptions = {
  token?: string | null;
  accept?: string;
};

/**
 * Minimal Plex headers for Plex API requests (Plex.tv + PMS).
 * Docs reference: https://developer.plex.tv/pms/
 */
export function getPlexHeaders(options: PlexHeaderOptions = {}): HeadersInit {
  const clientId = getOrCreatePlexClientId();

  const headers: Record<string, string> = {
    Accept: options.accept ?? "application/json",

    // Common Plex client identifiers:
    "X-Plex-Product": "Ralphie Music",
    "X-Plex-Version": "0.1.0",
    "X-Plex-Client-Identifier": clientId,
    "X-Plex-Platform": "Tauri",
    "X-Plex-Platform-Version": "2",
    "X-Plex-Device": "Desktop",
    "X-Plex-Device-Name": "Ralphie Music",
  };

  if (options.token) {
    headers["X-Plex-Token"] = options.token;
  }

  return headers;
}



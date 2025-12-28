import { getPlexHeaders } from "@/lib/plex/headers";
import { safeInvoke } from "@/lib/tauri/invoke";

export type PlexPmsIdentity = {
  friendlyName?: string | null;
  machineIdentifier?: string | null;
  version?: string | null;
};

export type PlexPmsIdentityErrorCode = "unreachable" | "auth_invalid" | "unknown";

export class PlexPmsIdentityError extends Error {
  code: PlexPmsIdentityErrorCode;
  constructor(code: PlexPmsIdentityErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function parseIdentityXml(xmlText: string): PlexPmsIdentity {
  // Typical response: <MediaContainer size="0" machineIdentifier="..." friendlyName="..." version="..."/>
  const machineIdentifier = /machineIdentifier="([^"]+)"/.exec(xmlText)?.[1] ?? null;
  const friendlyName = /friendlyName="([^"]+)"/.exec(xmlText)?.[1] ?? null;
  const version = /version="([^"]+)"/.exec(xmlText)?.[1] ?? null;
  return { machineIdentifier, friendlyName, version };
}

export async function getPmsIdentity(serverUrl: string, token: string): Promise<PlexPmsIdentity> {
  const fromTauri = await safeInvoke<string>("pms_identity_xml", { serverUrl, token });
  if (fromTauri.ok) return parseIdentityXml(fromTauri.value);

  // Browser/WebView fallback (may fail due to CORS depending on PMS config).
  try {
    const url = new URL(serverUrl);
    const headers = { ...getPlexHeaders({ token, accept: "application/xml" }) };

    // Some setups (reverse proxies) don't forward `/:/identity`. Try both.
    const candidates = ["/:/identity", "/identity"];

    let res: Response | null = null;
    let lastUrl = "";
    for (const path of candidates) {
      url.pathname = path;
      lastUrl = url.toString();
      // eslint-disable-next-line no-await-in-loop
      res = await fetch(lastUrl, { method: "GET", headers });
      if (res.status !== 404) break;
    }

    if (!res) {
      throw new PlexPmsIdentityError("unknown", "Failed to reach Plex server");
    }

    if (res.status === 401 || res.status === 403) {
      throw new PlexPmsIdentityError("auth_invalid", "Plex authorization is invalid or expired");
    }

    if (!res.ok) {
      throw new PlexPmsIdentityError(
        "unknown",
        `Plex server responded with HTTP ${res.status} for ${lastUrl} (check host/port; usually :32400)`
      );
    }

    const text = await res.text();
    return parseIdentityXml(text);
  } catch (e) {
    if (e instanceof PlexPmsIdentityError) throw e;
    throw new PlexPmsIdentityError(
      "unreachable",
      e instanceof Error ? e.message : "Could not reach Plex server"
    );
  }
}



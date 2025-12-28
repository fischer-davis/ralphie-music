import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getPmsIdentity, PlexPmsIdentityError } from "@/lib/plex/pms";
import { getPlexServerUrl, setPlexServerUrl } from "@/lib/plex/server-storage";

export type PlexServerStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "unreachable"
  | "auth_invalid";

export type PlexServerState = {
  status: PlexServerStatus;
  serverUrl: string | null;
  serverName: string | null;
  error: string | null;
};

export type PlexServerContextValue = PlexServerState & {
  connect: (serverUrl: string, token: string) => Promise<void>;
  retry: (token: string) => Promise<void>;
  setServerUrl: (serverUrl: string) => void;
  clearError: () => void;
};

const PlexServerContext = createContext<PlexServerContextValue | null>(null);

export function PlexServerProvider({ children }: { children: React.ReactNode }) {
  const [serverUrl, setServerUrlState] = useState<string | null>(() => getPlexServerUrl());
  const [status, setStatus] = useState<PlexServerStatus>(() => (serverUrl ? "disconnected" : "disconnected"));
  const [serverName, setServerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const setServerUrlLocal = useCallback((nextUrl: string) => {
    setPlexServerUrl(nextUrl);
    setServerUrlState(nextUrl);
  }, []);

  const connect = useCallback(
    async (nextUrl: string, token: string) => {
      setStatus("connecting");
      setError(null);
      setServerName(null);
      setServerUrlLocal(nextUrl);

      // Yield to allow React to paint the "Connecting…" state before any potentially
      // blocking native call happens.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      try {
        const identity = await getPmsIdentity(nextUrl, token);
        setServerName(identity.friendlyName ?? identity.machineIdentifier ?? nextUrl);
        setStatus("connected");
        setError(null);
      } catch (e) {
        if (e instanceof PlexPmsIdentityError) {
          setStatus(e.code === "auth_invalid" ? "auth_invalid" : "unreachable");
          setError(e.message);
          return;
        }

        setStatus("unreachable");
        setError(e instanceof Error ? e.message : "Failed to connect to Plex server");
      }
    },
    [setServerUrlLocal]
  );

  const retry = useCallback(
    async (token: string) => {
      if (!serverUrl) {
        setStatus("disconnected");
        setError("No server URL configured");
        return;
      }
      await connect(serverUrl, token);
    },
    [connect, serverUrl]
  );

  const value = useMemo<PlexServerContextValue>(
    () => ({
      status,
      serverUrl,
      serverName,
      error,
      connect,
      retry,
      setServerUrl: setServerUrlLocal,
      clearError,
    }),
    [status, serverUrl, serverName, error, connect, retry, setServerUrlLocal, clearError]
  );

  return <PlexServerContext.Provider value={value}>{children}</PlexServerContext.Provider>;
}

export function usePlexServer(): PlexServerContextValue {
  const ctx = useContext(PlexServerContext);
  if (!ctx) throw new Error("usePlexServer must be used within PlexServerProvider");
  return ctx;
}



import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearPlexToken, getPlexToken, setPlexToken } from "@/lib/plex/storage";
import type { PlexPin } from "@/lib/plex/pin";
import { createPlexPin, pollPlexPinForToken } from "@/lib/plex/pin";

type PlexAuthStatus = "loading" | "signed_out" | "signing_in" | "signed_in";

type PlexAuthState = {
  status: PlexAuthStatus;
  token: string | null;
  activePin: PlexPin | null;
  error: string | null;
};

type PlexAuthContextValue = PlexAuthState & {
  createPin: () => Promise<PlexPin>;
  pollForToken: (pin: Pick<PlexPin, "id" | "code">, signal?: AbortSignal) => Promise<string>;
  setToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const PlexAuthContext = createContext<PlexAuthContextValue | null>(null);

export function PlexAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [status, setStatus] = useState<PlexAuthStatus>("loading");
  const [activePin, setActivePin] = useState<PlexPin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const setToken = useCallback(async (nextToken: string) => {
    await setPlexToken(nextToken);
    setTokenState(nextToken);
    setStatus("signed_in");
    setActivePin(null);
    setError(null);
  }, []);

  const signOut = useCallback(async () => {
    await clearPlexToken();
    setTokenState(null);
    setStatus("signed_out");
    setActivePin(null);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const saved = await getPlexToken();
        if (!mounted) return;
        setTokenState(saved);
        setStatus(saved ? "signed_in" : "signed_out");
      } catch (e) {
        if (!mounted) return;
        setTokenState(null);
        setStatus("signed_out");
        setError(e instanceof Error ? e.message : "Failed to load Plex session");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const createPin = useCallback(async () => {
    try {
      setStatus("signing_in");
      setError(null);
      const pin = await createPlexPin();
      setActivePin(pin);
      return pin;
    } catch (e) {
      setStatus("signed_out");
      setActivePin(null);
      setError(e instanceof Error ? e.message : "Failed to start Plex sign-in");
      throw e;
    }
  }, []);

  const pollForToken = useCallback(
    async (pin: Pick<PlexPin, "id" | "code">, signal?: AbortSignal) => {
      try {
        setStatus("signing_in");
        setError(null);
        const authToken = await pollPlexPinForToken(pin, { signal });
        await setToken(authToken);
        return authToken;
      } catch (e) {
        // If polling fails, keep the user in signing-in state if they still have a PIN displayed.
        setError(e instanceof Error ? e.message : "Failed to complete Plex sign-in");
        throw e;
      }
    },
    [setToken]
  );

  const value = useMemo<PlexAuthContextValue>(
    () => ({
      status,
      token,
      activePin,
      error,
      createPin,
      pollForToken,
      setToken,
      signOut,
      clearError,
    }),
    [status, token, activePin, error, createPin, pollForToken, setToken, signOut, clearError]
  );

  return <PlexAuthContext.Provider value={value}>{children}</PlexAuthContext.Provider>;
}

export function usePlexAuth(): PlexAuthContextValue {
  const ctx = useContext(PlexAuthContext);
  if (!ctx) throw new Error("usePlexAuth must be used within PlexAuthProvider");
  return ctx;
}



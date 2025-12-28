import * as React from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { usePlexAuth } from "@/lib/plex/auth-context";

export function SignInScreen() {
  const { status, activePin, error, createPin, pollForToken, clearError } =
    usePlexAuth();
  const [isStarting, setIsStarting] = React.useState(false);
  const [isOpening, setIsOpening] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const start = React.useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearError();

    setIsStarting(true);
    try {
      const pin = await createPin();
      toast.message("Plex sign-in started", {
        description: "Open Plex and approve this app to continue.",
      });

      const controller = new AbortController();
      abortRef.current = controller;
      void pollForToken({ id: pin.id, code: pin.code }, controller.signal).then(
        () => {
          toast.success("Signed in to Plex");
        },
        (e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          toast.error("Plex sign-in failed", {
            description: e instanceof Error ? e.message : "Unknown error",
          });
        }
      );
    } finally {
      setIsStarting(false);
    }
  }, [clearError, createPin, pollForToken]);

  const openPlex = React.useCallback(async () => {
    if (!activePin) return;
    setIsOpening(true);
    try {
      await openUrl(activePin.authUrl);
    } catch (e) {
      toast.error("Could not open Plex", {
        description:
          e instanceof Error ? e.message : "Please open Plex in your browser.",
      });
    } finally {
      setIsOpening(false);
    }
  }, [activePin]);

  const openPlexLink = React.useCallback(async () => {
    setIsOpening(true);
    try {
      await openUrl("https://plex.tv/link");
    } catch (e) {
      toast.error("Could not open plex.tv/link", {
        description:
          e instanceof Error ? e.message : "Please open plex.tv/link manually.",
      });
    } finally {
      setIsOpening(false);
    }
  }, []);

  const copyCode = React.useCallback(async () => {
    if (!activePin) return;
    try {
      await navigator.clipboard.writeText(activePin.code);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy code");
    }
  }, [activePin]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Sign in to Plex</CardTitle>
          <CardDescription>
            Connect Ralphie Music to your Plex account to browse and play your
            music library.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {activePin ? (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="text-muted-foreground text-sm">Your code</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="font-mono text-2xl tracking-widest">
                    {activePin.code}
                  </div>
                  <Button variant="outline" onClick={copyCode}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Click <Kbd>Open Plex</Kbd> to approve the request. If Plex
                doesn’t land on the approval screen, open <Kbd>plex.tv/link</Kbd>{" "}
                and enter the code above.
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Click the button below to start the Plex device sign-in flow.
            </div>
          )}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3">
          <Button onClick={start} disabled={isStarting || status === "signing_in"}>
            {activePin ? "Restart" : "Start sign-in"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={openPlex}
              disabled={!activePin || isOpening}
            >
              Open Plex
            </Button>
            <Button
              variant="outline"
              onClick={openPlexLink}
              disabled={!activePin || isOpening}
            >
              plex.tv/link
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}



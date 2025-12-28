import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizePlexServerUrl } from "@/lib/plex/server-storage";

export type ServerConnectStatus = "idle" | "connecting" | "connected" | "unreachable" | "auth_invalid";

export function ServerConnectScreen(props: {
  initialServerUrl?: string | null;
  status: ServerConnectStatus;
  error: string | null;
  serverName?: string | null;
  onConnect: (serverUrl: string) => Promise<void> | void;
}) {
  const { initialServerUrl, status, error, serverName, onConnect } = props;

  const [serverUrl, setServerUrl] = React.useState(() => initialServerUrl ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const submit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const normalized = normalizePlexServerUrl(serverUrl);
      if (!normalized) {
        toast.error("Enter a Plex server URL");
        return;
      }
      setIsSubmitting(true);
      try {
        await onConnect(normalized);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onConnect, serverUrl]
  );

  const statusBadge = React.useMemo(() => {
    switch (status) {
      case "connected":
        return <Badge variant="secondary">Connected</Badge>;
      case "connecting":
        return <Badge>Connecting…</Badge>;
      case "auth_invalid":
        return <Badge variant="destructive">Auth invalid</Badge>;
      case "unreachable":
        return <Badge variant="destructive">Unreachable</Badge>;
      default:
        return <Badge variant="outline">Not connected</Badge>;
    }
  }, [status]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Connect to your Plex Media Server</CardTitle>
              <CardDescription>
                Enter your Plex server URL (including port 32400) so Ralphie Music can browse and
                play your library.
              </CardDescription>
            </div>
            <div className="pt-1">{statusBadge}</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-1">
              <div className="text-sm font-medium">Server URL</div>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.10:32400"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <div className="text-xs text-muted-foreground">
                Tip: You can paste `192.168.1.10:32400` and we’ll assume http.
              </div>
            </div>

            {serverName ? (
              <div className="text-sm text-muted-foreground">
                Connected to <span className="font-medium text-foreground">{serverName}</span>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || status === "connecting"}
                className="min-w-28"
              >
                {status === "connected" ? "Reconnect" : status === "connecting" ? "Connecting…" : "Connect"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => submit()}
                disabled={isSubmitting || status === "connecting"}
              >
                Retry
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          We only use this URL to talk to your Plex Media Server on your network.
        </CardFooter>
      </Card>
    </div>
  );
}



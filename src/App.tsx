import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { Spinner } from "./components/ui/spinner";
import { SignInScreen } from "@/components/plex/SignInScreen";
import { ServerConnectScreen } from "@/components/plex/ServerConnectScreen";
import { usePlexAuth } from "@/lib/plex/auth-context";
import { usePlexServer } from "@/lib/plex/server-context";

function App() {
  const { status, token, signOut } = usePlexAuth();
  const { status: serverStatus, serverUrl, serverName, error, connect } = usePlexServer();

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Loading…
        </div>
      </div>
    );
  }

  if (!token || status === "signed_out") {
    return <SignInScreen />;
  }

  if (serverStatus !== "connected") {
    return (
      <ServerConnectScreen
        initialServerUrl={serverUrl}
        status={
          serverStatus === "connecting"
            ? "connecting"
            : serverStatus === "auth_invalid"
              ? "auth_invalid"
              : serverStatus === "unreachable"
                ? "unreachable"
                : "idle"
        }
        serverName={serverName}
        error={error}
        onConnect={(url) => connect(url, token)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold">Ralphie Music</div>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-10 text-sm text-muted-foreground">
        Signed in and connected to {serverName ?? "your Plex server"}. Next up: library discovery and
        browsing.
      </div>
    </div>
  );
}

export default App;

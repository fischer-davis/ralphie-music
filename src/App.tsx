import { ModeToggle } from "./components/mode-toggle";
import { Button } from "./components/ui/button";
import { SignInScreen } from "@/components/plex/SignInScreen";
import { usePlexAuth } from "@/lib/plex/auth-context";

function App() {
  const { status, token, signOut } = usePlexAuth();

  if (!token || status === "signed_out") {
    return <SignInScreen />;
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
        Signed in. Next up: server selection/connection and library browsing.
      </div>
    </div>
  );
}

export default App;

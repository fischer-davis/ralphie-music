import { Button } from "./components/ui/button";
import { ModeToggle } from "./components/mode-toggle";

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col gap-4 items-center">
        <ModeToggle />
        <Button variant="default">Click Me</Button>
      </div>
    </div>
  );
}

export default App;

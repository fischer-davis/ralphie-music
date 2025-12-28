import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { PlexAuthProvider } from "@/lib/plex/auth-context";
import { PlexServerProvider } from "@/lib/plex/server-context";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <PlexAuthProvider>
        <PlexServerProvider>
          <App />
        </PlexServerProvider>
      </PlexAuthProvider>
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);

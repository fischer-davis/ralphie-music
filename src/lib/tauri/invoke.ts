import type { InvokeArgs } from "@tauri-apps/api/core";

function isProbablyTauri(): boolean {
  // Tauri injects internal globals at runtime; in a plain browser build these won't exist.
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

export async function safeInvoke<T>(
  command: string,
  args?: InvokeArgs
): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  if (!isProbablyTauri()) return { ok: false, error: new Error("Not running in Tauri") };

  try {
    const mod = await import("@tauri-apps/api/core");
    const value = (await mod.invoke(command, args)) as T;
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error };
  }
}



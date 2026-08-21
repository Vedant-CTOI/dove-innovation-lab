import { useEffect, useState } from "react";

/**
 * Reads ?state= and ?theme= from the URL so Argus's visual-audit.py
 * can capture every screen state × theme without clicking.
 */
export function useSpikeParams() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return {
    state: (params.get("state") as string) || "idle",
    theme: (params.get("theme") as string) || "light",
  };
}

/** Toggle that survives SSR-less first render and sets data-theme on <html>. */
export function useTheme(defaultTheme: "light" | "dark" = "light") {
  const [theme, setTheme] = useState(defaultTheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return { theme, setTheme };
}

/** Cycle through idle → loading → error → offline → reconnecting for demo. */
export function useStateCycle(initial: string = "idle") {
  const [state, setState] = useState(initial);
  return { state, setState };
}

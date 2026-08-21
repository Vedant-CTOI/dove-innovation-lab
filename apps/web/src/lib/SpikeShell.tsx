/**
 * Shared spike toolbar — lets you switch state (idle/loading/error/offline/reconnecting)
 * and theme (light/dark) so every state is reachable without code changes.
 * Each direction styles its own version; this is the behavioural shell.
 */
import { ReactNode } from "react";

export interface StateOption {
  value: string;
  label: string;
}

export const ALL_STATES: StateOption[] = [
  { value: "idle", label: "Idle" },
  { value: "loading", label: "Loading" },
  { value: "error", label: "Error" },
  { value: "offline", label: "Offline" },
  { value: "reconnecting", label: "Reconnecting" },
];

export function SpikeShell({
  state, setState, theme, setTheme, accent, children,
}: {
  state: string;
  setState: (s: string) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="spike-shell" data-theme={theme}>
      <div className="spike-shell__bar">
        <div className="spike-shell__group">
          <span className="spike-shell__label">State</span>
          {ALL_STATES.map((s) => (
            <button
              key={s.value}
              className={`spike-shell__btn ${state === s.value ? "is-active" : ""}`}
              onClick={() => setState(s.value)}
              data-active={state === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="spike-shell__group">
          <button
            className={`spike-shell__btn ${theme === "light" ? "is-active" : ""}`}
            onClick={() => setTheme("light")}
          >Light</button>
          <button
            className={`spike-shell__btn ${theme === "dark" ? "is-active" : ""}`}
            onClick={() => setTheme("dark")}
          >Dark</button>
        </div>
        <span className="spike-shell__dot" style={{ background: accent }} />
      </div>
      <div className="spike-shell__content">{children}</div>
    </div>
  );
}

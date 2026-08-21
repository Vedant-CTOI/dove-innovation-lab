import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/archivo";
import "./terminal.css";

import { SpikeShell } from "../../lib/SpikeShell";
import "../../lib/spike-shell.css";
import { TerminalTeamSelection } from "./TerminalTeamSelection";
import { TerminalNewsroom } from "./TerminalNewsroom";

export default function Terminal() {
  const { pathname } = useLocation();
  const [state, setState] = useState("idle");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  return (
    <SpikeShell state={state} setState={setState} theme={theme} setTheme={setTheme} accent="#4af2a3">
      <div className="tm">
        <nav className="tm__subnav">
          <Link to="/_spikes/terminal" className={`tm__subnav-link ${pathname === "/_spikes/terminal" ? "is-here" : ""}`}>S-01</Link>
          <Link to="/_spikes/terminal/newsroom" className={`tm__subnav-link ${pathname === "/_spikes/terminal/newsroom" ? "is-here" : ""}`}>S-03</Link>
          <span className="tm__subnav-cwd">~/broadcast</span>
        </nav>
        <Routes>
          <Route path="/" element={<TerminalTeamSelection state={state} />} />
          <Route path="/newsroom" element={<TerminalNewsroom state={state} />} />
        </Routes>
      </div>
    </SpikeShell>
  );
}

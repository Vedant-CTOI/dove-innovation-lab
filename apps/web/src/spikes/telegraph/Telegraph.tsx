import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./telegraph.css";

import { SpikeShell } from "../../lib/SpikeShell";
import "../../lib/spike-shell.css";
import { TelegraphTeamSelection } from "./TelegraphTeamSelection";
import { TelegraphNewsroom } from "./TelegraphNewsroom";

export default function Telegraph() {
  const { pathname } = useLocation();
  const [state, setState] = useState("idle");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  return (
    <SpikeShell state={state} setState={setState} theme={theme} setTheme={setTheme} accent="#c4391b">
      <div className="tg">
        <nav className="tg__subnav">
          <Link to="/_spikes/telegraph" className={`tg__subnav-link ${pathname === "/_spikes/telegraph" ? "is-here" : ""}`}>S-01 Team Selection</Link>
          <Link to="/_spikes/telegraph/newsroom" className={`tg__subnav-link ${pathname === "/_spikes/telegraph/newsroom" ? "is-here" : ""}`}>S-03 The Newsroom</Link>
        </nav>
        <Routes>
          <Route path="/" element={<TelegraphTeamSelection state={state} />} />
          <Route path="/newsroom" element={<TelegraphNewsroom state={state} />} />
        </Routes>
      </div>
    </SpikeShell>
  );
}

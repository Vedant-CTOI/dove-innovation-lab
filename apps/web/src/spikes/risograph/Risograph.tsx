import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/outfit";
import "@fontsource-variable/space-grotesk";
import "./risograph.css";

import { SpikeShell } from "../../lib/SpikeShell";
import "../../lib/spike-shell.css";
import { RisographTeamSelection } from "./RisographTeamSelection";
import { RisographNewsroom } from "./RisographNewsroom";

export default function Risograph() {
  const { pathname } = useLocation();
  const [state, setState] = useState("idle");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  return (
    <SpikeShell state={state} setState={setState} theme={theme} setTheme={setTheme} accent="#ff5e3a">
      <div className="rg">
        <nav className="rg__subnav">
          <Link to="/_spikes/risograph" className={`rg__subnav-link ${pathname === "/_spikes/risograph" ? "is-here" : ""}`}>S-01</Link>
          <Link to="/_spikes/risograph/newsroom" className={`rg__subnav-link ${pathname === "/_spikes/risograph/newsroom" ? "is-here" : ""}`}>S-03</Link>
          <span className="rg__subnav-label">RISO</span>
        </nav>
        <Routes>
          <Route path="/" element={<RisographTeamSelection state={state} />} />
          <Route path="/newsroom" element={<RisographNewsroom state={state} />} />
        </Routes>
      </div>
    </SpikeShell>
  );
}

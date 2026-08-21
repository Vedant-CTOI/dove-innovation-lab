import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Telegraph from "./spikes/telegraph/Telegraph";
import Terminal from "./spikes/terminal/Terminal";
import Risograph from "./spikes/risograph/Risograph";

import "./index-spike.css";

export default function App() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<IndexSpike />} />
      <Route path="/_spikes/telegraph/*" element={<Telegraph />} />
      <Route path="/_spikes/terminal/*" element={<Terminal />} />
      <Route path="/_spikes/risograph/*" element={<Risograph />} />
    </Routes>
  );
}

function IndexSpike() {
  return (
    <div className="index-spike">
      <header className="index-spike__header">
        <p className="index-spike__eyebrow">Stage 3 — Art Direction</p>
        <h1 className="index-spike__title">Three Directions</h1>
        <p className="index-spike__sub">
          S-01 Team Selection &amp; S-03 The Newsroom (Big Screen + QR).
          Real code, self-hosted variable type, real motion.
        </p>
      </header>
      <nav className="index-spike__nav">
        <Link className="index-spike__link index-spike__link--telegraph" to="/_spikes/telegraph">Telegraph<br /><span>Editorial Broadside</span></Link>
        <Link className="index-spike__link index-spike__link--terminal" to="/_spikes/terminal">Terminal<br /><span>Broadcast Console</span></Link>
        <Link className="index-spike__link index-spike__link--risograph" to="/_spikes/risograph">Risograph<br /><span>Workshop Poster</span></Link>
      </nav>
      <footer className="index-spike__footer">
        <span>Iris — Art Director · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

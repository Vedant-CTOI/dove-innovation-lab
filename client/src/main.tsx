/* ═══════════════════════════════════════════════════════════
   main.tsx — Vite entry point
   Mounts RouterProvider + QueryClientProvider.
   Imports global styles (brand-tokens.css, fonts.css, globals.css).
   ═══════════════════════════════════════════════════════════ */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./lib/router";
import { queryClient } from "./lib/query";

/* Global styles — Vite processes these through Tailwind v4 plugin.
   brand-tokens.css (CSS variables) → fonts.css (@font-face) → globals.css (Tailwind theme + base + utilities) */
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

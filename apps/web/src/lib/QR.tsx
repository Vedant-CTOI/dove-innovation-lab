import { useMemo } from "react";

/**
 * Deterministic pseudo-QR for spike purposes.
 * Generates a visually convincing QR-like grid from a string seed.
 * NOT a real QR encoder — this is a design spike, not production code.
 */
export function FakeQR({ seed, size = 200, fg = "currentColor", bg = "transparent" }: {
  seed: string;
  size?: number;
  fg?: string;
  bg?: string;
}) {
  const modules = 25;
  const cell = size / modules;

  const grid = useMemo(() => {
    // Simple hash → pseudo-random grid
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    const rng = mulberry32(hash);
    const g: boolean[][] = [];
    for (let r = 0; r < modules; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < modules; c++) {
        // Skip finder pattern corners
        if (isFinder(r, c, modules)) continue;
        row.push(rng() > 0.5);
      }
      g.push(row);
    }
    return g;
  }, [seed]);

  const rects: string[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (isFinder(r, c, modules)) continue;
      if (grid[r][c]) {
        rects.push(`<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" />`);
      }
    }
  }

  // Finder patterns (3 corners)
  const finders = [
    [0, 0], [0, modules - 7], [modules - 7, 0],
  ];
  const finderRects = finders.map(([fr, fc]) => {
    const x = fc * cell, y = fr * cell;
    const s = 7 * cell;
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="${fg}" stroke-width="${cell}" />` +
           `<rect x="${x + 2 * cell}" y="${y + 2 * cell}" width="${3 * cell}" height="${3 * cell}" />`;
  }).join("");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill={fg}
      style={{ background: bg, display: "block" }}
      aria-label="QR code"
      role="img"
      dangerouslySetInnerHTML={{ __html: rects.join("") + finderRects }}
    />
  );
}

function isFinder(r: number, c: number, n: number): boolean {
  const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
  return inBox(0, 0) || inBox(0, n - 7) || inBox(n - 7, 0);
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import type { CSSProperties, HTMLAttributes } from "react";

/* ──────────────────────────────────────────────────────────
   NoiseOverlay — subtle noise texture on dark surfaces.
   SVG-based fractal noise, mix-blend overlay for depth.
   Applied via CSS class .noise-overlay (in globals.css) or
   directly as a standalone component.
   ────────────────────────────────────────────────────────── */

export interface NoiseOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Opacity of the noise (0-1, default 0.04) */
  opacity?: number;
  /** Blend mode (default: overlay) */
  blendMode?: "overlay" | "screen" | "multiply" | "soft-light";
  /** Noise tile size in px (default 256) */
  tileSize?: number;
  /** Children render above the noise */
  children?: React.ReactNode;
}

export function NoiseOverlay({
  opacity = 0.04,
  blendMode = "overlay",
  tileSize = 256,
  className = "",
  children,
  ...rest
}: NoiseOverlayProps) {
  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity,
    mixBlendMode: blendMode,
    backgroundImage: 'url("/img/noise-texture.svg")',
    backgroundSize: `${tileSize}px ${tileSize}px`,
    backgroundRepeat: "repeat",
    borderRadius: "inherit",
    zIndex: 1,
  };

  return (
    <div className={["relative", className].join(" ")} {...rest}>
      {children}
      <div style={overlayStyle} aria-hidden="true" />
    </div>
  );
}

/** Standalone noise texture div — for applying to any surface */
export function NoiseTexture({
  opacity = 0.04,
  blendMode = "overlay" as const,
  tileSize = 256,
}: {
  opacity?: number;
  blendMode?: "overlay" | "screen" | "multiply" | "soft-light";
  tileSize?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        mixBlendMode: blendMode,
        backgroundImage: 'url("/img/noise-texture.svg")',
        backgroundSize: `${tileSize}px ${tileSize}px`,
        backgroundRepeat: "repeat",
        borderRadius: "inherit",
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  );
}

/* ──────────────────────────────────────────────────────────
   particles.ts — Brand-coded canvas particle system
   Pulp droplets · Glow orbs · Leaf motes · Amber sparks
   NOT generic circles — each type has distinct brand-coded shape
   and motion behavior.
   ────────────────────────────────────────────────────────── */

// ── Brand colors (must match brand-tokens.css exactly) ──
const COLORS = {
  pulpyOrange: "#F08810",
  orangeDeep: "#DC8800",
  orangeDark: "#C46A00",
  orangeLight: "#F8A820",
  pulpGold: "#FCBC00",
  pulpLight: "#FFE08A",
  leafGreen: "#008040",
  night: "#0A0F14",
  ink: "#101820",
} as const;

export type ParticleKind = "droplet" | "orb" | "leaf" | "spark";

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  pulsePhase: number;
  color: string;
  // kind-specific
  dripPhase?: number;
  sparkLife?: number;
}

/* ── Factory: create a particle of a specific kind ── */
export function createParticle(
  kind: ParticleKind,
  width: number,
  height: number,
): Particle {
  const base = {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    opacity: 0.3 + Math.random() * 0.5,
    pulsePhase: Math.random() * Math.PI * 2,
  };

  switch (kind) {
    case "droplet":
      // Pulp droplet — teardrop shape, slow drift downward
      return {
        ...base,
        kind,
        size: 3 + Math.random() * 5,
        color: [COLORS.pulpGold, COLORS.pulpyOrange, COLORS.orangeLight][
          Math.floor(Math.random() * 3)
        ],
        vy: 0.05 + Math.random() * 0.15, // gentle downward
        vx: (Math.random() - 0.5) * 0.1,
        dripPhase: Math.random() * Math.PI * 2,
      };
    case "orb":
      // Glow orb — large soft circle, pulsing
      return {
        ...base,
        kind,
        size: 40 + Math.random() * 60,
        color: [COLORS.pulpGold, COLORS.pulpyOrange][
          Math.floor(Math.random() * 2)
        ],
        opacity: 0.03 + Math.random() * 0.06,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
      };
    case "leaf":
      // Leaf mote — small leaf shape, swaying
      return {
        ...base,
        kind,
        size: 4 + Math.random() * 6,
        color: COLORS.leafGreen,
        opacity: 0.1 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.05 - Math.random() * 0.1, // gentle upward (floating)
        rotSpeed: (Math.random() - 0.5) * 0.04,
      };
    case "spark":
      // Amber spark — tiny, fast, short-lived
      return {
        ...base,
        kind,
        size: 1 + Math.random() * 2,
        color: [COLORS.pulpLight, COLORS.pulpGold][
          Math.floor(Math.random() * 2)
        ],
        opacity: 0.6 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        sparkLife: 1.0,
      };
  }
}

/* ── Update particle physics ── */
export function updateParticle(p: Particle, width: number, height: number, dt: number) {
  p.x += p.vx * dt * 60;
  p.y += p.vy * dt * 60;
  p.rotation += p.rotSpeed * dt * 60;
  p.pulsePhase += dt * 2;

  // Wrap around edges
  if (p.x < -p.size) p.x = width + p.size;
  if (p.x > width + p.size) p.x = -p.size;
  if (p.y < -p.size) p.y = height + p.size;
  if (p.y > height + p.size) p.y = -p.size;

  // Kind-specific updates
  if (p.kind === "spark" && p.sparkLife !== undefined) {
    p.sparkLife -= dt * 0.5;
    p.opacity = Math.max(0, p.sparkLife * 0.8);
    // Random direction jitter
    p.vx += (Math.random() - 0.5) * 0.1;
    p.vy += (Math.random() - 0.5) * 0.1;
  }

  if (p.kind === "orb") {
    // Pulse opacity
    p.opacity = 0.03 + Math.abs(Math.sin(p.pulsePhase)) * 0.04;
  }

  if (p.kind === "leaf") {
    // Sway left-right
    p.vx += Math.sin(p.pulsePhase) * 0.005;
  }
}

/* ── Draw a single particle by kind ── */
export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.opacity;

  switch (p.kind) {
    case "droplet":
      drawDroplet(ctx, p);
      break;
    case "orb":
      drawOrb(ctx, p);
      break;
    case "leaf":
      drawLeaf(ctx, p);
      break;
    case "spark":
      drawSpark(ctx, p);
      break;
  }

  ctx.restore();
}

/* ── Pulp droplet: teardrop with gradient fill ── */
function drawDroplet(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.rotate(p.rotation);
  const s = p.size;
  const drip = p.dripPhase !== undefined
    ? 1 + Math.sin(p.dripPhase + p.pulsePhase) * 0.1
    : 1;

  // Gradient fill — pulp gold to orange
  const grad = ctx.createRadialGradient(0, -s * 0.3, 0, 0, 0, s * drip);
  grad.addColorStop(0, COLORS.pulpLight);
  grad.addColorStop(0.5, p.color);
  grad.addColorStop(1, COLORS.orangeDeep);
  ctx.fillStyle = grad;

  // Teardrop shape
  ctx.beginPath();
  ctx.moveTo(0, -s * drip);
  ctx.bezierCurveTo(s * 0.8, -s * drip * 0.5, s * 0.8, s * 0.5, 0, s * drip);
  ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.8, -s * drip * 0.5, 0, -s * drip);
  ctx.closePath();
  ctx.fill();

  // Highlight dot
  ctx.fillStyle = COLORS.pulpLight;
  ctx.globalAlpha = p.opacity * 0.6;
  ctx.beginPath();
  ctx.arc(-s * 0.2, -s * 0.3, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Glow orb: large soft radial gradient, pulsing ── */
function drawOrb(ctx: CanvasRenderingContext2D, p: Particle) {
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
  grad.addColorStop(0, p.color);
  grad.addColorStop(0.4, p.color + "40");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, p.size, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Leaf mote: small leaf shape, green ── */
function drawLeaf(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.rotate(p.rotation);
  const s = p.size;

  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vein line
  ctx.strokeStyle = COLORS.pulpGold;
  ctx.globalAlpha = p.opacity * 0.3;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(0, s);
  ctx.stroke();
}

/* ── Amber spark: tiny glowing dot ── */
function drawSpark(ctx: CanvasRenderingContext2D, p: Particle) {
  const s = p.size;

  // Glow halo
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 4);
  grad.addColorStop(0, p.color);
  grad.addColorStop(0.3, p.color + "60");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, s * 4, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Particle pool initializer ── */
export function initParticles(width: number, height: number): Particle[] {
  const pool: Particle[] = [];

  // ~15 droplets
  for (let i = 0; i < 15; i++) pool.push(createParticle("droplet", width, height));
  // ~5 glow orbs
  for (let i = 0; i < 5; i++) pool.push(createParticle("orb", width, height));
  // ~8 leaf motes
  for (let i = 0; i < 8; i++) pool.push(createParticle("leaf", width, height));
  // ~12 amber sparks
  for (let i = 0; i < 12; i++) pool.push(createParticle("spark", width, height));

  return pool;
}

/* ── Spawn a new spark (for burst effects) ── */
export function spawnSpark(x: number, y: number): Particle {
  return {
    kind: "spark",
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    size: 1 + Math.random() * 3,
    rotation: 0,
    rotSpeed: 0,
    opacity: 0.8,
    pulsePhase: 0,
    color: Math.random() > 0.5 ? COLORS.pulpGold : COLORS.pulpLight,
    sparkLife: 1.0,
  };
}

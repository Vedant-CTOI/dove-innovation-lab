import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "./motion";

/* ──────────────────────────────────────────────────────────
   QRCard — QR code prominently displayed with timer directly
   under it (per visual-benchmark contract). Brand gradient border,
   glass morphism, layered shadows, noise overlay.
   ────────────────────────────────────────────────────────── */

export interface QRCardProps {
  /** The URL the QR code encodes */
  value: string;
  /** Room code displayed prominently */
  roomCode: string;
  /** Optional timer element rendered below the QR */
  timer?: ReactNode;
  /** Title/label for the card */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  className?: string;
}

export function QRCard({
  value,
  roomCode,
  timer,
  title = "Scan to Join",
  subtitle = "Point your camera at the code",
  className = "",
}: QRCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Generate a real QR code using qr-code-styling
  useEffect(() => {
    let qr: { append: (el: HTMLElement) => void } | null = null;

    // Dynamic import so missing package doesn't crash the app
    import("qr-code-styling")
      .then(({ default: QRCodeStyling }) => {
        if (!containerRef.current) return;
        // Clear any previous QR
        containerRef.current.innerHTML = "";
        qr = new QRCodeStyling({
          width: 200,
          height: 200,
          type: "svg",
          data: value,
          qrOptions: {
            errorCorrectionLevel: "M",
          },
          dotsOptions: {
            color: "#F08810",
            type: "dots",
          },
          backgroundOptions: {
            color: "#0A0F14",
          },
          cornersSquareOptions: {
            color: "#FCBC00",
            type: "extra-rounded",
          },
          cornersDotOptions: {
            color: "#FCBC00",
            type: "dot",
          },
        });
        qr.append(containerRef.current);
      })
      .catch(() => {
        // Fallback: draw a placeholder if qr-code-styling not available
        if (!containerRef.current) return;
        containerRef.current.innerHTML =
          '<div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;background:#0A0F14;color:#FCBC00;font-family:sans-serif;font-size:12px;text-align:center;padding:1rem">QR unavailable</div>';
      });

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={SPRING.bounce}
      className={[
        "relative inline-flex flex-col items-center gap-4 p-6",
        "glass noise-overlay rounded-[var(--radius-xl)]",
        "shadow-[0_0_0_1px_rgba(252,188,0,0.08),0_8px_24px_rgba(0,0,0,0.40),0_24px_48px_rgba(0,0,0,0.30),0_48px_96px_rgba(0,0,0,0.20)]",
        className,
      ].join(" ")}
    >
      {/* Pulp glow behind QR */}
      <div className="absolute -inset-4 bg-pulp-gradient opacity-10 blur-2xl rounded-[var(--radius-2xl)]" />

      {/* Title */}
      <div className="relative z-10 text-center" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
        <h3 className="font-display text-xl font-bold text-cream">{title}</h3>
        <p className="font-body text-sm text-cream/50">{subtitle}</p>
      </div>

      {/* QR Canvas — branded border, nested radius */}
      <div
        className="relative z-10 p-3 bg-juice-gradient rounded-[var(--radius-lg)] shadow-[0_2px_6px_rgba(196,106,0,0.20),0_6px_16px_rgba(240,136,16,0.15),0_12px_32px_rgba(196,106,0,0.08)]"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div
          className="bg-night rounded-[var(--radius-md)] p-3 relative"
          style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}
        >
          <div ref={containerRef} className="block" style={{ width: 200, height: 200 }} />
          {/* Brand corner marks — orange accents on QR corners */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-pulp-gold rounded-tl-sm" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-pulp-gold rounded-tr-sm" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-pulp-gold rounded-bl-sm" />
        </div>
      </div>

      {/* Room code — Fredoka accent, large */}
      <div className="relative z-10 text-center">
        <p className="font-body text-xs uppercase tracking-wider text-cream/40 mb-1">
          Room Code
        </p>
        <p className="font-accent text-4xl font-bold text-juice-gradient">
          {roomCode}
        </p>
      </div>

      {/* Timer directly under the QR (per visual-benchmark) */}
      {timer && (
        <div className="relative z-10">
          {timer}
        </div>
      )}

      {/* Subtle pulse ring when not reduced motion */}
      {!prefersReduced && (
        <motion.div
          className="absolute inset-0 rounded-[var(--radius-xl)] border-2 border-pulp-gold/20 pointer-events-none"
          animate={{ opacity: [0.2, 0, 0.2], scale: [1, 1.02, 1] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

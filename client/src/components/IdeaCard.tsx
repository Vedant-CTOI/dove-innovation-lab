import { useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Input } from "./Input";
import { PulpBurst, type PulpBurstHandle } from "./PulpBurst";
import { SPRING } from "./motion";

/* ──────────────────────────────────────────────────────────
   IdeaCard — sticky note style, with pulp-burst on submit.
   Brand gradient fills, spring/overshoot entrance,
   layered shadows, nested radii. Editable in Ideate phase only.
   ────────────────────────────────────────────────────────── */

export interface Idea {
  id: string;
  text: string;
  team: string;
  flavour: string;
  author: string;
  createdAt: string;
  votes?: number;
}

export interface IdeaCardProps {
  idea: Idea;
  /** Whether the idea can be edited (status == Ideate) */
  editable?: boolean;
  /** Whether the current user is the author */
  isAuthor?: boolean;
  /** Called when idea is saved (new or edited) */
  onSave?: (text: string) => void;
  /** Called when idea is submitted (triggers pulp burst) */
  onSubmit?: (text: string) => void;
  /** Preview mode — no interactions */
  preview?: boolean;
  className?: string;
}

const FLAVOUR_COLORS: Record<string, { bg: string; badge: "pulp" | "sky" | "berry" | "leaf" | "ink" }> = {
  classic: { bg: "bg-pulp-gradient", badge: "pulp" },
  tropical: { bg: "bg-leaf-green", badge: "leaf" },
  mixed: { bg: "bg-label-sky", badge: "sky" },
  berry: { bg: "bg-berry-red", badge: "berry" },
};

export function IdeaCard({
  idea,
  editable = false,
  isAuthor = false,
  onSave,
  onSubmit,
  preview = false,
  className = "",
}: IdeaCardProps) {
  const prefersReduced = useReducedMotion();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(idea.text);
  const burstRef = useRef<PulpBurstHandle>(null);

  const flavour = FLAVOUR_COLORS[idea.flavour] || FLAVOUR_COLORS.classic;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Trigger pulp burst!
    burstRef.current?.trigger();

    // Wait for burst to start, then call callbacks
    const action = isEditing ? onSave : onSubmit;
    if (action) action(text.trim());

    if (isEditing) {
      setIsEditing(false);
    } else {
      setText("");
    }
  };

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 30, rotate: -2, scale: 0.9 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -20 }}
      transition={SPRING.overshoot}
      whileHover={!preview ? { y: -4, rotate: prefersReduced ? 0 : 0.5 } : undefined}
      className={[
        "relative overflow-visible",
        flavour.bg,
        "rounded-[var(--radius-lg)] p-4",
        "shadow-[0_2px_4px_rgba(196,106,0,0.12),0_8px_16px_rgba(240,136,16,0.10),0_16px_32px_rgba(196,106,0,0.06),0_32px_64px_rgba(16,24,32,0.04)]",
        "noise-overlay",
        className,
      ].join(" ")}
      style={{
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Pulp burst overlay */}
      <PulpBurst ref={burstRef} className="z-20" count={20} />

      {/* Inner content with nested radius */}
      <div
        className="relative z-10 flex flex-col gap-3"
        style={{
          borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
        }}
      >
        {/* Header: author + team + flavour */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={flavour.badge} size="sm">
              {idea.team}
            </Badge>
            <span className="font-body text-xs text-ink/50">
              {idea.author}
            </span>
          </div>
          {editable && isAuthor && !preview && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-accent font-medium text-orange-dark/60 hover:text-orange-dark transition-colors"
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          )}
        </div>

        {/* Body: idea text or editor */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.form
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-2"
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                size="sm"
                placeholder="Type your idea..."
                className="bg-white/90"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="primary">
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-body text-sm text-ink/80 leading-relaxed"
            >
              {idea.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
   IdeaSubmitForm — standalone submission form with pulp-burst
   ────────────────────────────────────────────────────────── */

export interface IdeaSubmitFormProps {
  onSubmit: (text: string) => void;
  team: string;
  author: string;
  flavour?: string;
  className?: string;
}

export function IdeaSubmitForm({
  onSubmit,
  team,
  author,
  className = "",
}: IdeaSubmitFormProps) {
  const prefersReduced = useReducedMotion();
  const [text, setText] = useState("");
  const burstRef = useRef<PulpBurstHandle>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // PULP BURST!
    burstRef.current?.trigger();

    onSubmit(text.trim());
    setText("");
  };

  return (
    <motion.form
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={SPRING.gentle}
      onSubmit={handleSubmit}
      className={[
        "relative overflow-visible",
        "bg-cream rounded-[var(--radius-lg)] p-5",
        "shadow-[0_2px_4px_rgba(196,106,0,0.08),0_8px_16px_rgba(240,136,16,0.06),0_16px_32px_rgba(196,106,0,0.04)]",
        className,
      ].join(" ")}
      style={{
        borderRadius: "var(--radius-lg)",
      }}
    >
      <PulpBurst ref={burstRef} className="z-20" count={24} />

      <div
        className="relative z-10 flex flex-col gap-3"
        style={{
          borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
        }}
      >
        <div className="flex items-center gap-2">
          <Badge variant="pulp" size="sm">{team}</Badge>
          <span className="font-body text-xs text-ink/50">{author}</span>
        </div>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Shake up an idea..."
          size="md"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!text.trim()}
        >
          Submit Idea
        </Button>
      </div>
    </motion.form>
  );
}

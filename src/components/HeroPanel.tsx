import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { HeroState } from "../types";

interface HeroPanelProps {
  hero: HeroState;
  side: "top" | "bottom";
  canUsePower?: boolean;
  powerTargetable?: boolean;
  onUsePower?: () => void;
  targetableAsEnemy?: boolean;
  onSelectAsTarget?: () => void;
  flashDamage?: number;
}

export function HeroPanel({
  hero,
  side,
  canUsePower,
  onUsePower,
  targetableAsEnemy,
  onSelectAsTarget,
}: HeroPanelProps) {
  const lowHealth = hero.health <= 10;
  return (
    <div className={clsx("flex items-center gap-3", side === "top" ? "flex-row" : "flex-row")}>
      <button
        type="button"
        onClick={onSelectAsTarget}
        disabled={!targetableAsEnemy}
        className={clsx(
          "relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center",
          "bg-gradient-to-b from-void-soft to-void border-2",
          targetableAsEnemy ? "border-blood-bright targetable" : "border-ember/70",
          "shadow-lg"
        )}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full rune-ring opacity-40">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#D4A24C" strokeWidth="1.2" strokeDasharray="4 6" />
        </svg>
        <span className="font-display text-2xl text-ember-hot select-none">
          {hero.name.charAt(0)}
        </span>
        <AnimatePresence>
          {lowHealth && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-1 rounded-full ring-2 ring-blood-bright animate-flicker"
            />
          )}
        </AnimatePresence>
      </button>

      <div className="flex flex-col gap-1 min-w-[130px]">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-sm text-parchment">{hero.name}</span>
          <span className="text-[10px] text-parchment-dim italic hidden sm:inline">{hero.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-blood/20 border border-blood/50 rounded px-1.5 py-0.5">
            <Heart className="w-3.5 h-3.5 text-blood-bright fill-blood-bright" />
            <span className="font-mono text-xs font-bold text-parchment">{Math.max(0, hero.health)}</span>
          </div>
          {hero.armor > 0 && (
            <div className="flex items-center gap-1 bg-mana/20 border border-mana/50 rounded px-1.5 py-0.5">
              <Shield className="w-3.5 h-3.5 text-mana-bright" />
              <span className="font-mono text-xs font-bold text-parchment">{hero.armor}</span>
            </div>
          )}
        </div>
        {onUsePower && (
          <button
            type="button"
            onClick={onUsePower}
            disabled={!canUsePower}
            title={hero.powerDesc}
            className={clsx(
              "mt-1 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-display border transition-colors",
              hero.powerUsed
                ? "border-void-line text-parchment-dim/50 cursor-not-allowed"
                : canUsePower
                ? "border-arcane bg-arcane/25 text-arcane-bright hover:bg-arcane/40 shadow-arcane"
                : "border-void-line text-parchment-dim/60 cursor-not-allowed"
            )}
          >
            <Sparkles className="w-3 h-3" />
            {hero.powerName} ({hero.powerCost})
          </button>
        )}
      </div>
    </div>
  );
}

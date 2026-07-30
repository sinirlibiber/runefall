import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { CardDef } from "../types";
import clsx from "clsx";

interface GameCardProps {
  def: CardDef;
  size?: "hand" | "board" | "mini";
  attackValue?: number;
  healthValue?: number;
  maxHealthValue?: number;
  taunt?: boolean;
  damaged?: boolean;
  disabled?: boolean;
  selected?: boolean;
  targetable?: boolean;
  attackReady?: boolean;
  sick?: boolean;
  onClick?: () => void;
  layoutId?: string;
}

export function GameCard({
  def,
  size = "hand",
  attackValue,
  healthValue,
  maxHealthValue,
  taunt,
  damaged,
  disabled,
  selected,
  targetable,
  attackReady,
  sick,
  onClick,
  layoutId,
}: GameCardProps) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[def.icon] ?? Icons.Sparkles;
  const isMinion = def.kind === "minion";
  const atk = attackValue ?? def.attack ?? 0;
  const hp = healthValue ?? def.health ?? 0;
  const maxHp = maxHealthValue ?? def.health ?? hp;
  const isHurt = damaged || (maxHp && hp < maxHp);

  const dims =
    size === "hand" ? "w-[112px] h-[156px]" : size === "board" ? "w-[100px] h-[130px]" : "w-[76px] h-[100px]";

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      layout
      onClick={onClick}
      disabled={disabled && !targetable}
      whileHover={!disabled || targetable ? { y: -10, scale: 1.04 } : undefined}
      whileTap={!disabled || targetable ? { scale: 0.97 } : undefined}
      initial={{ opacity: 0, y: 24, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.7, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={clsx(
        dims,
        "relative rounded-lg card-face text-left flex flex-col overflow-hidden select-none",
        "focus:outline-none",
        def.legendary && "legendary-glow",
        taunt && !def.legendary && "taunt-glow",
        selected && "ring-4 ring-ember-hot",
        targetable && "targetable",
        disabled && !targetable && "opacity-60 saturate-50",
        sick && "grayscale-[0.3]"
      )}
    >
      {/* Cost gem */}
      <div className="absolute -top-1.5 -left-1.5 z-10 w-7 h-7 rounded-full bg-mana border-2 border-mana-bright flex items-center justify-center shadow-md">
        <span className="font-display font-bold text-white text-xs">{def.cost}</span>
      </div>

      {def.legendary && (
        <div className="absolute top-1 right-1 z-10 text-ember-hot" title="Legendary">
          <Icons.Star className="w-3.5 h-3.5 fill-ember-hot" />
        </div>
      )}

      {/* Art */}
      <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-void-soft to-void mx-1.5 mt-3.5 rounded-md overflow-hidden">
        <span className="absolute text-4xl text-ember/25 font-display select-none">{def.glyph}</span>
        <Icon className="w-8 h-8 text-parchment relative z-[1]" strokeWidth={1.5} />
        {taunt && (
          <div className="absolute bottom-0.5 left-0.5 bg-arcane/90 rounded px-1 py-[1px]">
            <Icons.ShieldHalf className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Name plate */}
      <div className="px-1.5 py-1 text-center">
        <p
          className={clsx(
            "font-display leading-[1.05] text-void",
            size === "hand" ? "text-[9.5px]" : "text-[8.5px]"
          )}
        >
          {def.name}
        </p>
      </div>

      {isMinion && (
        <>
          <div className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-blood border-2 border-blood-bright flex items-center justify-center shadow">
            <span className="font-display font-bold text-white text-[11px]">{atk}</span>
          </div>
          <div
            className={clsx(
              "absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow",
              isHurt ? "bg-blood-bright border-red-200" : "bg-green-700 border-green-300"
            )}
          >
            <span className="font-display font-bold text-white text-[11px]">{hp}</span>
          </div>
        </>
      )}

      {size !== "mini" && (
        <div className="hidden group-hover:block absolute inset-0" />
      )}

      {attackReady && isMinion && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ boxShadow: ["0 0 0px rgba(232,95,82,0)", "0 0 14px rgba(232,95,82,0.7)", "0 0 0px rgba(232,95,82,0)"] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

export function cardTooltip(def: CardDef) {
  const parts: string[] = [];
  if (def.taunt) parts.push("Taunt");
  if (def.charge) parts.push("Charge");
  if (def.battlecry) parts.push(effectText(def.battlecry.kind, def.battlecry.amount, def.battlecry.target));
  if (def.deathrattle) parts.push("Deathrattle: " + effectText(def.deathrattle.kind, def.deathrattle.amount, def.deathrattle.target));
  return parts.join(" · ") || def.flavor;
}

function effectText(kind: string, amount: number, target: string) {
  const t =
    target === "enemyHero"
      ? "the enemy hero"
      : target === "ownHero"
      ? "your hero"
      : target === "randomEnemy"
      ? "a random enemy"
      : target === "allEnemyMinions"
      ? "all enemy minions"
      : "a target";
  if (kind === "damage") return `Deal ${amount} damage to ${t}`;
  if (kind === "heal") return `Restore ${amount} health to ${t}`;
  if (kind === "armor") return `Gain ${amount} armor`;
  if (kind === "draw") return `Draw ${amount} card${amount > 1 ? "s" : ""}`;
  return "";
}

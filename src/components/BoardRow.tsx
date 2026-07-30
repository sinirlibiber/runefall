import { AnimatePresence } from "framer-motion";
import { CARDS } from "../data/cards";
import { GameCard } from "./GameCard";
import type { MinionInstance, PlayerId } from "../types";

interface BoardRowProps {
  minions: MinionInstance[];
  owner: PlayerId;
  isEnemyRow: boolean;
  selectedAttacker: string | null;
  awaitingTarget: boolean;
  isValidTarget?: (instanceId: string) => boolean;
  onSelectAttacker?: (instanceId: string) => void;
  onSelectTarget?: (instanceId: string) => void;
}

export function BoardRow({
  minions,
  owner,
  isEnemyRow,
  selectedAttacker,
  awaitingTarget,
  isValidTarget,
  onSelectAttacker,
  onSelectTarget,
}: BoardRowProps) {
  return (
    <div className="flex items-center justify-center gap-2 min-h-[130px] flex-wrap">
      <AnimatePresence mode="popLayout">
        {minions.map((m) => {
          const def = CARDS[m.cardId];
          const canBeSelectedAsAttacker = !isEnemyRow && m.canAttack && !awaitingTarget;
          const canBeSelectedAsTarget =
            isEnemyRow && awaitingTarget && (isValidTarget ? isValidTarget(m.instanceId) : true);
          return (
            <div key={m.instanceId} className="relative group">
              <GameCard
                def={def}
                size="board"
                attackValue={m.attack}
                healthValue={m.health}
                maxHealthValue={m.maxHealth}
                taunt={m.taunt}
                sick={m.summoningSick}
                attackReady={!isEnemyRow && m.canAttack}
                selected={selectedAttacker === m.instanceId}
                targetable={canBeSelectedAsTarget}
                disabled={isEnemyRow ? !canBeSelectedAsTarget : !m.canAttack}
                onClick={() => {
                  if (canBeSelectedAsAttacker) onSelectAttacker?.(m.instanceId);
                  else if (canBeSelectedAsTarget) onSelectTarget?.(m.instanceId);
                }}
              />
              <div className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 w-max max-w-[160px] text-center text-[10px] text-parchment-dim bg-void-soft/95 border border-void-line rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {def.flavor}
              </div>
            </div>
          );
        })}
        {minions.length === 0 && (
          <p className="text-parchment-dim/40 text-xs italic font-body">
            {owner === "player" ? "Your side of the board is empty." : "No wardens stand guard."}
          </p>
        )}
      </AnimatePresence>
    </div>
  );
}

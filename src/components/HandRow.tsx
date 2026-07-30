import { AnimatePresence } from "framer-motion";
import { CARDS } from "../data/cards";
import { GameCard, cardTooltip } from "./GameCard";
import type { HandCard } from "../types";

interface HandRowProps {
  hand: HandCard[];
  mana: number;
  boardFull: boolean;
  selectedHandCard: string | null;
  isPlayerTurn: boolean;
  onSelect: (instanceId: string) => void;
}

export function HandRow({ hand, mana, boardFull, selectedHandCard, isPlayerTurn, onSelect }: HandRowProps) {
  return (
    <div className="flex items-end justify-center gap-1.5 md:gap-2 px-2 min-h-[168px]">
      <AnimatePresence mode="popLayout">
        {hand.map((h) => {
          const def = CARDS[h.cardId];
          const affordable = mana >= def.cost;
          const playable = isPlayerTurn && affordable && !(def.kind === "minion" && boardFull);
          return (
            <div key={h.instanceId} className="relative group">
              <GameCard
                def={def}
                size="hand"
                selected={selectedHandCard === h.instanceId}
                disabled={!playable}
                onClick={() => playable && onSelect(h.instanceId)}
              />
              <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-max max-w-[170px] text-center text-[10px] leading-snug text-parchment-dim bg-void-soft/95 border border-void-line rounded px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                {cardTooltip(def)}
              </div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

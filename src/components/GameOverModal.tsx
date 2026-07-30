import { motion } from "framer-motion";
import { Flame, RotateCcw, Snowflake } from "lucide-react";
import type { PlayerId } from "../types";

interface GameOverModalProps {
  winner: PlayerId;
  onRematch: () => void;
}

export function GameOverModal({ winner, onRematch }: GameOverModalProps) {
  const playerWon = winner === "player";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative w-[340px] rounded-2xl card-face p-6 text-center border-4 border-ember/70 overflow-hidden"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-16 -right-16 w-40 h-40 opacity-10"
        >
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#8A5A22" strokeWidth="2" strokeDasharray="6 8" />
          </svg>
        </motion.div>

        {playerWon ? (
          <Flame className="w-12 h-12 text-ember-hot mx-auto mb-3" />
        ) : (
          <Snowflake className="w-12 h-12 text-mana mx-auto mb-3" />
        )}

        <h2 className="font-display text-2xl text-void mb-1">
          {playerWon ? "Victory" : "Defeat"}
        </h2>
        <p className="font-body text-void/70 text-sm mb-6">
          {playerWon
            ? "Pyra's flame outlasts the frost. The arena remembers your name."
            : "Voss's frost claims the field this time. The runes will favor you yet."}
        </p>

        <button
          onClick={onRematch}
          className="inline-flex items-center gap-2 rounded-full bg-void text-parchment font-display text-sm px-5 py-2.5 hover:bg-void-soft transition-colors border border-ember/60"
        >
          <RotateCcw className="w-4 h-4" />
          Duel Again
        </button>
      </motion.div>
    </motion.div>
  );
}

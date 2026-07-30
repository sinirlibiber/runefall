import { motion } from "framer-motion";
import { Flame, Swords, Trophy } from "lucide-react";
import { useState } from "react";

interface StartScreenProps {
  defaultName: string;
  onStart: (name: string) => void;
  onOpenLeaderboard: () => void;
}

export function StartScreen({ defaultName, onStart, onOpenLeaderboard }: StartScreenProps) {
  const [name, setName] = useState(defaultName);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-ember/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Flame className="w-8 h-8 text-ember-hot" />
          <h1 className="font-display text-4xl md:text-5xl text-parchment tracking-wide">RUNEFALL</h1>
          <Flame className="w-8 h-8 text-ember-hot scale-x-[-1]" />
        </div>
        <p className="font-body italic text-parchment-dim text-sm md:text-base mb-10 tracking-wide">
          A Card Duel of Embers and Runes
        </p>

        <div className="flex flex-col items-center gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your warden name"
            maxLength={20}
            className="w-64 bg-void-soft border border-void-line rounded-full px-4 py-2.5 text-center font-body text-parchment placeholder:text-parchment-dim/40 focus:outline-none focus:border-ember/70 focus:shadow-rune transition-shadow"
          />

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(name.trim() || "Anonymous Warden")}
            className="flex items-center gap-2 rounded-full bg-ember hover:bg-ember-hot text-void font-display font-semibold px-8 py-3 shadow-rune transition-colors"
          >
            <Swords className="w-4 h-4" />
            Enter the Arena
          </motion.button>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 text-parchment-dim/80 hover:text-ember-hot text-xs font-body mt-2 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            View Leaderboard
          </button>
        </div>
      </motion.div>

      <p className="absolute bottom-4 text-parchment-dim/30 text-[10px] font-mono">
        vs. AI · single-player · runs entirely in your browser
      </p>
    </div>
  );
}

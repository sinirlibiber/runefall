import { motion } from "framer-motion";
import { Cloud, CloudOff, Loader2, Trophy, X } from "lucide-react";
import clsx from "clsx";
import type { LeaderboardEntry } from "../types";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  playerName: string;
  onClose: () => void;
  shelbyEnabled: boolean;
  shelbyStatus: "idle" | "syncing" | "synced" | "error";
}

export function LeaderboardPanel({ entries, playerName, onClose, shelbyEnabled, shelbyStatus }: LeaderboardPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="fixed top-0 right-0 h-full w-[290px] bg-void-soft/97 border-l border-void-line z-40 flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-void-line">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-ember-hot" />
          <h2 className="font-display text-sm text-parchment tracking-wide">Leaderboard</h2>
        </div>
        <button onClick={onClose} className="text-parchment-dim hover:text-parchment">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-void-line/70">
        <div
          className={clsx(
            "flex items-center gap-2 text-[11px] rounded px-2 py-1.5 border",
            shelbyEnabled ? "border-arcane/50 bg-arcane/10 text-arcane-bright" : "border-void-line text-parchment-dim/70"
          )}
        >
          {shelbyStatus === "syncing" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : shelbyEnabled ? (
            <Cloud className="w-3.5 h-3.5" />
          ) : (
            <CloudOff className="w-3.5 h-3.5" />
          )}
          <span>
            {shelbyEnabled
              ? shelbyStatus === "synced"
                ? "Synced to Shelby (Aptos testnet)"
                : shelbyStatus === "syncing"
                ? "Syncing to Shelby…"
                : shelbyStatus === "error"
                ? "Shelby sync failed — kept locally"
                : "Shelby sync ready"
              : "Shelby sync off — scores stay on this device"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {entries.length === 0 ? (
          <p className="text-center text-parchment-dim/60 text-xs mt-8 font-body italic">
            No duels recorded yet. Win one to open the scroll.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-parchment-dim/70 font-mono">
                <th className="text-left font-normal py-1 pl-2">#</th>
                <th className="text-left font-normal py-1">Warden</th>
                <th className="text-right font-normal py-1">W</th>
                <th className="text-right font-normal py-1 pr-2">L</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={e.name}
                  className={clsx(
                    "border-t border-void-line/50",
                    e.name.toLowerCase() === playerName.toLowerCase() && "bg-ember/10"
                  )}
                >
                  <td className="py-1.5 pl-2 font-mono text-parchment-dim">{i + 1}</td>
                  <td className="py-1.5 font-body text-parchment truncate max-w-[110px]">{e.name}</td>
                  <td className="py-1.5 text-right font-mono text-green-400">{e.wins}</td>
                  <td className="py-1.5 pr-2 text-right font-mono text-blood-bright">{e.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

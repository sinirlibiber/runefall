import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { LogEntry } from "../types";

export function BattleLog({ log }: { log: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);

  return (
    <div
      ref={ref}
      className="hidden lg:flex flex-col gap-0.5 w-[220px] max-h-[220px] overflow-y-auto text-[11px] font-body px-2 py-2 bg-void-soft/60 border border-void-line rounded-lg"
    >
      {log.slice(-40).map((entry) => (
        <p
          key={entry.id}
          className={clsx(
            "leading-snug",
            entry.tone === "damage" && "text-blood-bright/90",
            entry.tone === "heal" && "text-green-400",
            entry.tone === "win" && "text-ember-hot font-semibold",
            entry.tone === "info" && "text-parchment-dim"
          )}
        >
          {entry.text}
        </p>
      ))}
    </div>
  );
}

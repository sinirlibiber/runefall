import clsx from "clsx";

export function ManaBar({ mana, maxMana }: { mana: number; maxMana: number }) {
  return (
    <div className="flex items-center gap-[3px]" title={`${mana}/${maxMana} mana`}>
      {Array.from({ length: maxMana }).map((_, i) => (
        <span
          key={i}
          className={clsx(
            "w-2.5 h-3.5 rotate-45 rounded-[2px] border",
            i < mana
              ? "bg-mana-bright border-mana shadow-[0_0_6px_rgba(89,184,222,0.8)]"
              : "bg-void-line border-void-line"
          )}
        />
      ))}
      <span className="ml-1.5 font-mono text-xs text-mana-bright">
        {mana}/{maxMana}
      </span>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LogOut, Trophy } from "lucide-react";
import { CARDS } from "./data/cards";
import { attack, canPlayCard, createInitialState, endTurn, playCard, useHeroPower } from "./game/engine";
import { runAiTurn } from "./game/ai";
import type { GameState, LeaderboardEntry } from "./types";
import { getPlayerName, mergeLeaderboards, readLocalLeaderboard, recordResult, setPlayerName } from "./lib/storage";
import { downloadLeaderboardBlob } from "./lib/shelby";
import { useShelbySync } from "./hooks/useShelbySync";

import { StartScreen } from "./components/StartScreen";
import { HeroPanel } from "./components/HeroPanel";
import { ManaBar } from "./components/ManaBar";
import { BoardRow } from "./components/BoardRow";
import { HandRow } from "./components/HandRow";
import { BattleLog } from "./components/BattleLog";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { GameOverModal } from "./components/GameOverModal";

type Selection =
  | { kind: "none" }
  | { kind: "spellTarget"; handInstanceId: string }
  | { kind: "attackTarget"; attackerInstanceId: string };

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [playerName, setPlayerNameState] = useState(getPlayerName());
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [aiThinking, setAiThinking] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(readLocalLeaderboard());
  const [resultRecorded, setResultRecorded] = useState(false);
  const shelby = useShelbySync();

  useEffect(() => {
    if (shelby.enabled) {
      downloadLeaderboardBlob().then((remote) => {
        if (remote) setLeaderboard((local) => mergeLeaderboards(local, remote));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelby.enabled]);

  const startGame = useCallback((name: string) => {
    setPlayerName(name);
    setPlayerNameState(name);
    setState(createInitialState());
    setSelection({ kind: "none" });
    setResultRecorded(false);
  }, []);

  const rematch = useCallback(() => {
    setState(createInitialState());
    setSelection({ kind: "none" });
    setResultRecorded(false);
  }, []);

  // Record result + sync leaderboard once, when the duel ends.
  useEffect(() => {
    if (!state || state.phase !== "gameover" || resultRecorded) return;
    const result = state.winner === "player" ? "win" : "loss";
    const updated = recordResult(playerName, result);
    setLeaderboard(updated);
    setResultRecorded(true);
    if (shelby.enabled) shelby.syncLeaderboard(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.phase]);

  // Drive the AI's turn whenever it becomes active.
  useEffect(() => {
    if (!state || state.phase !== "playing" || state.activePlayer !== "ai") return;
    let cancelled = false;
    setAiThinking(true);
    (async () => {
      for await (const next of runAiTurn(state)) {
        if (cancelled) return;
        setState(next);
      }
      if (!cancelled) setAiThinking(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.activePlayer, state?.turn]);

  if (!state) {
    return (
      <StartScreen
        defaultName={playerName}
        onStart={startGame}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />
    );
  }

  const isPlayerTurn = state.activePlayer === "player" && state.phase === "playing";
  const awaitingSpellTarget = selection.kind === "spellTarget";
  const awaitingAttackTarget = selection.kind === "attackTarget";

  function handleSelectHandCard(instanceId: string) {
    if (!isPlayerTurn || !state) return;
    const hc = state.player.hand.find((h) => h.instanceId === instanceId);
    if (!hc) return;
    const def = CARDS[hc.cardId];
    const needsChosenTarget = def.battlecry?.target === "chosen" && state.ai.board.length > 0;

    if (needsChosenTarget) {
      setSelection({ kind: "spellTarget", handInstanceId: instanceId });
      return;
    }
    if (!canPlayCard(state, "player", instanceId)) return;
    setState(playCard(state, "player", instanceId));
    setSelection({ kind: "none" });
  }

  function handleSelectAttacker(instanceId: string) {
    setSelection({ kind: "attackTarget", attackerInstanceId: instanceId });
  }

  function handleEnemyMinionClick(instanceId: string) {
    if (!state) return;
    if (selection.kind === "spellTarget") {
      setState(playCard(state, "player", selection.handInstanceId, { side: "ai", instanceId }));
      setSelection({ kind: "none" });
    } else if (selection.kind === "attackTarget") {
      setState(attack(state, "player", selection.attackerInstanceId, { side: "ai", instanceId }));
      setSelection({ kind: "none" });
    }
  }

  function handleEnemyHeroClick() {
    if (!state) return;
    if (selection.kind === "attackTarget") {
      setState(attack(state, "player", selection.attackerInstanceId, { side: "ai", instanceId: "hero" }));
      setSelection({ kind: "none" });
    }
  }

  function handleUseHeroPower() {
    if (!state || !isPlayerTurn) return;
    if (state.player.hero.powerUsed || state.player.mana < state.player.hero.powerCost) return;
    setState(useHeroPower(state, "player"));
  }

  function handleEndTurn() {
    if (!state || !isPlayerTurn) return;
    setSelection({ kind: "none" });
    setState(endTurn(state));
  }

  const enemyHasTaunt = state.ai.board.some((m) => m.taunt);
  const enemyMinionTargetable = (instanceId: string) => {
    if (selection.kind === "spellTarget") return true;
    if (selection.kind === "attackTarget") {
      if (!enemyHasTaunt) return true;
      const minion = state.ai.board.find((m) => m.instanceId === instanceId);
      return !!minion?.taunt;
    }
    return false;
  };
  const enemyHeroTargetable = selection.kind === "attackTarget" && !enemyHasTaunt;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-void-line/60 bg-void-soft/40">
        <div className="flex items-center gap-2">
          <span className="font-display text-ember-hot text-sm tracking-wide">RUNEFALL</span>
          <span className="text-parchment-dim/50 text-xs font-mono">Turn {state.turn}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1.5 text-xs text-parchment-dim hover:text-ember-hot transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button
            onClick={() => setState(null)}
            className="flex items-center gap-1.5 text-xs text-parchment-dim hover:text-blood-bright transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Concede</span>
          </button>
        </div>
      </div>

      {/* Enemy zone */}
      <div className="flex flex-col items-center pt-4 gap-3">
        <div className="flex items-center gap-6">
          <HeroPanel
            hero={state.ai.hero}
            side="top"
            targetableAsEnemy={enemyHeroTargetable}
            onSelectAsTarget={handleEnemyHeroClick}
          />
          <div className="flex flex-col items-start gap-1 text-[11px] text-parchment-dim font-mono">
            <span>Deck: {state.ai.deck.length}</span>
            <span>Hand: {state.ai.hand.length}</span>
          </div>
        </div>
        <BoardRow
          minions={state.ai.board}
          owner="ai"
          isEnemyRow={true}
          selectedAttacker={null}
          awaitingTarget={awaitingSpellTarget || awaitingAttackTarget}
          isValidTarget={enemyMinionTargetable}
          onSelectTarget={handleEnemyMinionClick}
        />
      </div>

      <div className="flex-1 flex items-center justify-center my-2">
        <div className="w-[70%] max-w-md h-px bg-gradient-to-r from-transparent via-ember/40 to-transparent" />
      </div>

      {/* Player zone */}
      <div className="flex flex-col items-center gap-2 pb-3">
        <BoardRow
          minions={state.player.board}
          owner="player"
          isEnemyRow={false}
          selectedAttacker={selection.kind === "attackTarget" ? selection.attackerInstanceId : null}
          awaitingTarget={awaitingSpellTarget || awaitingAttackTarget}
          onSelectAttacker={handleSelectAttacker}
        />

        <div className="flex items-center gap-6">
          <HeroPanel
            hero={state.player.hero}
            side="bottom"
            canUsePower={isPlayerTurn && !state.player.hero.powerUsed && state.player.mana >= state.player.hero.powerCost}
            onUsePower={handleUseHeroPower}
          />
          <ManaBar mana={state.player.mana} maxMana={state.player.maxMana} />
          <button
            onClick={handleEndTurn}
            disabled={!isPlayerTurn}
            className="rounded-full px-5 py-2 font-display text-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-ember bg-ember/20 text-ember-hot hover:bg-ember/35"
          >
            {isPlayerTurn ? "End Turn" : aiThinking ? "Opponent's turn…" : "Waiting…"}
          </button>
        </div>

        <HandRow
          hand={state.player.hand}
          mana={state.player.mana}
          boardFull={state.player.board.length >= 7}
          selectedHandCard={selection.kind === "spellTarget" ? selection.handInstanceId : null}
          isPlayerTurn={isPlayerTurn && selection.kind !== "attackTarget"}
          onSelect={handleSelectHandCard}
        />
      </div>

      <div className="fixed bottom-3 left-3 hidden lg:block">
        <BattleLog log={state.log} />
      </div>

      {(selection.kind !== "none") && (
        <button
          onClick={() => setSelection({ kind: "none" })}
          className="fixed bottom-4 right-4 z-30 text-xs bg-void-soft border border-void-line rounded-full px-3 py-1.5 text-parchment-dim hover:text-parchment"
        >
          Cancel targeting
        </button>
      )}

      <AnimatePresence>
        {showLeaderboard && (
          <LeaderboardPanel
            entries={leaderboard}
            playerName={playerName}
            onClose={() => setShowLeaderboard(false)}
            shelbyEnabled={shelby.enabled}
            shelbyStatus={shelby.status}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.phase === "gameover" && state.winner && (
          <GameOverModal winner={state.winner} onRematch={rematch} />
        )}
      </AnimatePresence>
    </div>
  );
}

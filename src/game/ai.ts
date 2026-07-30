import { CARDS } from "../data/cards";
import { attack, canPlayCard, endTurn, playCard, useHeroPower } from "./engine";
import type { GameState } from "../types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs the AI's full turn as a sequence of engine calls, yielding the state
 * back after every discrete action so the UI can animate each step.
 */
export async function* runAiTurn(initial: GameState): AsyncGenerator<GameState> {
  let s = initial;

  // Greedily play the most expensive affordable cards first.
  let playedSomething = true;
  while (playedSomething) {
    playedSomething = false;
    const sd = s.ai;
    const affordable = sd.hand
      .map((h) => ({ h, def: CARDS[h.cardId] }))
      .filter(({ def }) => def.cost <= sd.mana)
      .filter(({ def }) => !(def.kind === "minion" && sd.board.length >= 7))
      .sort((a, b) => b.def.cost - a.def.cost);

    if (affordable.length > 0) {
      const choice = affordable[0];
      await sleep(500);
      let target: { side: "player" | "ai"; instanceId: string } | "enemyHero" | undefined;
      if (choice.def.kind === "spell" && choice.def.battlecry?.target === "chosen") {
        // Prefer killing the biggest enemy minion; else face damage.
        const enemyBoard = s.player.board;
        if (enemyBoard.length > 0) {
          const biggest = [...enemyBoard].sort((a, b) => b.attack - a.attack)[0];
          target = { side: "player", instanceId: biggest.instanceId };
        } else {
          target = "enemyHero";
        }
      }
      if (canPlayCard(s, "ai", choice.h.instanceId)) {
        s = playCard(s, "ai", choice.h.instanceId, target);
        playedSomething = true;
        yield s;
      }
    }
  }

  // Use hero power if there's leftover mana.
  if (!s.ai.hero.powerUsed && s.ai.mana >= s.ai.hero.powerCost) {
    await sleep(400);
    s = useHeroPower(s, "ai");
    yield s;
  }

  // Attack with everything available. Taunts are enforced inside attack().
  const attackers = s.ai.board.filter((m) => m.canAttack);
  for (const attackerRef of attackers) {
    const current = s.ai.board.find((m) => m.instanceId === attackerRef.instanceId);
    if (!current || !current.canAttack) continue;
    await sleep(550);

    const enemyBoard = s.player.board;
    const tauntTargets = enemyBoard.filter((m) => m.taunt);
    const pool = tauntTargets.length > 0 ? tauntTargets : enemyBoard;

    // Favor trades that kill an enemy minion without losing the attacker,
    // otherwise just swing at whatever is biggest, otherwise go face.
    let targetId = "hero";
    let targetSide: "player" = "player";
    if (pool.length > 0) {
      const favorable = pool.find((m) => current.attack >= m.health && m.attack < current.health);
      const anyKill = pool.find((m) => current.attack >= m.health);
      const chosen = favorable ?? anyKill ?? pool.sort((a, b) => b.attack - a.attack)[0];
      targetId = chosen.instanceId;
    } else if (tauntTargets.length === 0 && enemyBoard.length > 0 && Math.random() < 0.15) {
      // Occasionally trade into a random minion even without taunt, for variety.
      const rand = enemyBoard[Math.floor(Math.random() * enemyBoard.length)];
      targetId = rand.instanceId;
    }

    s = attack(s, "ai", current.instanceId, { side: targetSide, instanceId: targetId });
    yield s;
    if (s.phase === "gameover") return;
  }

  await sleep(400);
  s = endTurn(s);
  yield s;
}

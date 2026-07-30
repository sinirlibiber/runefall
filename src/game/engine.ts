import { CARDS, buildDeck, shuffle } from "../data/cards";
import type {
  CardEffect,
  GameState,
  HandCard,
  HeroState,
  LogEntry,
  MinionInstance,
  PlayerId,
  SideState,
} from "../types";

let uidCounter = 0;
function uid(prefix: string) {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
}

const START_HAND = 3;
const MAX_MANA = 10;
const MAX_BOARD = 7;
const MAX_HAND = 10;

function makeHero(kind: PlayerId): HeroState {
  if (kind === "player") {
    return {
      name: "Pyra",
      title: "the Ember Warden",
      health: 30,
      maxHealth: 30,
      armor: 0,
      powerName: "Spark",
      powerCost: 2,
      powerDesc: "Deal 1 damage to the enemy hero.",
      powerUsed: false,
    };
  }
  return {
    name: "Voss",
    title: "the Frost Warden",
    health: 30,
    maxHealth: 30,
    armor: 0,
    powerName: "Frostbite",
    powerCost: 2,
    powerDesc: "Deal 1 damage to a random enemy.",
    powerUsed: false,
  };
}

function makeSide(id: PlayerId): SideState {
  const deck = shuffle(buildDeck());
  const hand: HandCard[] = [];
  for (let i = 0; i < START_HAND; i++) {
    const cardId = deck.shift();
    if (cardId) hand.push({ instanceId: uid("hand"), cardId });
  }
  return {
    id,
    hero: makeHero(id),
    deck,
    hand,
    board: [],
    mana: 1,
    maxMana: 1,
    fatigue: 0,
    graveyardCount: 0,
  };
}

export function createInitialState(): GameState {
  const player = makeSide("player");
  const ai = makeSide("ai");
  // AI gets an extra card to compensate for going second, a la coin rule.
  const extra = ai.deck.shift();
  if (extra) ai.hand.push({ instanceId: uid("hand"), cardId: extra });

  return {
    phase: "playing",
    turn: 1,
    activePlayer: "player",
    winner: null,
    player,
    ai,
    log: [mkLog("The duel begins. Pyra the Ember Warden takes the first turn.", "info")],
    selectedHandCard: null,
    selectedAttacker: null,
    pendingTargetFor: null,
  };
}

function mkLog(text: string, tone: LogEntry["tone"] = "info"): LogEntry {
  return { id: uid("log"), text, tone };
}

function other(id: PlayerId): PlayerId {
  return id === "player" ? "ai" : "player";
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    player: { ...s.player, hero: { ...s.player.hero }, hand: [...s.player.hand], board: s.player.board.map((m) => ({ ...m })), deck: [...s.player.deck] },
    ai: { ...s.ai, hero: { ...s.ai.hero }, hand: [...s.ai.hand], board: s.ai.board.map((m) => ({ ...m })), deck: [...s.ai.deck] },
    log: [...s.log],
  };
}

function side(s: GameState, id: PlayerId): SideState {
  return id === "player" ? s.player : s.ai;
}

function setSide(s: GameState, id: PlayerId, next: SideState) {
  if (id === "player") s.player = next;
  else s.ai = next;
}

function drawCard(s: GameState, id: PlayerId) {
  const sd = side(s, id);
  if (sd.hand.length >= MAX_HAND) {
    if (sd.deck.length > 0) sd.deck.shift();
    s.log.push(mkLog(`${sd.hero.name}'s hand is full — a card burns away.`, "damage"));
    return;
  }
  const cardId = sd.deck.shift();
  if (!cardId) {
    sd.fatigue += 1;
    sd.hero.health -= sd.fatigue;
    s.log.push(mkLog(`${sd.hero.name} has no cards left and takes ${sd.fatigue} fatigue damage.`, "damage"));
    return;
  }
  sd.hand.push({ instanceId: uid("hand"), cardId });
}

function dealDamageToHero(s: GameState, id: PlayerId, amount: number) {
  const sd = side(s, id);
  let remaining = amount;
  if (sd.hero.armor > 0) {
    const absorbed = Math.min(sd.hero.armor, remaining);
    sd.hero.armor -= absorbed;
    remaining -= absorbed;
  }
  sd.hero.health -= remaining;
  s.log.push(mkLog(`${sd.hero.name} takes ${amount} damage.`, "damage"));
}

function healHero(s: GameState, id: PlayerId, amount: number) {
  const sd = side(s, id);
  sd.hero.health = Math.min(sd.hero.maxHealth, sd.hero.health + amount);
  s.log.push(mkLog(`${sd.hero.name} heals ${amount}.`, "heal"));
}

function damageMinion(s: GameState, ownerId: PlayerId, instanceId: string, amount: number): boolean {
  const sd = side(s, ownerId);
  const minion = sd.board.find((m) => m.instanceId === instanceId);
  if (!minion) return false;
  minion.health -= amount;
  minion.damagedTick = (minion.damagedTick ?? 0) + 1;
  s.log.push(mkLog(`${cardName(minion.cardId)} takes ${amount} damage.`, "damage"));
  return true;
}

function cardName(cardId: string) {
  return CARDS[cardId]?.name ?? cardId;
}

function resolveEffect(
  s: GameState,
  casterId: PlayerId,
  effect: CardEffect,
  chosenTarget?: { side: PlayerId; instanceId: string } | "enemyHero" | "ownHero"
) {
  const enemyId = other(casterId);
  switch (effect.target) {
    case "ownHero": {
      if (effect.kind === "damage") dealDamageToHero(s, casterId, effect.amount);
      if (effect.kind === "heal") healHero(s, casterId, effect.amount);
      if (effect.kind === "armor") {
        side(s, casterId).hero.armor += effect.amount;
        s.log.push(mkLog(`${side(s, casterId).hero.name} gains ${effect.amount} armor.`, "heal"));
      }
      if (effect.kind === "draw") {
        for (let i = 0; i < effect.amount; i++) drawCard(s, casterId);
        s.log.push(mkLog(`${side(s, casterId).hero.name} draws a card.`, "info"));
      }
      return;
    }
    case "enemyHero": {
      if (effect.kind === "damage") dealDamageToHero(s, enemyId, effect.amount);
      return;
    }
    case "randomEnemy": {
      const enemy = side(s, enemyId);
      if (enemy.board.length > 0) {
        const target = enemy.board[Math.floor(Math.random() * enemy.board.length)];
        damageMinion(s, enemyId, target.instanceId, effect.amount);
      } else {
        dealDamageToHero(s, enemyId, effect.amount);
      }
      return;
    }
    case "allEnemyMinions": {
      const enemy = side(s, enemyId);
      enemy.board.forEach((m) => damageMinion(s, enemyId, m.instanceId, effect.amount));
      return;
    }
    case "chosen": {
      if (!chosenTarget || chosenTarget === "enemyHero" || chosenTarget === "ownHero") {
        // Fallback: no explicit target chosen, hit enemy hero.
        if (effect.kind === "damage") dealDamageToHero(s, enemyId, effect.amount);
        return;
      }
      if (chosenTarget.instanceId === "hero") {
        if (effect.kind === "damage") dealDamageToHero(s, chosenTarget.side, effect.amount);
        if (effect.kind === "heal") healHero(s, chosenTarget.side, effect.amount);
        return;
      }
      if (effect.kind === "damage") damageMinion(s, chosenTarget.side, chosenTarget.instanceId, effect.amount);
      return;
    }
  }
}

function sweepDeaths(s: GameState) {
  (["player", "ai"] as PlayerId[]).forEach((id) => {
    const sd = side(s, id);
    const dead = sd.board.filter((m) => m.health <= 0);
    if (dead.length === 0) return;
    sd.board = sd.board.filter((m) => m.health > 0);
    sd.graveyardCount += dead.length;
    dead.forEach((m) => {
      const def = CARDS[m.cardId];
      s.log.push(mkLog(`${def.name} is destroyed.`, "damage"));
      if (def.deathrattle) {
        resolveEffect(s, id, def.deathrattle);
      }
    });
  });
}

function checkWinner(s: GameState) {
  if (s.player.hero.health <= 0 && s.ai.hero.health <= 0) {
    s.winner = "ai"; // simultaneous: house rule, defender edge
    s.phase = "gameover";
  } else if (s.player.hero.health <= 0) {
    s.winner = "ai";
    s.phase = "gameover";
  } else if (s.ai.hero.health <= 0) {
    s.winner = "player";
    s.phase = "gameover";
  }
  if (s.phase === "gameover" && s.log[s.log.length - 1]?.tone !== "win") {
    const winnerName = s.winner === "player" ? s.player.hero.name : s.ai.hero.name;
    s.log.push(mkLog(`${winnerName} wins the duel!`, "win"));
  }
}

export interface PlayCardResult {
  state: GameState;
  needsTarget?: { instanceId: string };
}

export function canPlayCard(s: GameState, playerId: PlayerId, handInstanceId: string): boolean {
  const sd = side(s, playerId);
  const hc = sd.hand.find((h) => h.instanceId === handInstanceId);
  if (!hc) return false;
  const def = CARDS[hc.cardId];
  if (sd.mana < def.cost) return false;
  if (def.kind === "minion" && sd.board.length >= MAX_BOARD) return false;
  return true;
}

export function playCard(
  s: GameState,
  playerId: PlayerId,
  handInstanceId: string,
  chosenTarget?: { side: PlayerId; instanceId: string } | "enemyHero" | "ownHero"
): GameState {
  const next = cloneState(s);
  const sd = side(next, playerId);
  const idx = sd.hand.findIndex((h) => h.instanceId === handInstanceId);
  if (idx === -1) return next;
  const hc = sd.hand[idx];
  const def = CARDS[hc.cardId];
  if (sd.mana < def.cost) return next;
  if (def.kind === "minion" && sd.board.length >= MAX_BOARD) return next;

  sd.hand.splice(idx, 1);
  sd.mana -= def.cost;

  next.log.push(mkLog(`${sd.hero.name} plays ${def.name}.`, "info"));

  if (def.kind === "minion") {
    const minion: MinionInstance = {
      instanceId: uid("minion"),
      cardId: def.id,
      attack: def.attack ?? 0,
      health: def.health ?? 1,
      maxHealth: def.health ?? 1,
      taunt: !!def.taunt,
      canAttack: !!def.charge,
      summoningSick: !def.charge,
      justPlayed: true,
    };
    sd.board.push(minion);
    if (def.battlecry) resolveEffect(next, playerId, def.battlecry, chosenTarget);
  } else if (def.kind === "spell") {
    if (def.battlecry) resolveEffect(next, playerId, def.battlecry, chosenTarget);
  }

  sweepDeaths(next);
  checkWinner(next);
  return next;
}

export function useHeroPower(
  s: GameState,
  playerId: PlayerId,
  chosenTarget?: { side: PlayerId; instanceId: string } | "enemyHero" | "ownHero"
): GameState {
  const next = cloneState(s);
  const sd = side(next, playerId);
  if (sd.hero.powerUsed) return next;
  if (sd.mana < sd.hero.powerCost) return next;
  sd.mana -= sd.hero.powerCost;
  sd.hero.powerUsed = true;

  next.log.push(mkLog(`${sd.hero.name} uses ${sd.hero.powerName}.`, "info"));

  if (playerId === "player") {
    resolveEffect(next, playerId, { kind: "damage", amount: 1, target: "enemyHero" });
  } else {
    resolveEffect(next, playerId, { kind: "damage", amount: 1, target: "randomEnemy" });
  }

  sweepDeaths(next);
  checkWinner(next);
  return next;
}

export function attack(
  s: GameState,
  playerId: PlayerId,
  attackerInstanceId: string,
  target: { side: PlayerId; instanceId: string }
): GameState {
  const next = cloneState(s);
  const sd = side(next, playerId);
  const attacker = sd.board.find((m) => m.instanceId === attackerInstanceId);
  if (!attacker || !attacker.canAttack) return next;

  const enemyId = other(playerId);
  const enemy = side(next, enemyId);
  const hasTaunt = enemy.board.some((m) => m.taunt);
  if (hasTaunt) {
    const targetMinion = enemy.board.find((m) => m.instanceId === target.instanceId);
    if (!targetMinion || !targetMinion.taunt) return next;
  }

  attacker.canAttack = false;

  if (target.instanceId === "hero") {
    next.log.push(mkLog(`${cardName(attacker.cardId)} attacks ${enemy.hero.name} for ${attacker.attack}.`, "damage"));
    dealDamageToHero(next, enemyId, attacker.attack);
  } else {
    const defender = enemy.board.find((m) => m.instanceId === target.instanceId);
    if (!defender) return next;
    next.log.push(mkLog(`${cardName(attacker.cardId)} clashes with ${cardName(defender.cardId)}.`, "damage"));
    defender.health -= attacker.attack;
    attacker.health -= defender.attack;
  }

  sweepDeaths(next);
  checkWinner(next);
  return next;
}

export function endTurn(s: GameState): GameState {
  const next = cloneState(s);
  const finishing = next.activePlayer;
  const upcoming = other(finishing);

  const upcomingSide = side(next, upcoming);
  if (upcomingSide.maxMana < MAX_MANA) upcomingSide.maxMana += 1;
  upcomingSide.mana = upcomingSide.maxMana;
  upcomingSide.hero.powerUsed = false;
  upcomingSide.board.forEach((m) => {
    m.canAttack = true;
    m.summoningSick = false;
    m.justPlayed = false;
  });

  next.activePlayer = upcoming;
  if (upcoming === "player") next.turn += 1;

  drawCard(next, upcoming);
  next.log.push(mkLog(`— Turn ${next.turn}: ${side(next, upcoming).hero.name}'s move —`, "info"));

  checkWinner(next);
  return next;
}

export { other as otherPlayer, MAX_BOARD };

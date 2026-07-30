export type CardKind = "minion" | "spell";

export type EffectTarget = "enemyHero" | "ownHero" | "randomEnemy" | "allEnemyMinions" | "chosen";

export interface CardEffect {
  kind: "damage" | "heal" | "armor" | "draw";
  amount: number;
  target: EffectTarget;
}

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  kind: CardKind;
  attack?: number;
  health?: number;
  taunt?: boolean;
  charge?: boolean;
  legendary?: boolean;
  battlecry?: CardEffect;
  deathrattle?: CardEffect;
  flavor: string;
  icon: string; // lucide icon name
  glyph: string; // rune symbol shown on the card art
}

export interface MinionInstance {
  instanceId: string;
  cardId: string;
  attack: number;
  health: number;
  maxHealth: number;
  taunt: boolean;
  canAttack: boolean;
  summoningSick: boolean;
  justPlayed?: boolean;
  damagedTick?: number;
}

export interface HandCard {
  instanceId: string;
  cardId: string;
}

export type PlayerId = "player" | "ai";

export interface HeroState {
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  armor: number;
  powerName: string;
  powerCost: number;
  powerDesc: string;
  powerUsed: boolean;
}

export interface SideState {
  id: PlayerId;
  hero: HeroState;
  deck: string[];
  hand: HandCard[];
  board: MinionInstance[];
  mana: number;
  maxMana: number;
  fatigue: number;
  graveyardCount: number;
}

export type Phase = "menu" | "playing" | "gameover";

export interface LogEntry {
  id: string;
  text: string;
  tone: "info" | "damage" | "heal" | "win" | "lose";
}

export interface GameState {
  phase: Phase;
  turn: number;
  activePlayer: PlayerId;
  winner: PlayerId | null;
  player: SideState;
  ai: SideState;
  log: LogEntry[];
  selectedHandCard: string | null;
  selectedAttacker: string | null;
  pendingTargetFor: { kind: "card" | "power" | "attack"; sourceId: string } | null;
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
  losses: number;
  lastResult: "win" | "loss";
  updatedAt: number;
}

import type { LeaderboardEntry } from "../types";

const LOCAL_KEY = "runefall_leaderboard_v1";
const NAME_KEY = "runefall_player_name";

export function getPlayerName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}

export function setPlayerName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function readLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function writeLocalLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export function recordResult(name: string, result: "win" | "loss"): LeaderboardEntry[] {
  const entries = readLocalLeaderboard();
  const cleanName = name.trim() || "Anonymous Warden";
  let entry = entries.find((e) => e.name.toLowerCase() === cleanName.toLowerCase());
  if (!entry) {
    entry = { name: cleanName, wins: 0, losses: 0, lastResult: result, updatedAt: Date.now() };
    entries.push(entry);
  }
  if (result === "win") entry.wins += 1;
  else entry.losses += 1;
  entry.lastResult = result;
  entry.updatedAt = Date.now();
  entries.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  writeLocalLeaderboard(entries);
  return entries;
}

export function mergeLeaderboards(a: LeaderboardEntry[], b: LeaderboardEntry[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  [...a, ...b].forEach((e) => {
    const key = e.name.toLowerCase();
    const existing = map.get(key);
    if (!existing || e.updatedAt > existing.updatedAt) map.set(key, e);
  });
  return [...map.values()].sort((x, y) => y.wins - x.wins || x.losses - y.losses);
}

import { Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import type { LeaderboardEntry } from "../types";

export const SHELBY_ENABLED = import.meta.env.VITE_SHELBY_ENABLED === "true";
export const SHELBY_API_KEY = import.meta.env.VITE_SHELBY_API_KEY ?? "";
export const SHELBY_ACCOUNT_ADDRESS = import.meta.env.VITE_SHELBY_ACCOUNT_ADDRESS ?? "";
export const SHELBY_PRIVATE_KEY = import.meta.env.VITE_SHELBY_PRIVATE_KEY ?? "";

export const LEADERBOARD_BLOB_NAME = "runefall-leaderboard.json";

export function isShelbyConfigured() {
  return SHELBY_ENABLED && !!SHELBY_API_KEY && !!SHELBY_ACCOUNT_ADDRESS;
}

let client: ShelbyClient | null = null;
export function getShelbyClient(): ShelbyClient {
  if (!client) {
    client = new ShelbyClient({
      network: Network.TESTNET,
      apiKey: SHELBY_API_KEY,
    });
  }
  return client;
}

/**
 * Reads the shared leaderboard blob straight over HTTP using Shelby's
 * predictable direct-URL pattern — no signer needed for a read.
 * https://docs.shelby.xyz/sdks/typescript/browser/guides/download
 */
export async function downloadLeaderboardBlob(): Promise<LeaderboardEntry[] | null> {
  if (!SHELBY_ACCOUNT_ADDRESS) return null;
  const url = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${SHELBY_ACCOUNT_ADDRESS}/${LEADERBOARD_BLOB_NAME}`;
  try {
    const res = await fetch(url, {
      headers: SHELBY_API_KEY ? { "x-api-key": SHELBY_API_KEY } : undefined,
    });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text) as LeaderboardEntry[];
  } catch {
    return null;
  }
}

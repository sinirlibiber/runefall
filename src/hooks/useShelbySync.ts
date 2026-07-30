import { useUploadBlobs } from "@shelby-protocol/react";
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { useCallback, useMemo, useState } from "react";
import { LEADERBOARD_BLOB_NAME, SHELBY_PRIVATE_KEY, isShelbyConfigured } from "../lib/shelby";
import type { LeaderboardEntry } from "../types";

const DEMO_SIGNER_KEY = "runefall_demo_signer_pk";

/**
 * Demo-only signer. Real apps should never hold a funded private key in the
 * browser bundle — sign server-side instead. This is fine for a testnet toy
 * leaderboard where the account only ever holds faucet funds.
 */
function getOrCreateDemoSigner(): Account {
  if (SHELBY_PRIVATE_KEY) {
    return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(SHELBY_PRIVATE_KEY) });
  }
  const stored = localStorage.getItem(DEMO_SIGNER_KEY);
  if (stored) {
    return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(stored) });
  }
  const generated = Account.generate();
  localStorage.setItem(DEMO_SIGNER_KEY, generated.privateKey.toString());
  return generated;
}

export function useShelbySync() {
  const enabled = isShelbyConfigured();
  const [status, setStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const uploadBlobs = useUploadBlobs({
    onSuccess: () => setStatus("synced"),
    onError: () => setStatus("error"),
  });

  const signer = useMemo(() => (enabled ? getOrCreateDemoSigner() : null), [enabled]);

  const syncLeaderboard = useCallback(
    (entries: LeaderboardEntry[]) => {
      if (!enabled || !signer) return;
      setStatus("syncing");
      const payload = new TextEncoder().encode(JSON.stringify(entries));
      uploadBlobs.mutate({
        signer,
        blobs: [{ blobName: LEADERBOARD_BLOB_NAME, blobData: payload }],
        expirationMicros: Date.now() * 1000 + 30 * 86400000000, // 30 days
      });
    },
    [enabled, signer, uploadBlobs]
  );

  return { enabled, status, syncLeaderboard, signerAddress: signer?.accountAddress.toString() };
}

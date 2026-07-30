# 🔥 Runefall Arena

A fantasy card-duel game — original cards, an AI opponent, smooth animations,
and a leaderboard that can optionally mirror itself to **Shelby Protocol**'s
decentralized storage network on Aptos.

Built with **React + TypeScript + Vite + Tailwind + Framer Motion**.

![status](https://img.shields.io/badge/status-playable-brightgreen)

## Play

- Draft-free 1v1: you (Pyra, the Ember Warden) vs. an AI (Voss, the Frost Warden)
- 18 unique cards — minions with Taunt/Charge/Battlecry/Deathrattle, and spells
- Mana curve up to 10, hero powers, animated combat, a battle log
- Local leaderboard tracks wins/losses per name, right in the browser

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. That's it — the game works fully offline with
zero configuration (leaderboard is stored in `localStorage`).

## Build for production

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

Output goes to `dist/`.

## Deploy

### GitHub

```bash
git init
git add .
git commit -m "Runefall Arena"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`.env` is git-ignored by default, so any Shelby keys you set locally won't
leak into the repo. Commit `.env.example` instead (already included).

### Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Vite** (auto-detected)
3. Build command: `npm run build` · Output directory: `dist`
4. If you want the Shelby leaderboard sync live in production, add the four
   `VITE_SHELBY_*` variables from `.env.example` under **Project Settings →
   Environment Variables**, then redeploy

No backend, no server — it's a static site.

## Decentralized leaderboard via Shelby (optional)

By default, scores are only saved on the visitor's own device. If you'd like
the leaderboard to be shared and durable across devices, this project ships
with a ready-to-use [Shelby Protocol](https://docs.shelby.xyz/) integration:
every time a duel ends, the leaderboard JSON is uploaded as a blob; on load,
the app fetches that blob back down and merges it with local scores.

**This is off by default** so the game runs instantly with no setup. To turn
it on:

1. **Get a Shelby testnet API key** —
   [docs.shelby.xyz/sdks/typescript/acquire-api-keys](https://docs.shelby.xyz/sdks/typescript/acquire-api-keys)
2. **Fund a testnet Aptos account** with APT + shelbyUSD (needed to pay for
   storage) —
   [docs.shelby.xyz/sdks/typescript/fund-your-account](https://docs.shelby.xyz/sdks/typescript/fund-your-account)
3. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SHELBY_ENABLED=true
   VITE_SHELBY_API_KEY=...
   VITE_SHELBY_ACCOUNT_ADDRESS=0x...
   VITE_SHELBY_PRIVATE_KEY=0x...   # the funded testnet account's private key
   ```
4. Restart `npm run dev` (or redeploy). You'll see a "Synced to Shelby"
   badge in the leaderboard panel after your first win/loss.

⚠️ **Testnet-only, demo pattern.** This project signs the upload from the
browser using the private key in `VITE_SHELBY_PRIVATE_KEY`, which is fine for
a toy leaderboard funded with faucet tokens, but you should **never** ship a
mainnet or real-funds private key inside a frontend bundle. A production app
would sign uploads from a small backend/serverless function instead and call
Shelby from there — see the
[Shelby TypeScript SDK docs](https://docs.shelby.xyz/sdks/typescript) for the
Node.js flow.

Where the integration lives in the code:
- `src/lib/shelby.ts` — client setup + reading the shared leaderboard blob
  over Shelby's direct-URL pattern
- `src/hooks/useShelbySync.ts` — the `useUploadBlobs` mutation that pushes a
  new leaderboard snapshot after every duel
- `src/main.tsx` — wraps the app in `QueryClientProvider` +
  `ShelbyClientProvider`, as required by `@shelby-protocol/react`

## Project structure

```
src/
  data/cards.ts        card definitions + deck builder
  game/engine.ts        pure game-state transition functions
  game/ai.ts             AI opponent turn logic (async generator)
  components/            all UI pieces (cards, board, hero panel, modals…)
  lib/storage.ts         localStorage leaderboard
  lib/shelby.ts           Shelby client + blob download
  hooks/useShelbySync.ts  Shelby upload hook
  App.tsx                 game orchestration + targeting flow
```

## Customizing

- **Add a card**: add an entry to `CARDS` in `src/data/cards.ts` and include
  its id in `buildDeck()`.
- **Change the theme**: colors, fonts, and glow effects are design tokens in
  `tailwind.config.js` and `src/index.css`.
- **Tune the AI**: `src/game/ai.ts` is a small greedy heuristic — easy to
  read and adjust (play priority, trade logic, hero power usage).

## License

MIT — do whatever you like with it.

# Transferdle

A daily football game: guess a player's Transfermarkt market value in €M within 5 guesses.
Each guess turns green, yellow, orange or red with a ⬆/⬇ hint. Everyone gets the same player each day.

```sh
npm install
npm run dev      # dev server (adds a "replay" button and ?date=YYYY-MM-DD override)
npm test         # vitest
npm run build
```

## Player data

`src/data/players.json` is **generated and committed**. Do not edit it by hand.

```sh
npm run data                          # download the dataset and regenerate
npm run data -- --from-dir <dir>      # use local players.csv + competitions.csv
```

- **Source:** [transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) (CC0). The game never contacts Transfermarkt.
- **Curation** (`scripts/curate.ts`): players active in the latest season in the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie and Primeira Liga, valued at €1M or more, top 1,000 by value.
- **Tiers:** by value rank, as a proxy for recognisability: top 25% easy, next 40% medium, rest hard.
- **Rotation** (`dailyPlayer` in `src/lib/game.ts`): difficulty ramps through the week (Mon–Tue easy, Wed–Fri medium, Sat–Sun hard). Each tier is shuffled with a fixed seed and used in order, so no player repeats until the tier is exhausted.

## Puzzle schedule

Live puzzles come from `src/data/schedule.json`, not from the rotation directly. Each day stores a frozen copy of its player (value, club, etc.; photos are merged in by id), so **regenerating `players.json` never changes a day that's already scheduled.**

```sh
npm run schedule                 # append days up to 60 days from today
npm run schedule -- --days 90
npm run schedule:check           # validate (CI also checks it's append-only)
```

- New days use the rotation's pick, or a seeded same-tier fallback if that player appeared in the last 365 days (`src/lib/schedule.ts`).
- CI fails any PR that edits or removes an existing day. To fix a bad puzzle, change it deliberately and explain why in the PR.
- The `Schedule runway` workflow runs weekly and fails when fewer than 14 days are left, so GitHub emails you before it runs out. If it does run out, the app falls back to the rotation and logs a warning.
- Typical refresh: `npm run data && npm run images && npm run schedule`, then open a PR.

## Images

Photos are **not** taken from Transfermarkt: their terms prohibit scraping and the photos are third-party copyrighted.
Instead, `npm run images` (`scripts/build-images.ts`) finds openly licensed photos on **Wikimedia Commons**:

1. Wikidata maps each Transfermarkt player ID (property P2446) to a Commons image (P18).
2. Commons supplies the licence, author and a 400px thumbnail.
3. Only **CC0, public domain, CC BY and CC BY-SA** are kept (`isAllowedLicense` in `scripts/images.ts`). NC, ND, GFDL-only and unknown licences are dropped.

Results go to `src/data/images.json` (committed), keyed by player id and merged in `src/data/players.ts`.
The card shows the photo with a credit line linking to its Commons page, which satisfies the attribution requirement.
Players without a free photo, or whose image fails to load, show an initials avatar.
Photos are hotlinked from Wikimedia's servers, which is permitted for thumbnails; if traffic grows, self-host them.
Re-run `npm run images` after regenerating the player pool.

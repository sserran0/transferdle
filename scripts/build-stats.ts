// Usage: npm run stats                       (downloads appearances + games, ~50 MB compressed)
//        npm run stats -- --from-dir <dir>   (dir with appearances.csv and games.csv)
//        npm run stats -- --season 2025
// Builds src/data/stats.json from the CC0 transfermarkt-datasets match files. Run on demand;
// the app never touches the network. Stats are club-only and cover one season.
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'
import { StatsBuilder, csvRows } from './stats.ts'

const BASE = 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data'
const PLAYERS = new URL('../src/data/players.json', import.meta.url)
const OUT = new URL('../src/data/stats.json', import.meta.url)
/** The last full season. Pinned (not "latest in the data") so a new season's first few matches can't replace it. */
const DEFAULT_SEASON = 2025

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined }
const dir = arg('--from-dir')
const season = Number(arg('--season') ?? DEFAULT_SEASON)

async function lines(name: string): Promise<AsyncIterable<string>> {
  if (dir) return createInterface({ input: createReadStream(join(dir, `${name}.csv`)), crlfDelay: Infinity })
  const res = await fetch(`${BASE}/${name}.csv.gz`)
  if (!res.ok || !res.body) throw new Error(`Download failed for ${name}: ${res.status}`)
  return createInterface({ input: Readable.fromWeb(res.body as never).pipe(createGunzip()), crlfDelay: Infinity })
}

const pool = JSON.parse(readFileSync(PLAYERS, 'utf8')) as { id: string; position: string }[]

const gameRows = []
for await (const g of csvRows(await lines('games'))) gameRows.push(g)
const builder = new StatsBuilder(pool, gameRows, season)
for await (const a of csvRows(await lines('appearances'))) builder.add(a)

const ids = pool.map((p) => p.id).sort()
const stats = builder.result(ids)
writeFileSync(OUT, `{\n${Object.entries(stats).map(([id, s]) => `${JSON.stringify(id)}:${JSON.stringify(s)}`).join(',\n')}\n}\n`)
const gk = Object.values(stats).filter((s) => s.kind === 'goalkeeper').length
console.log(`Wrote src/data/stats.json: ${Object.keys(stats).length}/${pool.length} players with ${season} club stats (${gk} goalkeepers).`)

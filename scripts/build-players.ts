// Usage: npm run data            (downloads the CC0 transfermarkt-datasets files)
//        npm run data -- --from-dir <dir with players.csv and competitions.csv>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { curate, parseCsv } from './curate.ts'

const BASE = 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data'
const OUT = new URL('../src/data/players.json', import.meta.url)

async function load(name: string, dir?: string): Promise<string> {
  if (dir) return readFileSync(join(dir, `${name}.csv`), 'utf8')
  const res = await fetch(`${BASE}/${name}.csv.gz`)
  if (!res.ok) throw new Error(`Download failed for ${name}: ${res.status}`)
  return gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8')
}

const flag = process.argv.indexOf('--from-dir')
const dir = flag > -1 ? process.argv[flag + 1] : undefined

const [players, competitions] = await Promise.all([load('players', dir), load('competitions', dir)])
const pool = curate(parseCsv(players), parseCsv(competitions))

// One player per line keeps diffs reviewable when the data is refreshed.
writeFileSync(OUT, `[\n${pool.map((p) => JSON.stringify(p)).join(',\n')}\n]\n`)
const tiers = pool.reduce<Record<string, number>>((n, p) => ({ ...n, [p.tier]: (n[p.tier] ?? 0) + 1 }), {})
console.log(`Wrote ${pool.length} players to src/data/players.json`, tiers)

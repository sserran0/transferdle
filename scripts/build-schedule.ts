// Usage: npm run schedule                 (extend to 60 days from today)
//        npm run schedule -- --days 90
// Appends puzzle days to src/data/schedule.json. Days already in the file are
// never changed, so regenerating players.json can't alter a live puzzle.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { Player } from '../src/types.ts'
import { dateKey } from '../src/lib/seed.ts'
import { extendSchedule, runwayDays, validateSchedule, type ScheduleEntry } from '../src/lib/schedule.ts'

const PLAYERS = new URL('../src/data/players.json', import.meta.url)
const OUT = new URL('../src/data/schedule.json', import.meta.url)

const flag = process.argv.indexOf('--days')
const days = flag > -1 ? Number(process.argv[flag + 1]) : 60
if (!Number.isInteger(days) || days < 1) throw new Error('--days must be a positive integer')

const today = new Date()
const until = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days))

const pool = JSON.parse(readFileSync(PLAYERS, 'utf8')) as Player[]
const current: ScheduleEntry[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : []
const next = extendSchedule(current, pool, until)

const errors = validateSchedule(next)
if (errors.length) throw new Error(`Schedule invalid:\n${errors.join('\n')}`)

// One day per line keeps diffs reviewable: a PR shows exactly which days were added.
writeFileSync(OUT, `[\n${next.map((e) => JSON.stringify(e)).join(',\n')}\n]\n`)
console.log(`Added ${next.length - current.length} days. Scheduled through ${next.at(-1)?.date} (${runwayDays(next, dateKey(today))} days ahead).`)

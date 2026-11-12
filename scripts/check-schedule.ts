// Usage: node scripts/check-schedule.ts [--base <old schedule.json>] [--min-runway <days>]
// Exits non-zero if the schedule is malformed, rewrites days that exist in the
// base version (CI passes the copy from main), or runs out within --min-runway days.
import { readFileSync } from 'node:fs'
import { dateKey } from '../src/lib/seed.ts'
import { appendOnlyViolations, runwayDays, validateSchedule, type ScheduleEntry } from '../src/lib/schedule.ts'

const arg = (name: string) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}
const load = (path: string | URL) => JSON.parse(readFileSync(path, 'utf8')) as ScheduleEntry[]

const schedule = load(new URL('../src/data/schedule.json', import.meta.url))
const errors = validateSchedule(schedule)

const base = arg('--base')
if (base) errors.push(...appendOnlyViolations(load(base), schedule))

const minRunway = arg('--min-runway')
const runway = runwayDays(schedule, dateKey())
if (minRunway && runway < Number(minRunway)) {
  errors.push(`Only ${runway} days scheduled ahead (need ${minRunway}). Run: npm run schedule`)
}

if (errors.length) {
  console.error(`Schedule check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`Schedule OK: ${schedule.length} days, through ${schedule.at(-1)?.date} (${runway} ahead).`)

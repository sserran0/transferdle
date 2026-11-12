import type { Player } from '../types.ts'
import { LAUNCH_DATE, dailyPlayer, tierForDate } from './game.ts'
import { dateKey, hashString, seededRng } from './seed.ts'

/** A player as frozen into the schedule. Photos are merged in at runtime by id. */
export type PlayerSnapshot = Omit<Player, 'imageUrl' | 'imageCredit' | 'imagePageUrl'>

export interface ScheduleEntry {
  date: string
  player: PlayerSnapshot
}

/** Days a player must wait before they can be scheduled again. */
export const REPEAT_GAP_DAYS = 365

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function nextDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + 1))
}

function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000)
}

function snapshot(p: Player): PlayerSnapshot {
  const { imageUrl: _u, imageCredit: _c, imagePageUrl: _p, ...rest } = p
  return rest
}

/**
 * Append days to the schedule up to and including `until`. Existing entries are
 * never touched, so once a day is scheduled its puzzle can't change, even if the
 * player pool is regenerated later.
 *
 * Each new day first tries `dailyPlayer` (the original rotation), then falls back
 * to a seeded pick among same-tier players not used in the last REPEAT_GAP_DAYS.
 */
export function extendSchedule(schedule: ScheduleEntry[], pool: Player[], until: string): ScheduleEntry[] {
  if (!pool.length) throw new Error('Player pool is empty')
  const out = [...schedule]
  let date = out.length ? nextDateKey(out[out.length - 1].date) : LAUNCH_DATE

  for (; date <= until; date = nextDateKey(date)) {
    const recent = new Set(out.filter((e) => daysBetween(e.date, date) < REPEAT_GAP_DAYS).map((e) => e.player.id))
    const tier = tierForDate(date)
    let player: Player = dailyPlayer(pool, date)
    if (recent.has(player.id)) {
      const sameTier = pool.filter((p) => p.tier === tier && !recent.has(p.id))
      const fresh = sameTier.length ? sameTier : pool.filter((p) => !recent.has(p.id))
      if (!fresh.length) throw new Error(`No unused players left for ${date}; grow the pool or shorten REPEAT_GAP_DAYS`)
      const sorted = [...fresh].sort((a, b) => a.id.localeCompare(b.id))
      player = sorted[Math.floor(seededRng(hashString(`fallback:${date}`))() * sorted.length)]
    }
    out.push({ date, player: snapshot(player) })
  }
  return out
}

/** Structural problems with a schedule. Empty array means it's valid. */
export function validateSchedule(schedule: ScheduleEntry[]): string[] {
  const errors: string[] = []
  const lastSeen = new Map<string, string>()
  schedule.forEach((e, i) => {
    if (!DATE_RE.test(e.date)) errors.push(`Entry ${i}: bad date "${e.date}"`)
    if (i > 0 && e.date !== nextDateKey(schedule[i - 1].date)) {
      errors.push(`Entry ${i}: ${e.date} does not follow ${schedule[i - 1].date}`)
    }
    if (!e.player?.id || !(e.player.valueM > 0)) errors.push(`${e.date}: missing player id or value`)
    const prev = lastSeen.get(e.player?.id)
    if (prev && daysBetween(prev, e.date) < REPEAT_GAP_DAYS) {
      errors.push(`${e.date}: ${e.player.id} already played on ${prev}`)
    }
    lastSeen.set(e.player?.id, e.date)
  })
  return errors
}

/**
 * Changes that rewrite history: every day in `base` must still be in `next`,
 * unchanged. Used in CI to block edits to already-scheduled puzzles.
 */
export function appendOnlyViolations(base: ScheduleEntry[], next: ScheduleEntry[]): string[] {
  const byDate = new Map(next.map((e) => [e.date, JSON.stringify(e.player)]))
  return base.flatMap((e) => {
    const now = byDate.get(e.date)
    if (now === undefined) return [`${e.date} was removed`]
    return now === JSON.stringify(e.player) ? [] : [`${e.date} was changed (${e.player.id})`]
  })
}

/** Scheduled days remaining after `today` (0 if today itself is the last). */
export function runwayDays(schedule: ScheduleEntry[], today: string): number {
  if (!schedule.length) return 0
  return Math.max(0, daysBetween(today, schedule[schedule.length - 1].date))
}

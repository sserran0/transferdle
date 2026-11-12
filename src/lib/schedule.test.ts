import { describe, expect, it } from 'vitest'
import { PLAYERS } from '../data/players'
import raw from '../data/schedule.json'
import { LAUNCH_DATE, dailyPlayer, tierForDate } from './game'
import {
  REPEAT_GAP_DAYS, appendOnlyViolations, extendSchedule, nextDateKey, runwayDays, validateSchedule,
  type ScheduleEntry,
} from './schedule'

const SCHEDULE = raw as ScheduleEntry[]

describe('extendSchedule', () => {
  const base = extendSchedule([], PLAYERS, '2026-12-31')

  it('starts at launch and matches the original rotation', () => {
    expect(base[0].date).toBe(LAUNCH_DATE)
    for (const e of base.slice(0, 30)) expect(e.player.id).toBe(dailyPlayer(PLAYERS, e.date).id)
  })

  it('never changes days that are already scheduled, even with a different pool', () => {
    const shrunk = PLAYERS.slice(0, 600)
    const next = extendSchedule(base, shrunk, '2027-02-28')
    expect(next.slice(0, base.length)).toEqual(base)
    expect(appendOnlyViolations(base, next)).toEqual([])
    expect(next.at(-1)?.date).toBe('2027-02-28')
  })

  it('avoids repeats when the pool is regenerated under it', () => {
    // Simulate a data refresh: some players leave, values move.
    const refreshed = PLAYERS.filter((_, i) => i % 3 !== 0).map((p) => ({ ...p, valueM: p.valueM + 1 }))
    const next = extendSchedule(base, refreshed, '2027-06-30')
    expect(validateSchedule(next)).toEqual([])
    expect(next.slice(0, base.length)).toEqual(base)
  })

  it('keeps the weekday tier', () => {
    for (const e of base) expect(e.player.tier).toBe(tierForDate(e.date))
  })

  it('is a no-op when already scheduled past `until`', () => {
    expect(extendSchedule(base, PLAYERS, '2026-11-20')).toEqual(base)
  })

  it('freezes data, not photos', () => {
    expect(base.every((e) => !('imageUrl' in e.player))).toBe(true)
  })
})

describe('validateSchedule', () => {
  const two = extendSchedule([], PLAYERS, nextDateKey(LAUNCH_DATE))
  it('flags gaps and repeats', () => {
    const gap = [two[0], { ...two[1], date: '2026-11-15' }]
    expect(validateSchedule(gap)[0]).toMatch(/does not follow/)
    const repeat = [two[0], { ...two[1], player: two[0].player }]
    expect(validateSchedule(repeat)[0]).toMatch(/already played/)
  })
})

describe('appendOnlyViolations', () => {
  const base = extendSchedule([], PLAYERS, '2026-11-20')
  it('reports edited and removed days', () => {
    const edited = base.map((e, i) => (i === 3 ? { ...e, player: { ...e.player, valueM: 1 } } : e))
    expect(appendOnlyViolations(base, edited)).toEqual([`${base[3].date} was changed (${base[3].player.id})`])
    expect(appendOnlyViolations(base, base.slice(0, -1))).toEqual([`${base.at(-1)!.date} was removed`])
  })
})

describe('committed schedule', () => {
  it('is valid', () => {
    expect(validateSchedule(SCHEDULE)).toEqual([])
  })
  it('starts at launch', () => {
    expect(SCHEDULE[0].date).toBe(LAUNCH_DATE)
  })
  it('counts runway', () => {
    expect(runwayDays(SCHEDULE, SCHEDULE.at(-1)!.date)).toBe(0)
    expect(REPEAT_GAP_DAYS).toBeGreaterThan(0)
  })
})

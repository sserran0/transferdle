import { describe, expect, it } from 'vitest'
import { PLAYERS } from '../data/players'
import { dailyPlayer, tierForDate } from './game'
import { feedback, parseGuess } from './scoring'
import { dateKey, previousDateKey } from './seed'
import { buildShareText } from './share'
import { emptyStats, recordResult } from './stats'

describe('daily seed', () => {
  it('is stable per date and independent of pool order', () => {
    expect(dailyPlayer(PLAYERS, '2026-11-09').id).toBe(dailyPlayer([...PLAYERS].reverse(), '2026-11-09').id)
  })
  it('varies across dates', () => {
    const ids = new Set(Array.from({ length: 30 }, (_, i) => dailyPlayer(PLAYERS, `2026-12-${String(i + 1).padStart(2, '0')}`).id))
    expect(ids.size).toBeGreaterThan(3)
  })
  it('computes the previous day across boundaries', () => {
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28')
    expect(previousDateKey('2027-01-01')).toBe('2026-12-31')
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('daily pool', () => {
  const days = (n: number) => Array.from({ length: n }, (_, i) => dateKey(new Date(2026, 10, 10 + i)))
  it('matches the weekday tier', () => {
    for (const d of days(14)) expect(dailyPlayer(PLAYERS, d).tier).toBe(tierForDate(d))
  })
  it('never repeats a player within a year', () => {
    const ids = days(365).map((d) => dailyPlayer(PLAYERS, d).id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('is stable across calls', () => {
    expect(dailyPlayer(PLAYERS, '2027-03-14').id).toBe(dailyPlayer([...PLAYERS].reverse(), '2027-03-14').id)
  })
})

describe('stats', () => {
  it('builds and breaks streaks', () => {
    let s = recordResult(emptyStats(), '2026-11-09', true, 3)
    s = recordResult(s, '2026-11-10', true, 2)
    expect(s.currentStreak).toBe(2)
    s = recordResult(s, '2026-11-12', true, 1) // skipped a day
    expect(s.currentStreak).toBe(1)
    expect(s.maxStreak).toBe(2)
    s = recordResult(s, '2026-11-13', false, 5)
    expect(s.currentStreak).toBe(0)
    expect(s.distribution).toEqual([1, 1, 1, 0, 0, 1])
  })
  it('does not double count a date', () => {
    const s = recordResult(emptyStats(), '2026-11-09', true, 3)
    expect(recordResult(s, '2026-11-09', true, 3)).toBe(s)
  })
})

describe('scoring and share', () => {
  it('parses typed input', () => {
    expect(parseGuess('45')).toBe(45)
    expect(parseGuess('€12,5M')).toBe(12.5)
    expect(parseGuess('500k')).toBe(0.5)
    expect(parseGuess('abc')).toBeNull()
    expect(parseGuess('900')).toBeNull()
  })
  it('colours guesses', () => {
    expect(feedback(100, 100)).toBe('green')
    expect(feedback(112, 100)).toBe('yellow')
    expect(feedback(200, 100)).toBe('red')
    expect(feedback(80, 100)).toBe('orange')
  })
  it('builds spoiler-free share text', () => {
    const t = buildShareText('2026-11-09', [112, 100], 100, true)
    expect(t).toBe('Transferdle 2026-11-09 2/5\n🟨🟩')
  })
})

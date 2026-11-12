import { describe, expect, it } from 'vitest'
import { PLAYERS } from '../data/players'
import { dailyPlayer, gameReducer, isDuplicateGuess, newGame, tierForDate } from './game'
import { feedback, parseGuess } from './scoring'
import { dateKey, previousDateKey } from './seed'
import { ageOn } from './age'
import { GRASS_A, GRASS_B, LINE, pitchGrid } from './pitch'
import { shouldShowHelp } from './help'
import { ARROW_DOWN, ARROW_UP, BLOCK, CHECK, pixelPath, pixmapSize } from './pixelart'
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

describe('duplicate guesses', () => {
  it('detects the same displayed value', () => {
    expect(isDuplicateGuess([12, 30], 12.001)).toBe(true)
    expect(isDuplicateGuess([12, 30], 12.5)).toBe(false)
  })
  it('reducer ignores a repeated guess', () => {
    const s0 = newGame(PLAYERS[0])
    const s1 = gameReducer(s0, { type: 'guess', value: 12 })
    expect(gameReducer(s1, { type: 'guess', value: 12 })).toBe(s1)
    expect(gameReducer(s1, { type: 'guess', value: 13 }).guesses).toEqual([12, 13])
  })
})

describe('first-visit help', () => {
  const none = emptyStats()
  it('shows for a brand-new visitor only', () => {
    expect(shouldShowHelp(false, none, [])).toBe(true)
    expect(shouldShowHelp(true, none, [])).toBe(false)
  })
  it('skips existing players', () => {
    expect(shouldShowHelp(false, recordResult(none, '2026-11-09', true, 3), [])).toBe(false)
    expect(shouldShowHelp(false, none, [12])).toBe(false)
  })
})

describe('pixel art', () => {
  it('has rectangular sprites', () => {
    for (const map of [ARROW_UP, ARROW_DOWN, CHECK, BLOCK]) {
      const { w } = pixmapSize(map)
      expect(map.every((row) => row.length === w)).toBe(true)
    }
  })
  it('draws the down arrow as the up arrow flipped, and both symmetric', () => {
    expect(ARROW_DOWN).toEqual([...ARROW_UP].reverse())
    for (const row of ARROW_UP) expect(row).toBe([...row].reverse().join(''))
  })
  it('gives the attempt block an ink outline with chamfered corners', () => {
    const { w, h } = pixmapSize(BLOCK)
    expect(BLOCK[0][0]).toBe('.')
    expect(BLOCK[h - 1][w - 1]).toBe('.')
    expect(BLOCK[5][0]).toBe('#')
    expect(BLOCK[5][w - 1]).toBe('#')
  })
  it('draws a check bolder than a one-pixel stroke', () => {
    const filled = (m: readonly string[]) => m.join('').split('#').length - 1
    expect(filled(CHECK)).toBeGreaterThan(24)
  })
  it('turns pixels into one path rectangle per run', () => {
    expect(pixelPath(['.##', '#..'])).toBe('M1 0h2v1h-2zM0 1h1v1h-1z')
    expect(pixelPath(['...'])).toBe('')
    expect(pixelPath(['ab.a'], 'ab')).toBe('M0 0h2v1h-2zM3 0h1v1h-1z') // several characters count as one shape
  })
})

describe('ageOn', () => {
  it('counts whole years and handles birthdays', () => {
    expect(ageOn('2000-07-21', '2026-07-20')).toBe(25)
    expect(ageOn('2000-07-21', '2026-07-21')).toBe(26)
    expect(ageOn('2000-12-31', '2027-01-01')).toBe(26)
    expect(ageOn('2004-02-29', '2026-02-28')).toBe(21)
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

describe('pitchGrid', () => {
  const cols = 60, rows = 100
  const g = pitchGrid(cols, rows)
  const at = (x: number, y: number) => g[y * cols + x]
  it('has one cell per grid position, using only known values', () => {
    expect(g.length).toBe(cols * rows)
    expect(new Set(g)).toEqual(new Set([GRASS_A, GRASS_B, LINE]))
  })
  it('draws the halfway line across the middle between the touchlines', () => {
    const y = Math.floor(rows / 2)
    for (let x = 2; x <= cols - 3; x++) expect(at(x, y)).toBe(LINE)
    expect(at(0, y)).not.toBe(LINE)
  })
  it('alternates mowing stripes', () => {
    expect(at(0, 0)).toBe(GRASS_A)
    expect(at(0, 6)).toBe(GRASS_B)
  })
  it('turns landscape (laptop) screens so the goals are at the left and right', () => {
    const c = 120, r = 60, l = pitchGrid(c, r)
    const lat = (x: number, y: number) => l[y * c + x]
    const x = Math.floor(c / 2)
    for (let y = 2; y <= r - 3; y++) expect(lat(x, y)).toBe(LINE) // vertical halfway line
    for (let y = 2; y <= r - 3; y++) { expect(lat(2, y)).toBe(LINE); expect(lat(c - 3, y)).toBe(LINE) } // goal lines
    expect(lat(x, 0)).not.toBe(LINE)
  })
  it('scales the markings with the screen', () => {
    // Distance from the goal line to the first line inside it (the goal box) along the middle row.
    const goalBoxDepth = (c: number, r: number) => {
      const g = pitchGrid(c, r), y = Math.floor(r / 2) - 3
      for (let x = 3; x < c; x++) if (g[y * c + x] === LINE) return x - 2
      return 0
    }
    expect(goalBoxDepth(300, 120)).toBeGreaterThan(goalBoxDepth(120, 60))
  })
  it('keeps every marking on screen for phone and laptop sizes', () => {
    for (const [c, r] of [[49, 106], [106, 49], [171, 82], [320, 180]]) {
      const g = pitchGrid(c, r)
      expect(g.length).toBe(c * r)
      expect(g.filter((v) => v === LINE).length).toBeGreaterThan(c + r)
    }
  })
  it('survives tiny viewports', () => {
    expect(() => pitchGrid(5, 5)).not.toThrow()
  })
})

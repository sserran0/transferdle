import { MAX_GUESSES } from './game'
import { emptyStats, type Stats } from './stats'

const GAME_KEY = 'transferdle:v2:game'
const STATS_KEY = 'transferdle:v2:stats'
const HELP_KEY = 'transferdle:v2:seen-help'

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or quota: the game still works, it just won't persist.
  }
}

const isNumArray = (v: unknown, max: number): v is number[] =>
  Array.isArray(v) && v.length <= max && v.every((n) => typeof n === 'number' && Number.isFinite(n))

/** Today's saved guesses, or [] if none or stale/corrupt. */
export function loadGuesses(date: string): number[] {
  const g = read(GAME_KEY) as { date?: string; guesses?: unknown } | null
  return g && g.date === date && isNumArray(g.guesses, MAX_GUESSES) ? g.guesses : []
}

export function saveGuesses(date: string, guesses: number[]) {
  write(GAME_KEY, { date, guesses })
}

export function loadStats(): Stats {
  const s = read(STATS_KEY) as Partial<Stats> | null
  if (
    s && typeof s.played === 'number' && typeof s.won === 'number' &&
    typeof s.currentStreak === 'number' && typeof s.maxStreak === 'number' &&
    isNumArray(s.distribution, MAX_GUESSES + 1) && s.distribution.length === MAX_GUESSES + 1
  ) {
    return { ...(s as Stats), lastPlayedDate: typeof s.lastPlayedDate === 'string' ? s.lastPlayedDate : null }
  }
  return emptyStats()
}

export function saveStats(s: Stats) {
  write(STATS_KEY, s)
}

export function loadSeenHelp(): boolean {
  return read(HELP_KEY) === true
}

export function saveSeenHelp() {
  write(HELP_KEY, true)
}

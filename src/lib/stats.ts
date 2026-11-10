import { MAX_GUESSES } from './game'
import { previousDateKey } from './seed'

export interface Stats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
  lastPlayedDate: string | null
  /** distribution[i] = wins in i+1 guesses; the final slot counts losses. */
  distribution: number[]
}

export function emptyStats(): Stats {
  return {
    played: 0, won: 0, currentStreak: 0, maxStreak: 0,
    lastPlayedDate: null, distribution: Array(MAX_GUESSES + 1).fill(0),
  }
}

/** Record a finished daily game. A second call for the same date is a no-op. */
export function recordResult(s: Stats, date: string, won: boolean, guessCount: number): Stats {
  if (s.lastPlayedDate === date) return s
  const continues = s.lastPlayedDate === previousDateKey(date)
  const currentStreak = won ? (continues ? s.currentStreak : 0) + 1 : 0
  const distribution = [...s.distribution]
  distribution[won ? guessCount - 1 : MAX_GUESSES] += 1
  return {
    played: s.played + 1,
    won: s.won + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(s.maxStreak, currentStreak),
    lastPlayedDate: date,
    distribution,
  }
}

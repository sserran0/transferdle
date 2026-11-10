import type { Player, Tier } from '../types'
import { dateKey, hashString, seededRng } from './seed'
import { isCorrect } from './scoring'

export const MAX_GUESSES = 5

export interface GameState {
  /** The single player for this game. */
  player: Player
  /** Guesses so far in EUR millions, oldest first. */
  guesses: number[]
}

export type GameAction =
  | { type: 'guess'; value: number }
  | { type: 'reset'; player: Player } // dev tooling only

export type GameStatus = 'playing' | 'won' | 'lost'

/** Pick one player using `rng` (defaults to Math.random, for free play). */
export function pickPlayer(pool: Player[], rng: () => number = Math.random): Player {
  return pool[Math.floor(rng() * pool.length)]
}

/** First puzzle date. Day counting for the no-repeat rotation starts here. */
export const LAUNCH_DATE = '2026-11-10'

/** Difficulty ramps through the week: Sun..Sat. */
export const TIER_BY_WEEKDAY: Tier[] = ['hard', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard']

export function tierForDate(date: string): Tier {
  const [y, m, d] = date.split('-').map(Number)
  return TIER_BY_WEEKDAY[new Date(y, m - 1, d).getDay()]
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Same player for everyone on the same date, with no server and no state.
 * Each tier's pool is shuffled with a seed per cycle and consumed in order, one
 * per matching day, so a player can't repeat until their whole tier is used up.
 * The pool is sorted by id first so file order can't change the answer.
 * Note: adding or removing players reshuffles future days (and today's), so
 * regenerate the pool deliberately, not automatically.
 */
export function dailyPlayer(pool: Player[], date: string): Player {
  const tier = tierForDate(date)
  const tierPool = pool.filter((p) => p.tier === tier)
  const candidates = (tierPool.length ? tierPool : pool).sort((a, b) => a.id.localeCompare(b.id))

  // How many earlier days since launch had this tier? That is this day's slot.
  let slot = 0
  const [y, m, d] = LAUNCH_DATE.split('-').map(Number)
  for (const day = new Date(y, m - 1, d); dateKey(day) < date; day.setDate(day.getDate() + 1)) {
    if (tierForDate(dateKey(day)) === tier) slot++
  }
  const cycle = Math.floor(slot / candidates.length)
  return shuffled(candidates, seededRng(hashString(`${tier}:${cycle}`)))[slot % candidates.length]
}

export function newGame(player: Player, guesses: number[] = []): GameState {
  return { player, guesses }
}

export function gameStatus(s: GameState): GameStatus {
  const last = s.guesses[s.guesses.length - 1]
  if (last !== undefined && isCorrect(last, s.player.valueM)) return 'won'
  return s.guesses.length >= MAX_GUESSES ? 'lost' : 'playing'
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  if (a.type === 'reset') return newGame(a.player)
  return gameStatus(s) === 'playing' ? { ...s, guesses: [...s.guesses, a.value] } : s
}

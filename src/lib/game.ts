import type { Player } from '../types'
import { hashString, seededRng } from './seed'
import { isCorrect } from './scoring'

export const MAX_GUESSES = 5

export interface GameState {
  /** The single player for this game. */
  player: Player
  /** Guesses so far in EUR millions, oldest first. */
  guesses: number[]
}

export type GameAction = { type: 'guess'; value: number }

export type GameStatus = 'playing' | 'won' | 'lost'

/** Pick one player using `rng` (defaults to Math.random, for free play). */
export function pickPlayer(pool: Player[], rng: () => number = Math.random): Player {
  return pool[Math.floor(rng() * pool.length)]
}

/** Everyone gets the same player on the same date. Sorted so pool order can't change the answer. */
export function dailyPlayer(pool: Player[], date: string): Player {
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  return pickPlayer(sorted, seededRng(hashString(date)))
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
  return gameStatus(s) === 'playing' ? { ...s, guesses: [...s.guesses, a.value] } : s
}

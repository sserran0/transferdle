import type { Player } from '../types'
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
  | { type: 'restart'; player: Player }

export type GameStatus = 'playing' | 'won' | 'lost'

/**
 * Pick one player. `rng` is injectable so v2 can swap in a seeded
 * generator for the daily puzzle.
 */
export function pickPlayer(pool: Player[], rng: () => number = Math.random): Player {
  return pool[Math.floor(rng() * pool.length)]
}

export function newGame(player: Player): GameState {
  return { player, guesses: [] }
}

export function gameStatus(s: GameState): GameStatus {
  const last = s.guesses[s.guesses.length - 1]
  if (last !== undefined && isCorrect(last, s.player.valueM)) return 'won'
  return s.guesses.length >= MAX_GUESSES ? 'lost' : 'playing'
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'guess':
      return gameStatus(s) === 'playing' ? { ...s, guesses: [...s.guesses, a.value] } : s
    case 'restart':
      return newGame(a.player)
  }
}

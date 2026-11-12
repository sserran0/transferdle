import type { Stats } from './stats'

/**
 * Open "How to play" on a first visit. Anyone who has already played (stats or
 * saved guesses) is an existing player and doesn't need it forced on them.
 */
export function shouldShowHelp(seen: boolean, stats: Stats, guesses: number[]): boolean {
  return !seen && stats.played === 0 && guesses.length === 0
}

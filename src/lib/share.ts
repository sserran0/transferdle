import { MAX_GUESSES } from './game'
import { FEEDBACK_EMOJI, feedback } from './scoring'

/** Spoiler-free share text: no player name or value. */
export function buildShareText(
  date: string, guesses: number[], actual: number, won: boolean, url?: string,
): string {
  const score = won ? guesses.length : 'X'
  const grid = guesses.map((g) => FEEDBACK_EMOJI[feedback(g, actual)]).join('')
  return [`Transferdle ${date} ${score}/${MAX_GUESSES}`, grid, url].filter(Boolean).join('\n')
}

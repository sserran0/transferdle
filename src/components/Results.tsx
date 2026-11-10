import type { Player } from '../types'
import { MAX_GUESSES } from '../lib/game'
import { FEEDBACK_EMOJI, feedback, formatValue } from '../lib/scoring'

interface Props {
  player: Player
  guesses: number[]
  won: boolean
  onRestart: () => void
}

export function Results({ player, guesses, won, onRestart }: Props) {
  const grid = guesses.map((g) => FEEDBACK_EMOJI[feedback(g, player.valueM)]).join('')
  return (
    <section className="result" role="status" aria-label="Results">
      <h2>{won ? `Solved in ${guesses.length} / ${MAX_GUESSES}` : 'Out of guesses'}</h2>
      <p className="actual">{player.name}: <strong>{formatValue(player.valueM)}</strong></p>
      <p className="grid" aria-label="Guess summary">{grid}</p>
      <button className="primary" onClick={onRestart}>Play again</button>
    </section>
  )
}

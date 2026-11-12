import { useEffect, useState } from 'react'
import type { Player } from '../types'
import { MAX_GUESSES } from '../lib/game'
import { msUntilNextDay } from '../lib/seed'
import { trackEvent } from '../lib/analytics'
import { buildShareText } from '../lib/share'
import type { Stats } from '../lib/stats'
import { FEEDBACK_EMOJI, feedback, formatValue } from '../lib/scoring'
import { StatsPanel } from './StatsPanel'

interface Props {
  date: string
  player: Player
  guesses: number[]
  won: boolean
  stats: Stats
}

function useCountdown() {
  const [ms, setMs] = useState(msUntilNextDay)
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextDay()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

export function Results({ date, player, guesses, won, stats }: Props) {
  const [notice, setNotice] = useState('')
  const countdown = useCountdown()
  const grid = guesses.map((g) => FEEDBACK_EMOJI[feedback(g, player.valueM)]).join('')

  async function share() {
    trackEvent({ name: 'share_clicked' })
    const text = buildShareText(date, guesses, player.valueM, won, window.location.origin + window.location.pathname)
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setNotice('Copied to clipboard!')
      }
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') setNotice('Could not share. Copy the grid manually.')
    }
  }

  return (
    <section className="result" role="status" aria-label="Results">
      <h2>{won ? `Solved in ${guesses.length} / ${MAX_GUESSES}` : 'Out of guesses'}</h2>
      <p className="actual">{player.name}: <strong>{formatValue(player.valueM)}</strong></p>
      <p className="grid" aria-label="Guess summary">{grid}</p>
      <button className="primary" onClick={share}>Share</button>
      <p className="notice" aria-live="polite">{notice}</p>
      <StatsPanel stats={stats} today={{ guesses: guesses.length, won }} />
      <p className="countdown">Next player in <strong>{countdown}</strong></p>
    </section>
  )
}

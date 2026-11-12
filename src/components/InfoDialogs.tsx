import { RED_BEYOND_M, TOLERANCE, YELLOW_WITHIN_M, formatValue } from '../lib/scoring'
import type { Stats } from '../lib/stats'
import { Modal } from './Modal'
import { ArrowDown, ArrowUp, AttemptBlock } from './PixelArt'
import { StatsPanel } from './StatsPanel'

interface DialogProps { open: boolean; onClose: () => void }

const link = (href: string, text: string) => (
  <a href={href} target="_blank" rel="noreferrer noopener">{text}</a>
)

export function HowToPlayDialog({ open, onClose }: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="How to play">
      <ul className="plain">
        <li>Guess the player's <strong>estimated market value</strong> in €M. You get 5 tries.</li>
        <li>Everyone gets the same player each day. A new one arrives at midnight.</li>
        <li>Type a value like <strong>45</strong>, <strong>12.5</strong> or <strong>500k</strong>.</li>
      </ul>
      <p className="modal-sub">After each guess the box changes colour:</p>
      <ul className="legend">
        <li><AttemptBlock feedback="green" />Correct (within {Math.round(TOLERANCE * 100)}%)</li>
        <li><AttemptBlock feedback="yellow" />Close: within {formatValue(YELLOW_WITHIN_M)}</li>
        <li><AttemptBlock feedback="orange" />Off by {formatValue(YELLOW_WITHIN_M)} to {formatValue(RED_BEYOND_M)}</li>
        <li><AttemptBlock feedback="red" />Off by more than {formatValue(RED_BEYOND_M)}</li>
      </ul>
      <p><ArrowUp scale={1} /> means the real value is higher. <ArrowDown scale={1} /> means it is lower.</p>
      <button type="button" className="primary" onClick={onClose}>Got it</button>
    </Modal>
  )
}

export function AboutDialog({ open, onClose }: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="About">
      <section>
        <h3>A fan project</h3>
        <p>
          Transferdle is a free fan-made game. It is not affiliated with, endorsed by or
          sponsored by Transfermarkt or any club, league or player.
        </p>
      </section>
      <section>
        <h3>Data</h3>
        <p>
          Estimated market values come from {link('https://github.com/dcaribou/transfermarkt-datasets', 'transfermarkt-datasets')} (CC0).
          They are approximate and may be out of date.
        </p>
      </section>
      <section>
        <h3>Photo credits</h3>
        <p>
          Player photos come from {link('https://commons.wikimedia.org/', 'Wikimedia Commons')} under
          free licences. Each photo is credited on the player card and links to its Commons page.
        </p>
      </section>
      <section>
        <h3>Privacy</h3>
        <p>
          Your stats, streak and progress stay in this browser and are never sent anywhere.
          We count visits and finished games with {link('https://vercel.com/docs/analytics/privacy-policy', 'Vercel Web Analytics')}, which uses no cookies.
        </p>
      </section>
    </Modal>
  )
}

export function StatsDialog({ open, onClose, stats, today }: DialogProps & {
  stats: Stats
  /** Today's result once the game is over, to highlight it in the chart. */
  today?: { guesses: number; won: boolean }
}) {
  return (
    <Modal open={open} onClose={onClose} title="Your stats">
      {stats.played === 0 && <p>No finished games yet. Your stats will appear here after your first game.</p>}
      <StatsPanel stats={stats} today={today} />
      <p className="fine">Saved in this browser only.</p>
    </Modal>
  )
}

import { useEffect, useReducer, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { PLAYERS } from './data/players'
import { scheduledPlayer } from './data/schedule'
import { PitchBackground } from './components/PitchBackground'
import { PlayerCard } from './components/PlayerCard'
import { GuessBoard } from './components/GuessBoard'
import { Results } from './components/Results'
import { AboutDialog, HowToPlayDialog, StatsDialog } from './components/InfoDialogs'
import { trackEvent } from './lib/analytics'
import { shouldShowHelp } from './lib/help'
import { dailyPlayer, gameReducer, gameStatus, isDuplicateGuess, newGame, pickPlayer } from './lib/game'
import { MAX_M, MIN_M, formatValue, parseGuess } from './lib/scoring'
import { dateKey } from './lib/seed'
import { recordResult } from './lib/stats'
import { loadGuesses, loadSeenHelp, loadStats, saveGuesses, saveSeenHelp, saveStats } from './lib/storage'

// Fixed for the life of the page. A tab left open overnight shows yesterday's
// puzzle until reloaded. In dev only, ?date=YYYY-MM-DD overrides it so you can
// test daily rollover and streaks.
const TODAY = (import.meta.env.DEV && new URLSearchParams(location.search).get('date')) || dateKey()

// The schedule is the source of truth for live puzzles. Falling back to the
// rotation keeps the game playable if the schedule runs out, but players could
// then see a different puzzle after the next data refresh, so CI alerts first.
function todaysPlayer() {
  const scheduled = scheduledPlayer(TODAY)
  if (scheduled) return scheduled
  console.warn(`No scheduled puzzle for ${TODAY}; using the rotation. Run: npm run schedule`)
  return dailyPlayer(PLAYERS, TODAY)
}

type Panel = 'help' | 'stats' | 'about' | null

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, () =>
    newGame(todaysPlayer(), loadGuesses(TODAY)))
  const [stats, setStats] = useState(loadStats)
  // First-time visitors see "How to play" automatically; afterwards it is behind the "?" button.
  const [panel, setPanel] = useState<Panel>(() =>
    shouldShowHelp(loadSeenHelp(), loadStats(), loadGuesses(TODAY)) ? 'help' : null)
  const closePanel = () => setPanel(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const status = gameStatus(game)
  const { player, guesses } = game
  const over = status !== 'playing'

  useEffect(() => { saveGuesses(TODAY, guesses) }, [guesses])
  useEffect(() => { if (panel === 'help') saveSeenHelp() }, [panel])

  // recordResult ignores a date it has already recorded, so refreshes and
  // StrictMode's double effect can't double-count.
  useEffect(() => {
    if (!over) return
    const before = loadStats()
    const next = recordResult(before, TODAY, status === 'won', guesses.length)
    if (before.lastPlayedDate !== TODAY) trackEvent({ name: 'game_completed', won: status === 'won', guesses: guesses.length })
    saveStats(next)
    setStats(next)
  }, [over, status, guesses.length])

  function submit() {
    const value = parseGuess(text)
    if (value === null) {
      setError(`Enter a value between ${formatValue(MIN_M)} and ${formatValue(MAX_M)}, e.g. 45 or 500k`)
      return
    }
    if (isDuplicateGuess(guesses, value)) {
      setError(`You already guessed ${formatValue(value)}. Try a different value.`)
      return
    }
    setError(null)
    setText('')
    if (guesses.length === 0) trackEvent({ name: 'game_started' })
    dispatch({ type: 'guess', value })
  }

  // Dev only: replay with a fresh random player and no waiting. Stats are not
  // re-recorded for a date that already counted.
  function devReplay() {
    setText('')
    setError(null)
    dispatch({ type: 'reset', player: pickPlayer(PLAYERS) })
  }

  return (
    <>
    <PitchBackground />
    <Analytics />
    <main className="app">
      <header>
        <div className="hb hb-left">
          <button type="button" className="icon-btn" aria-label="How to play" onClick={() => setPanel('help')}>?</button>
          <button type="button" className="icon-btn" aria-label="About, credits and privacy" onClick={() => setPanel('about')}>i</button>
        </div>
        <div className="hb hb-right">
          <button type="button" className="icon-btn" aria-label="Your stats" onClick={() => setPanel('stats')}>
            <svg width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
              <rect x="0" y="4" width="2" height="3" /><rect x="2.5" y="1" width="2" height="6" /><rect x="5" y="3" width="2" height="4" />
            </svg>
          </button>
        </div>
        <h1>Transfer<span>dle</span></h1>
        <p>Daily Puzzle · {TODAY}</p>
      </header>

      <PlayerCard player={player} showName today={TODAY} />

      <GuessBoard
        player={player} guesses={guesses} text={text} error={error} over={over}
        onText={(v) => { setText(v); setError(null) }} onSubmit={submit}
      />

      {over && <Results date={TODAY} player={player} guesses={guesses} won={status === 'won'} stats={stats} />}
      {import.meta.env.DEV && (
        <button type="button" className="dev" onClick={devReplay}>Dev: replay with random player</button>
      )}
      <footer>
        Estimated market value (source: <a href="https://github.com/dcaribou/transfermarkt-datasets" target="_blank" rel="noreferrer noopener">transfermarkt-datasets</a>)
      </footer>
      <HowToPlayDialog open={panel === 'help'} onClose={closePanel} />
      <AboutDialog open={panel === 'about'} onClose={closePanel} />
      <StatsDialog
        open={panel === 'stats'} onClose={closePanel} stats={stats}
        today={over ? { guesses: guesses.length, won: status === 'won' } : undefined}
      />
    </main>
    </>
  )
}

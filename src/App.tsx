import { useEffect, useReducer, useState } from 'react'
import { PLAYERS } from './data/players'
import { PlayerCard } from './components/PlayerCard'
import { GuessBoard } from './components/GuessBoard'
import { Results } from './components/Results'
import { dailyPlayer, gameReducer, gameStatus, newGame } from './lib/game'
import { parseGuess } from './lib/scoring'
import { dateKey } from './lib/seed'
import { recordResult } from './lib/stats'
import { loadGuesses, loadStats, saveGuesses, saveStats } from './lib/storage'

// Fixed for the life of the page. A tab left open overnight shows yesterday's
// puzzle until reloaded.
const TODAY = dateKey()

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, () =>
    newGame(dailyPlayer(PLAYERS, TODAY), loadGuesses(TODAY)))
  const [stats, setStats] = useState(loadStats)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const status = gameStatus(game)
  const { player, guesses } = game
  const over = status !== 'playing'

  useEffect(() => { saveGuesses(TODAY, guesses) }, [guesses])

  // recordResult ignores a date it has already recorded, so refreshes and
  // StrictMode's double effect can't double-count.
  useEffect(() => {
    if (!over) return
    const next = recordResult(loadStats(), TODAY, status === 'won', guesses.length)
    saveStats(next)
    setStats(next)
  }, [over, status, guesses.length])

  function submit() {
    const value = parseGuess(text)
    if (value === null) {
      setError('Enter a value between €100k and €250M, e.g. 45 or 500k')
      return
    }
    setError(null)
    setText('')
    dispatch({ type: 'guess', value })
  }

  return (
    <main className="app">
      <header>
        <h1>Transfer<span>dle</span></h1>
        <p>Daily puzzle · {TODAY}</p>
      </header>

      <PlayerCard player={player} showName />

      <GuessBoard
        player={player} guesses={guesses} text={text} error={error} over={over}
        onText={(v) => { setText(v); setError(null) }} onSubmit={submit}
      />

      {over && <Results date={TODAY} player={player} guesses={guesses} won={status === 'won'} stats={stats} />}
      <footer>Sample data only — values are approximate.</footer>
    </main>
  )
}

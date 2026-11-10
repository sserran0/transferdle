import { useReducer, useState } from 'react'
import { PLAYERS } from './data/players'
import { PlayerCard } from './components/PlayerCard'
import { GuessBoard } from './components/GuessBoard'
import { Results } from './components/Results'
import { gameReducer, gameStatus, newGame, pickPlayer } from './lib/game'
import { parseGuess } from './lib/scoring'

const freshGame = () => newGame(pickPlayer(PLAYERS))

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, freshGame)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const status = gameStatus(game)
  const { player, guesses } = game
  const over = status !== 'playing'

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

  function restart() {
    dispatch({ type: 'restart', player: pickPlayer(PLAYERS) })
    setText('')
    setError(null)
  }

  return (
    <main className="app">
      <header>
        <h1>Transfer<span>dle</span></h1>
        <p>Guess the Transfermarkt value in €M</p>
      </header>

      <PlayerCard player={player} showName />

      <GuessBoard
        player={player} guesses={guesses} text={text} error={error} over={over}
        onText={(v) => { setText(v); setError(null) }} onSubmit={submit}
      />

      {over && <Results player={player} guesses={guesses} won={status === 'won'} onRestart={restart} />}
      <footer>Sample data only — values are approximate.</footer>
    </main>
  )
}

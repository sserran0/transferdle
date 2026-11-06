import { useMemo, useState } from 'react'
import { PLAYERS } from './data/players'
import { PlayerCard } from './components/PlayerCard'
import {
  direction, formatValue, roundGuess, scoreGuess, sliderToValue, valueToSlider,
} from './lib/scoring'

function pickPlayer() {
  return PLAYERS[Math.floor(Math.random() * PLAYERS.length)]
}

export default function App() {
  const [player, setPlayer] = useState(pickPlayer)
  const [t, setT] = useState(valueToSlider(10))
  const [locked, setLocked] = useState(false)

  const guess = useMemo(() => roundGuess(sliderToValue(t)), [t])
  const score = locked ? scoreGuess(guess, player.valueM) : 0
  const dir = locked ? direction(guess, player.valueM) : null

  function next() {
    setPlayer(pickPlayer())
    setT(valueToSlider(10))
    setLocked(false)
  }

  return (
    <main className="app">
      <header><h1>Transfer<span>dle</span></h1><p>Guess the Transfermarkt value</p></header>

      <PlayerCard player={player} showName={locked} />

      <div className="guess">
        <output className="guess-value" aria-live="polite">{formatValue(guess)}</output>
        <input
          type="range" min={0} max={1} step={0.001} value={t}
          disabled={locked} aria-label="Your value guess"
          onChange={(e) => setT(Number(e.target.value))}
        />
        <div className="ticks"><span>€100k</span><span>€1M</span><span>€10M</span><span>€100M</span></div>
      </div>

      {!locked ? (
        <button className="primary" onClick={() => setLocked(true)}>Lock in guess</button>
      ) : (
        <div className="result" role="status">
          <p className="actual">Actual value: <strong>{formatValue(player.valueM)}</strong></p>
          <p>
            {dir === 'exact' ? 'Spot on!' : dir === 'higher' ? '⬆ Too low' : '⬇ Too high'} · <strong>{score}</strong> / 1000
          </p>
          <button className="primary" onClick={next}>Next player</button>
        </div>
      )}
      <footer>Sample data only — values are approximate.</footer>
    </main>
  )
}

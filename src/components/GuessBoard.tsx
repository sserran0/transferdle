import { useEffect, useRef } from 'react'
import type { Player } from '../types'
import { MAX_GUESSES } from '../lib/game'
import { ArrowDown, ArrowUp, Check } from './PixelArt'
import { MAX_M, MIN_M, direction, feedback, formatValue } from '../lib/scoring'

interface Props {
  player: Player
  guesses: number[]
  text: string
  error: string | null
  over: boolean
  onText: (v: string) => void
  onSubmit: () => void
}

export function GuessBoard({ player, guesses, text, error, over, onText, onSubmit }: Props) {
  const activeRef = useRef<HTMLInputElement>(null)
  useEffect(() => { activeRef.current?.focus() }, [guesses.length])

  return (
    <form
      className="board"
      onSubmit={(e) => { e.preventDefault(); if (!over) onSubmit() }}
    >
      {Array.from({ length: MAX_GUESSES }, (_, i) => {
        const submitted = i < guesses.length
        const active = i === guesses.length && !over

        if (submitted) {
          const g = guesses[i]
          const fb = feedback(g, player.valueM)
          const d = direction(g, player.valueM)
          const hint = fb === 'green' ? 'Correct' : d === 'higher' ? 'Too low, go higher' : 'Too high, go lower'
          return (
            <div key={i} className={`cell fb-${fb}`}>
              <input readOnly tabIndex={-1} value={formatValue(g)} aria-label={`Guess ${i + 1}: ${formatValue(g)}. ${hint}`} />
              <span className="arrow" aria-hidden="true">
                {fb === 'green' ? <Check /> : d === 'higher' ? <ArrowUp /> : <ArrowDown />}
              </span>
            </div>
          )
        }
        return (
          <div key={i} className={`cell${active ? ' active' : ''}`}>
            <input
              ref={active ? activeRef : undefined}
              disabled={!active}
              value={active ? text : ''}
              onChange={(e) => onText(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder={active ? `Value in €M (${MIN_M} - ${MAX_M})` : ''}
              aria-label={`Guess ${i + 1}`}
              aria-invalid={active && error ? true : undefined}
            />
          </div>
        )
      })}
      {!over && (
        <>
          <button className="primary" type="submit">Lock in guess</button>
          <p className="error" role="alert">{error ?? ''}</p>
        </>
      )}
    </form>
  )
}

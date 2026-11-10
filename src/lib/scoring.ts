export const MIN_M = 0.1
export const MAX_M = 250

/**
 * Parse typed input into EUR millions. Accepts "12", "12.5", "€12M",
 * "12m", "500k", "1,5". A bare number is millions. Returns null if
 * unparseable or outside MIN_M..MAX_M.
 */
export function parseGuess(raw: string): number | null {
  const m = raw.trim().toLowerCase().replace(/[€\s]/g, '').replace(',', '.').match(/^(\d+(?:\.\d+)?|\.\d+)([mk])?$/)
  if (!m) return null
  const n = parseFloat(m[1]) / (m[2] === 'k' ? 1000 : 1)
  return n >= MIN_M && n <= MAX_M ? n : null
}

export function formatValue(m: number): string {
  if (m < 1) return `€${Math.round(m * 1000)}k`
  return `€${+m.toFixed(2)}M`
}

export type Direction = 'higher' | 'lower' | 'exact'
export function direction(guess: number, actual: number): Direction {
  if (guess === actual) return 'exact'
  return guess < actual ? 'higher' : 'lower'
}

/** A guess within this factor of the true value (±10%) counts as correct. */
export const TOLERANCE = 0.1
export function isCorrect(guess: number, actual: number): boolean {
  return Math.abs(Math.log(guess / actual)) <= Math.log(1 + TOLERANCE)
}

/** Absolute miss (EUR millions) at or under which a wrong guess is yellow. */
export const YELLOW_WITHIN_M = 15
/** Absolute miss (EUR millions) over which a guess is red. */
export const RED_BEYOND_M = 25

export type Feedback = 'green' | 'yellow' | 'orange' | 'red'

/**
 * green: correct; yellow: within €15M; red: more than €25M away.
 * The €15-25M gap was unspecified, so it gets its own orange tier.
 */
export function feedback(guess: number, actual: number): Feedback {
  if (isCorrect(guess, actual)) return 'green'
  const miss = Math.abs(guess - actual)
  if (miss > RED_BEYOND_M) return 'red'
  if (miss <= YELLOW_WITHIN_M) return 'yellow'
  return 'orange'
}

export const FEEDBACK_EMOJI: Record<Feedback, string> = {
  green: '🟩', yellow: '🟨', orange: '🟧', red: '🟥',
}

export const MIN_M = 0.1
export const MAX_M = 250
export const MAX_SCORE = 1000

/** Slider position (0..1) -> value in EUR millions, on a log scale. */
export function sliderToValue(t: number): number {
  return MIN_M * Math.pow(MAX_M / MIN_M, t)
}

export function valueToSlider(v: number): number {
  return Math.log(v / MIN_M) / Math.log(MAX_M / MIN_M)
}

/** Round to a friendly precision for display/guessing. */
export function roundGuess(v: number): number {
  if (v < 1) return Math.round(v * 20) / 20 // 0.05 steps
  if (v < 10) return Math.round(v * 2) / 2 // 0.5 steps
  if (v < 50) return Math.round(v)
  return Math.round(v / 5) * 5
}

export function formatValue(m: number): string {
  if (m < 1) return `€${Math.round(m * 1000)}k`
  return `€${Number.isInteger(m) ? m : m.toFixed(1)}M`
}

/** 1000 for an exact guess, falling to 0 once off by a factor of 5 or more. */
export function scoreGuess(guess: number, actual: number): number {
  const ratioLog = Math.abs(Math.log(guess / actual)) / Math.log(5)
  return Math.max(0, Math.round(MAX_SCORE * (1 - ratioLog)))
}

export type Direction = 'higher' | 'lower' | 'exact'
export function direction(guess: number, actual: number): Direction {
  if (guess === actual) return 'exact'
  return guess < actual ? 'higher' : 'lower'
}

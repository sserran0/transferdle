import { track } from '@vercel/analytics'

/**
 * Engagement events for Vercel Web Analytics. Properties are deliberately
 * coarse: never include the player, the value, the date or what was typed
 * (spoilers, and nothing identifying is needed).
 */
export type AnalyticsEvent =
  | { name: 'game_started' } // first guess of the day
  | { name: 'game_completed'; won: boolean; guesses: number }
  | { name: 'share_clicked' }

export function trackEvent(event: AnalyticsEvent): void {
  const { name, ...props } = event
  try {
    track(name, props)
  } catch {
    // Analytics must never break the game (blocked script, offline, etc.).
  }
}

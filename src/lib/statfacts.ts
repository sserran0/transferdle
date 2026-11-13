import type { PlayerStats } from '../types'

export interface StatFact {
  label: string
  value: string
  /** Plain-language version for screen readers, where the short form is cryptic. */
  spoken?: string
}

/** "2025/26" -> "25/26" */
export const shortSeason = (season: string) => season.replace(/^\d{2}(\d{2})\/(\d{2})$/, '$1/$2')

/**
 * The stat boxes for a player card. Which stats appear depends on position:
 * outfield players show goals and assists, goalkeepers show clean sheets (goals
 * and assists mean nothing for them). Both show games played.
 */
export function statFacts(stats: PlayerStats | undefined): StatFact[] {
  if (!stats) return []
  const games: StatFact = { label: `Games (${shortSeason(stats.season)})`, value: String(stats.games) }
  if (stats.kind === 'goalkeeper') {
    return [games, { label: 'Clean sheets', value: String(stats.cleanSheets ?? 0) }]
  }
  const goals = stats.goals ?? 0
  const assists = stats.assists ?? 0
  return [games, { label: 'Goals / assists', value: `${goals}/${assists}`, spoken: `${goals} goals, ${assists} assists` }]
}

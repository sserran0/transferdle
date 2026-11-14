export type Tier = 'easy' | 'medium' | 'hard'

/** Outfield players have goals and assists; goalkeepers have clean sheets (derived, see scripts/stats.ts). */
export type StatKind = 'outfield' | 'goalkeeper'

export interface PlayerStats {
  /** e.g. "2025/26" */
  season: string
  kind: StatKind
  games: number
  goals?: number
  assists?: number
  cleanSheets?: number
}

export interface Player {
  id: string
  name: string
  position: string
  nationality: string
  nationalityFlag: string
  club: string
  league: string
  /** Flag of the league's country. */
  leagueFlag: string
  /** YYYY-MM-DD; use ageOn() for display. */
  dateOfBirth: string
  /** Transfermarkt market value in EUR millions (transfermarkt-datasets, CC0) */
  valueM: number
  /** Last full season's club stats, merged in from stats.json. Absent if the player has none. */
  stats?: PlayerStats
  /** Difficulty tier, ranked by value as a proxy for recognisability. */
  tier: Tier
  /** Openly licensed Commons photo, merged in from images.json (see README). Absent => initials. */
  imageUrl?: string
  /** e.g. "Jane Doe, CC BY-SA 4.0". Must be displayed with the photo. */
  imageCredit?: string
  /** Commons file page, where the licence and author can be verified. */
  imagePageUrl?: string
}

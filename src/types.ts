export type Tier = 'easy' | 'medium' | 'hard'

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
  /** Difficulty tier, ranked by value as a proxy for recognisability. */
  tier: Tier
  /** Openly licensed Commons photo, merged in from images.json (see README). Absent => initials. */
  imageUrl?: string
  /** e.g. "Jane Doe, CC BY-SA 4.0". Must be displayed with the photo. */
  imageCredit?: string
  /** Commons file page, where the licence and author can be verified. */
  imagePageUrl?: string
}

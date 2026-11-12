import { displayCountry, flagFor } from './flags.ts'

export type Tier = 'easy' | 'medium' | 'hard'
export interface PoolPlayer {
  id: string
  name: string
  position: string
  nationality: string
  nationalityFlag: string
  club: string
  league: string
  /** Flag of the league's country. */
  leagueFlag: string
  /** YYYY-MM-DD. The app computes age from this so it never goes stale. */
  dateOfBirth: string
  valueM: number
  tier: Tier
  /** Intentionally unset: see README "Images". Filled by a future licensed source. */
  imageUrl?: string
  imageCredit?: string
}

type Row = Record<string, string>

/** Minimal RFC-4180 CSV parser (quotes, "" escapes, embedded commas/newlines). */
export function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

/** Transfermarkt competition id -> display name. Also defines the supported leagues. */
export const LEAGUE_NAMES: Record<string, string> = {
  GB1: 'Premier League', ES1: 'La Liga', IT1: 'Serie A', L1: 'Bundesliga',
  FR1: 'Ligue 1', NL1: 'Eredivisie', PO1: 'Liga Portugal',
}
export const LEAGUES = Object.keys(LEAGUE_NAMES)

export interface CurateOptions {
  leagues?: string[]
  /** Players below this value (EUR millions) are dropped. */
  minValueM?: number
  maxPlayers?: number
  /** Share of the ranked pool in each tier: [easy cutoff, medium cutoff]. */
  tierCutoffs?: [number, number]
}

const POSITION_LABEL: Record<string, string> = {
  'Centre-Forward': 'Striker',
  'Left Winger': 'Winger',
  'Right Winger': 'Winger',
}

export function tierForRank(rank: number, total: number, cutoffs: [number, number] = [0.25, 0.65]): Tier {
  const share = rank / total
  return share < cutoffs[0] ? 'easy' : share < cutoffs[1] ? 'medium' : 'hard'
}

/**
 * Active players (latest season in the data) at clubs in the chosen leagues,
 * ranked by current market value. Value is a proxy for recognisability, so the
 * top of the ranking is "easy" and the tail is "hard".
 */
export function curate(players: Row[], competitions: Row[], opts: CurateOptions = {}): PoolPlayer[] {
  const { leagues = LEAGUES, minValueM = 1, maxPlayers = 1000, tierCutoffs } = opts
  const leagueCountry = new Map(competitions.map((c) => [c.competition_id, c.country_name]))
  const season = Math.max(...players.map((p) => Number(p.last_season) || 0))

  const unmapped = new Set<string>()
  const candidates = players
    .filter((p) =>
      Number(p.last_season) === season &&
      leagues.includes(p.current_club_domestic_competition_id) &&
      Number(p.market_value_in_eur) >= minValueM * 1e6 &&
      /^\d{4}-\d{2}-\d{2}/.test(p.date_of_birth) &&
      p.current_club_name && (p.sub_position || p.position))
    .sort((a, b) =>
      Number(b.market_value_in_eur) - Number(a.market_value_in_eur) ||
      Number(b.highest_market_value_in_eur) - Number(a.highest_market_value_in_eur) ||
      a.player_id.localeCompare(b.player_id, 'en', { numeric: true }))
    .slice(0, maxPlayers)

  const out = candidates.map((p, rank): PoolPlayer | null => {
    const clubCountry = leagueCountry.get(p.current_club_domestic_competition_id) ?? ''
    const natFlag = flagFor(p.country_of_citizenship)
    const clubFlag = flagFor(clubCountry)
    if (!natFlag) unmapped.add(p.country_of_citizenship)
    if (!clubFlag) unmapped.add(clubCountry)
    if (!natFlag || !clubFlag) return null
    const position = p.sub_position || p.position
    return {
      id: p.player_code ? `${p.player_code}-${p.player_id}` : p.player_id,
      name: p.name,
      position: POSITION_LABEL[position] ?? position,
      nationality: displayCountry(p.country_of_citizenship),
      nationalityFlag: natFlag,
      club: p.current_club_name,
      league: LEAGUE_NAMES[p.current_club_domestic_competition_id],
      leagueFlag: clubFlag,
      dateOfBirth: p.date_of_birth.slice(0, 10),
      valueM: Math.round(Number(p.market_value_in_eur) / 1e4) / 100,
      tier: tierForRank(rank, candidates.length, tierCutoffs),
    }
  })
  if (unmapped.size) {
    throw new Error(`No flag mapping for: ${[...unmapped].join(', ')}. Add them to scripts/flags.ts.`)
  }
  return out.filter((p): p is PoolPlayer => p !== null)
}

import type { PlayerStats, StatKind } from '../src/types.ts'

type Row = Record<string, string>

/** "2025" -> "2025/26" */
export const seasonLabel = (season: number) => `${season}/${String((season + 1) % 100).padStart(2, '0')}`

/**
 * Position decides which stats matter. The dataset's match rows are identical for
 * every position (goals, assists, cards, minutes), so this distinction is made here:
 * goalkeepers are judged on clean sheets, everyone else on goals and assists.
 */
export const statKindForPosition = (position: string): StatKind => (position === 'Goalkeeper' ? 'goalkeeper' : 'outfield')

/** Minutes a goalkeeper must play for a shutout to count as a clean sheet. */
export const CLEAN_SHEET_MIN_MINUTES = 60

/** Splits one CSV line (RFC 4180 quoting; "" is an escaped quote). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { out.push(field); field = '' }
    else field += c
  }
  out.push(field)
  return out
}

/** Streams CSV rows from lines, joining lines that continue inside a quoted field. Keeps memory flat for huge files. */
export async function* csvRows(lines: AsyncIterable<string>): AsyncGenerator<Row> {
  let header: string[] | null = null
  let pending = ''
  for await (const line of lines) {
    pending = pending ? `${pending}\n${line}` : line
    if ((pending.match(/"/g)?.length ?? 0) % 2 === 1) continue // still inside a quoted field
    if (pending === '') continue
    const cells = parseCsvLine(pending)
    pending = ''
    if (!header) { header = cells; continue }
    yield Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']))
  }
}

interface GameInfo { season: string; national: boolean; homeClub: string; homeGoals: number; awayGoals: number }

/**
 * Season stats for the given players from match-level rows. National-team games
 * are excluded: these are club-season numbers. Feed appearances one at a time with add().
 */
export class StatsBuilder {
  private games = new Map<string, GameInfo>()
  private players: Map<string, string> // Transfermarkt id -> position
  private totals = new Map<string, { games: number; goals: number; assists: number; cleanSheets: number }>()

  private season: number

  constructor(players: { id: string; position: string }[], gameRows: Row[], season: number) {
    this.season = season
    this.players = new Map(players.map((p) => [p.id.split('-').pop() as string, p.position]))
    for (const g of gameRows) {
      this.games.set(g.game_id, {
        season: g.season,
        national: g.competition_type === 'national_team_competition',
        homeClub: g.home_club_id,
        homeGoals: Number(g.home_club_goals) || 0,
        awayGoals: Number(g.away_club_goals) || 0,
      })
    }
  }

  add(a: Row): void {
    const position = this.players.get(a.player_id)
    const game = this.games.get(a.game_id)
    if (!position || !game || game.season !== String(this.season) || game.national) return
    const t = this.totals.get(a.player_id) ?? { games: 0, goals: 0, assists: 0, cleanSheets: 0 }
    t.games++
    t.goals += Number(a.goals) || 0
    t.assists += Number(a.assists) || 0
    const conceded = a.player_club_id === game.homeClub ? game.awayGoals : game.homeGoals
    if (conceded === 0 && (Number(a.minutes_played) || 0) >= CLEAN_SHEET_MIN_MINUTES) t.cleanSheets++
    this.totals.set(a.player_id, t)
  }

  /** Keyed by our player id. Players with no appearances are omitted. */
  result(playerIds: string[]): Record<string, PlayerStats> {
    const out: Record<string, PlayerStats> = {}
    for (const id of playerIds) {
      const tm = id.split('-').pop() as string
      const t = this.totals.get(tm)
      if (!t) continue
      const kind = statKindForPosition(this.players.get(tm) ?? '')
      out[id] = kind === 'goalkeeper'
        ? { season: seasonLabel(this.season), kind, games: t.games, cleanSheets: t.cleanSheets }
        : { season: seasonLabel(this.season), kind, games: t.games, goals: t.goals, assists: t.assists }
    }
    return out
  }
}

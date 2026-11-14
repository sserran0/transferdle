import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { StatsBuilder, csvRows, parseCsvLine, seasonLabel, statKindForPosition } from './stats.ts'

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

async function* toLines(text: string) { for (const l of text.split('\n')) yield l }

describe('csv helpers', () => {
  it('parses quoted fields, escaped quotes and empty cells', () => {
    expect(parseCsvLine('a,"b, ""c""",,d')).toEqual(['a', 'b, "c"', '', 'd'])
  })
  it('streams rows and joins lines that continue inside quotes', async () => {
    const rows = []
    for await (const r of csvRows(toLines('id,name\n1,"multi\nline"\n2,plain'))) rows.push(r)
    expect(rows).toEqual([{ id: '1', name: 'multi\nline' }, { id: '2', name: 'plain' }])
  })
})

describe('positions decide the stat kind', () => {
  it('treats only goalkeepers differently', () => {
    expect(statKindForPosition('Goalkeeper')).toBe('goalkeeper')
    for (const p of ['Centre-Back', 'Left-Back', 'Defensive Midfield', 'Winger', 'Striker']) expect(statKindForPosition(p)).toBe('outfield')
  })
  it('labels seasons', () => {
    expect(seasonLabel(2025)).toBe('2025/26')
    expect(seasonLabel(1999)).toBe('1999/00')
  })
})

describe('StatsBuilder', () => {
  const game = (id: string, o: Record<string, string> = {}) => ({
    game_id: id, season: '2025', competition_type: 'domestic_league', home_club_id: '10', home_club_goals: '2', away_club_goals: '0', ...o,
  })
  const app = (gameId: string, playerId: string, o: Record<string, string> = {}) => ({
    game_id: gameId, player_id: playerId, player_club_id: '10', goals: '0', assists: '0', minutes_played: '90', ...o,
  })
  const pool = [{ id: 'striker-1', position: 'Striker' }, { id: 'keeper-2', position: 'Goalkeeper' }]

  it('sums goals, assists and games for outfield players, and ignores other seasons and national teams', () => {
    const b = new StatsBuilder(pool, [
      game('g1'), game('g2'), game('g3', { season: '2024' }), game('g4', { competition_type: 'national_team_competition' }),
    ], 2025)
    b.add(app('g1', '1', { goals: '2', assists: '1' }))
    b.add(app('g2', '1', { goals: '1' }))
    b.add(app('g3', '1', { goals: '9' })) // wrong season
    b.add(app('g4', '1', { goals: '9' })) // national team
    b.add(app('g1', '999', { goals: '9' })) // not in the pool
    expect(b.result(['striker-1', 'keeper-2'])).toEqual({
      'striker-1': { season: '2025/26', kind: 'outfield', games: 2, goals: 3, assists: 1 },
    })
  })

  it('gives goalkeepers clean sheets, not goals and assists', () => {
    const b = new StatsBuilder(pool, [
      game('home-shutout'),                                   // home team 2-0: home keeper clean sheet
      game('home-conceded', { away_club_goals: '1' }),         // conceded 1
      game('away-shutout', { home_club_id: '99', home_club_goals: '0', away_club_goals: '3' }), // keeper is the away side, home scored 0
      game('short-cameo'),                                    // shutout but under 60 minutes
    ], 2025)
    b.add(app('home-shutout', '2'))
    b.add(app('home-conceded', '2'))
    b.add(app('away-shutout', '2'))
    b.add(app('short-cameo', '2', { minutes_played: '30' }))
    const gk = b.result(['keeper-2'])['keeper-2']
    expect(gk).toEqual({ season: '2025/26', kind: 'goalkeeper', games: 4, cleanSheets: 2 })
    expect(gk).not.toHaveProperty('goals')
  })
})

describe('generated stats.json', () => {
  const stats = read('../src/data/stats.json') as Record<string, { kind: string; games: number; goals?: number; assists?: number; cleanSheets?: number; season: string }>
  const players = read('../src/data/players.json') as { id: string; position: string }[]
  const position = new Map(players.map((p) => [p.id, p.position]))

  it('only covers real players, and the stat kind matches their position', () => {
    expect(Object.keys(stats).length).toBeGreaterThan(500)
    for (const [id, s] of Object.entries(stats)) {
      expect(position.has(id), id).toBe(true)
      expect(s.kind, id).toBe(statKindForPosition(position.get(id)!))
      expect(s.games).toBeGreaterThan(0)
    }
  })
  it('has the right fields for each kind and sane values', () => {
    for (const [id, s] of Object.entries(stats)) {
      if (s.kind === 'goalkeeper') {
        expect(s.cleanSheets, id).toBeLessThanOrEqual(s.games)
        expect(s).not.toHaveProperty('goals')
      } else {
        expect(s.goals, id).toBeGreaterThanOrEqual(0)
        expect(s.assists, id).toBeGreaterThanOrEqual(0)
        expect(s).not.toHaveProperty('cleanSheets')
      }
    }
  })
})

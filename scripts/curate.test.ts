import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { curate, parseCsv, tierForRank, type PoolPlayer } from './curate.ts'
import { flagFor } from './flags.ts'

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and newlines', () => {
    const rows = parseCsv('a,b\r\n"x, ""y""",2\n"multi\nline",\n')
    expect(rows).toEqual([{ a: 'x, "y"', b: '2' }, { a: 'multi\nline', b: '' }])
  })
})

describe('curate', () => {
  const comps = parseCsv('competition_id,country_name\nGB1,England\nES1,Spain\n')
  const row = (o: Record<string, string>) => ({
    player_id: '1', player_code: 'p', name: 'P', last_season: '2025', current_club_domestic_competition_id: 'GB1',
    current_club_name: 'C', country_of_citizenship: 'Norway', sub_position: 'Centre-Forward', position: 'Attack', date_of_birth: '2000-07-21 00:00:00',
    market_value_in_eur: '50000000', highest_market_value_in_eur: '60000000', ...o,
  })
  it('keeps only current-season, in-league, valued players, ranked by value', () => {
    const out = curate([
      row({ player_id: '1', name: 'Top', market_value_in_eur: '90000000' }),
      row({ player_id: '2', name: 'Retired', last_season: '2019' }),
      row({ player_id: '3', name: 'WrongLeague', current_club_domestic_competition_id: 'TR1' }),
      row({ player_id: '4', name: 'Cheap', market_value_in_eur: '200000' }),
      row({ player_id: '5', name: 'Second', market_value_in_eur: '40000000' }),
      row({ player_id: '6', name: 'NoBirthDate', date_of_birth: '' }),
    ], comps)
    expect(out.map((p) => p.name)).toEqual(['Top', 'Second'])
    expect(out[0]).toMatchObject({ position: 'Striker', valueM: 90, league: 'Premier League', leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', dateOfBirth: '2000-07-21', nationalityFlag: '🇳🇴' })
  })
  it('fails loudly on a country without a flag mapping', () => {
    expect(() => curate([row({ country_of_citizenship: 'Atlantis' })], comps)).toThrow(/Atlantis/)
  })
  it('splits tiers by rank', () => {
    expect([0, 24, 25, 64, 65, 99].map((r) => tierForRank(r, 100))).toEqual(['easy', 'easy', 'medium', 'medium', 'hard', 'hard'])
  })
  it('builds flags', () => {
    expect(flagFor('Spain')).toBe('🇪🇸')
    expect(flagFor('Narnia')).toBeNull()
  })
})

const PLAYERS: PoolPlayer[] = JSON.parse(readFileSync(new URL('../src/data/players.json', import.meta.url), 'utf8'))

describe('generated players.json', () => {
  it('has a usable shape and unique ids', () => {
    expect(PLAYERS.length).toBeGreaterThan(500)
    expect(new Set(PLAYERS.map((p) => p.id)).size).toBe(PLAYERS.length)
    for (const p of PLAYERS) {
      expect(p.valueM).toBeGreaterThan(0)
      expect(['easy', 'medium', 'hard']).toContain(p.tier)
      expect(p.name && p.club && p.nationalityFlag && p.leagueFlag && p.league).toBeTruthy()
      expect(p.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

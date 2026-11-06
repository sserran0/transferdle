import type { Player } from '../types'

// v0 sample data. Values are approximate placeholders, NOT live Transfermarkt data.
// v3 replaces this with a generated pool from the transfermarkt-datasets dump.
export const PLAYERS: Player[] = [
  { id: 'haaland', name: 'Erling Haaland', position: 'Striker', nationality: 'Norway', nationalityFlag: '🇳🇴', club: 'Manchester City', clubCountry: 'England', clubCountryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', valueM: 180 },
  { id: 'mbappe', name: 'Kylian Mbappé', position: 'Striker', nationality: 'France', nationalityFlag: '🇫🇷', club: 'Real Madrid', clubCountry: 'Spain', clubCountryFlag: '🇪🇸', valueM: 180 },
  { id: 'bellingham', name: 'Jude Bellingham', position: 'Midfielder', nationality: 'England', nationalityFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Real Madrid', clubCountry: 'Spain', clubCountryFlag: '🇪🇸', valueM: 160 },
  { id: 'yamal', name: 'Lamine Yamal', position: 'Winger', nationality: 'Spain', nationalityFlag: '🇪🇸', club: 'Barcelona', clubCountry: 'Spain', clubCountryFlag: '🇪🇸', valueM: 180 },
  { id: 'saka', name: 'Bukayo Saka', position: 'Winger', nationality: 'England', nationalityFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Arsenal', clubCountry: 'England', clubCountryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', valueM: 130 },
  { id: 'rodri', name: 'Rodri', position: 'Defensive Midfield', nationality: 'Spain', nationalityFlag: '🇪🇸', club: 'Manchester City', clubCountry: 'England', clubCountryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', valueM: 110 },
  { id: 'musiala', name: 'Jamal Musiala', position: 'Attacking Midfield', nationality: 'Germany', nationalityFlag: '🇩🇪', club: 'Bayern Munich', clubCountry: 'Germany', clubCountryFlag: '🇩🇪', valueM: 120 },
  { id: 'salah', name: 'Mohamed Salah', position: 'Winger', nationality: 'Egypt', nationalityFlag: '🇪🇬', club: 'Liverpool', clubCountry: 'England', clubCountryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', valueM: 55 },
  { id: 'vandijk', name: 'Virgil van Dijk', position: 'Centre-Back', nationality: 'Netherlands', nationalityFlag: '🇳🇱', club: 'Liverpool', clubCountry: 'England', clubCountryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', valueM: 25 },
  { id: 'modric', name: 'Luka Modrić', position: 'Central Midfield', nationality: 'Croatia', nationalityFlag: '🇭🇷', club: 'AC Milan', clubCountry: 'Italy', clubCountryFlag: '🇮🇹', valueM: 4 },
  { id: 'neuer', name: 'Manuel Neuer', position: 'Goalkeeper', nationality: 'Germany', nationalityFlag: '🇩🇪', club: 'Bayern Munich', clubCountry: 'Germany', clubCountryFlag: '🇩🇪', valueM: 4 },
  { id: 'lewandowski', name: 'Robert Lewandowski', position: 'Striker', nationality: 'Poland', nationalityFlag: '🇵🇱', club: 'Barcelona', clubCountry: 'Spain', clubCountryFlag: '🇪🇸', valueM: 15 },
]

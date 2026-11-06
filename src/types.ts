export interface Player {
  id: string
  name: string
  position: string
  nationality: string
  nationalityFlag: string
  club: string
  clubCountry: string
  clubCountryFlag: string
  /** Transfermarkt market value in EUR millions (placeholder values in v0) */
  valueM: number
}

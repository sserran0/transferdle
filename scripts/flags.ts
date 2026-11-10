// Transfermarkt country name -> ISO 3166-1 alpha-2, for flag emoji.
const ISO: Record<string, string> = {
  Albania: 'AL', Algeria: 'DZ', Andorra: 'AD', Angola: 'AO', Argentina: 'AR', Armenia: 'AM',
  Australia: 'AU', Austria: 'AT', Azerbaijan: 'AZ', Bangladesh: 'BD', Belarus: 'BY', Belgium: 'BE',
  Benin: 'BJ', 'Bosnia-Herzegovina': 'BA', Brazil: 'BR', Bulgaria: 'BG', 'Burkina Faso': 'BF',
  Burundi: 'BI', Cameroon: 'CM', Canada: 'CA', 'Cape Verde': 'CV', 'Central African Republic': 'CF',
  Chile: 'CL', Colombia: 'CO', Comoros: 'KM', 'Costa Rica': 'CR', "Cote d'Ivoire": 'CI',
  Croatia: 'HR', Curacao: 'CW', Cyprus: 'CY', 'Czech Republic': 'CZ', 'DR Congo': 'CD',
  Denmark: 'DK', 'Dominican Republic': 'DO', Ecuador: 'EC', Egypt: 'EG', 'Equatorial Guinea': 'GQ',
  Estonia: 'EE', Finland: 'FI', France: 'FR', 'French Guiana': 'GF', Gabon: 'GA', Georgia: 'GE',
  Germany: 'DE', Ghana: 'GH', Greece: 'GR', Guadeloupe: 'GP', Guinea: 'GN', 'Guinea-Bissau': 'GW',
  Haiti: 'HT', Honduras: 'HN', Hungary: 'HU', Iceland: 'IS', Indonesia: 'ID', Iraq: 'IQ',
  Ireland: 'IE', Israel: 'IL', Italy: 'IT', Jamaica: 'JM', Japan: 'JP', Jordan: 'JO',
  'Korea, South': 'KR', Kosovo: 'XK', Latvia: 'LV', Lebanon: 'LB', Libya: 'LY', Lithuania: 'LT',
  Luxembourg: 'LU', Madagascar: 'MG', Malaysia: 'MY', Mali: 'ML', Malta: 'MT', Mauritania: 'MR',
  Mexico: 'MX', Moldova: 'MD', Montenegro: 'ME', Morocco: 'MA', Mozambique: 'MZ',
  Netherlands: 'NL', 'New Zealand': 'NZ', Niger: 'NE', Nigeria: 'NG', 'North Macedonia': 'MK',
  Norway: 'NO', Panama: 'PA', Paraguay: 'PY', Peru: 'PE', Philippines: 'PH', Poland: 'PL',
  Portugal: 'PT', 'Puerto Rico': 'PR', Romania: 'RO', Russia: 'RU', Rwanda: 'RW',
  'Saudi Arabia': 'SA', Senegal: 'SN', Serbia: 'RS', 'Sierra Leone': 'SL', Slovakia: 'SK',
  Slovenia: 'SI', 'South Africa': 'ZA', Spain: 'ES', Suriname: 'SR', Sweden: 'SE',
  Switzerland: 'CH', Syria: 'SY', Tanzania: 'TZ', 'The Gambia': 'GM', Togo: 'TG',
  'Trinidad and Tobago': 'TT', Tunisia: 'TN', 'Türkiye': 'TR', Ukraine: 'UA',
  'United States': 'US', Uruguay: 'UY', Uzbekistan: 'UZ', Venezuela: 'VE', Zambia: 'ZM',
  Zimbabwe: 'ZW',
}

// UK home nations use subdivision "tag sequence" flags.
const tagFlag = (sub: string) =>
  String.fromCodePoint(0x1f3f4, ...[...sub].map((c) => 0xe0000 + c.charCodeAt(0)), 0xe007f)
const SPECIAL: Record<string, string> = {
  England: tagFlag('gbeng'),
  Scotland: tagFlag('gbsct'),
  Wales: tagFlag('gbwls'),
  'Northern Ireland': '🇬🇧', // no dedicated emoji flag
}

/** Display names that differ from Transfermarkt's. */
const DISPLAY: Record<string, string> = {
  'Korea, South': 'South Korea',
  "Cote d'Ivoire": 'Ivory Coast',
  Curacao: 'Curaçao',
}
export const displayCountry = (name: string) => DISPLAY[name] ?? name

/** Flag emoji for a country name, or null if unmapped. */
export function flagFor(country: string): string | null {
  if (SPECIAL[country]) return SPECIAL[country]
  const code = ISO[country]
  return code ? [...code].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('') : null
}

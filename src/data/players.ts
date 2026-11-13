import type { Player, PlayerStats } from '../types'
import raw from './players.json'
import images from './images.json'
import stats from './stats.json'

type ImageFields = Pick<Player, 'imageUrl' | 'imageCredit' | 'imagePageUrl'>
const IMAGES = images as Record<string, ImageFields>
const STATS = stats as Record<string, PlayerStats>

// players.json: `npm run data`. images.json: `npm run images`. stats.json: `npm run stats`. Do not edit by hand.
export const PLAYERS: Player[] = (raw as Player[]).map((p) => ({ ...p, ...IMAGES[p.id], stats: STATS[p.id] }))

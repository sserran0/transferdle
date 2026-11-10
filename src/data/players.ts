import type { Player } from '../types'
import raw from './players.json'
import images from './images.json'

type ImageFields = Pick<Player, 'imageUrl' | 'imageCredit' | 'imagePageUrl'>
const IMAGES = images as Record<string, ImageFields>

// players.json: `npm run data`. images.json: `npm run images`. Do not edit by hand.
export const PLAYERS: Player[] = (raw as Player[]).map((p) => ({ ...p, ...IMAGES[p.id] }))

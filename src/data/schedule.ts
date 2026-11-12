import type { Player } from '../types'
import type { ScheduleEntry } from '../lib/schedule'
import raw from './schedule.json'
import images from './images.json'

type ImageFields = Pick<Player, 'imageUrl' | 'imageCredit' | 'imagePageUrl'>
const IMAGES = images as Record<string, ImageFields>
const BY_DATE = new Map((raw as ScheduleEntry[]).map((e) => [e.date, e.player]))

/** The frozen puzzle for `date`, or undefined if that day isn't scheduled. `npm run schedule` to extend. */
export function scheduledPlayer(date: string): Player | undefined {
  const p = BY_DATE.get(date)
  return p && { ...p, ...IMAGES[p.id] }
}

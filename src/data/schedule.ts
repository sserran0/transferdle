import type { Player, PlayerStats } from '../types'
import type { ScheduleEntry } from '../lib/schedule'
import raw from './schedule.json'
import images from './images.json'
import stats from './stats.json'

type ImageFields = Pick<Player, 'imageUrl' | 'imageCredit' | 'imagePageUrl'>
const IMAGES = images as Record<string, ImageFields>
const STATS = stats as Record<string, PlayerStats>
const BY_DATE = new Map((raw as ScheduleEntry[]).map((e) => [e.date, e.player]))

/**
 * The frozen puzzle for `date`, or undefined if that day isn't scheduled. `npm run schedule` to extend.
 * Photos and stats are display-only extras, merged in live: they never change which player or value is scheduled.
 */
export function scheduledPlayer(date: string): Player | undefined {
  const p = BY_DATE.get(date)
  return p && { ...p, ...IMAGES[p.id], stats: STATS[p.id] }
}

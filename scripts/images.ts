// Pure helpers for the Wikimedia Commons image lookup (no network here).

export interface ImageEntry {
  imageUrl: string
  /** Human-readable credit, e.g. "Jane Doe, CC BY-SA 4.0". */
  imageCredit: string
  /** Commons file page: where the licence and author are verifiable. */
  imagePageUrl: string
}

/** Transfermarkt player id is the numeric suffix of our id. */
export const tmIdFromPlayerId = (id: string) => id.split('-').pop() ?? id

/** "http://commons.wikimedia.org/wiki/Special:FilePath/A%20b.jpg" -> "A b.jpg" */
export function filenameFromFilePath(url: string): string | null {
  const m = url.match(/Special:FilePath\/(.+)$/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1]).replace(/_/g, ' ')
  } catch {
    return null
  }
}

/**
 * Only free licences that allow reuse with attribution: CC0, public domain,
 * CC BY and CC BY-SA. Rejects NC/ND variants, GFDL-only, fair use and unknowns.
 */
export function isAllowedLicense(shortName: string | undefined): boolean {
  if (!shortName) return false
  const s = shortName.trim()
  if (/\b(NC|ND)\b/i.test(s)) return false
  return /^(CC0\b|Public domain|PD\b|CC[ -]BY(-SA)?[ -]\d)/i.test(s)
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, ' ')
    .trim()
}

export interface CommonsInfo {
  thumburl?: string
  descriptionurl?: string
  extmetadata?: Record<string, { value?: string }>
}

/** Turn Commons imageinfo into a credited entry, or null if unusable/unlicensed. */
export function entryFromCommons(info: CommonsInfo): ImageEntry | null {
  const meta = info.extmetadata ?? {}
  const license = meta.LicenseShortName?.value
  if (!info.thumburl || !info.descriptionurl || !isAllowedLicense(license)) return null
  const artist = stripHtml(meta.Artist?.value ?? '')
  const author = artist.length > 60 ? `${artist.slice(0, 57)}...` : artist || 'Wikimedia Commons'
  return {
    // Drop tracking params; keep the plain thumbnail URL.
    imageUrl: info.thumburl.split('?')[0],
    imageCredit: `${author}, ${license}`,
    imagePageUrl: info.descriptionurl,
  }
}

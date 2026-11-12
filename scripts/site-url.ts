/** Where the game lives. Used for absolute URLs in the share-preview meta tags. */
export const PRODUCTION_URL = 'https://transferdle.vercel.app'

/**
 * Production (and any local build) uses the production URL. Vercel *preview*
 * builds use their own URL instead, so the preview's og:image points at the
 * image that deploy actually serves; otherwise it would 404 until merged.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const base = env.VERCEL_ENV === 'preview' && env.VERCEL_URL ? `https://${env.VERCEL_URL}` : PRODUCTION_URL
  return base.replace(/\/+$/, '')
}

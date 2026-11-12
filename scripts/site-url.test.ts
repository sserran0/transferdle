import { describe, expect, it } from 'vitest'
import { PRODUCTION_URL, siteUrl } from './site-url.ts'

describe('siteUrl', () => {
  it('defaults to production for local and production builds', () => {
    expect(siteUrl({})).toBe(PRODUCTION_URL)
    expect(siteUrl({ VERCEL_ENV: 'production', VERCEL_URL: 'transferdle-abc.vercel.app' })).toBe(PRODUCTION_URL)
  })
  it('uses the deployment URL for Vercel previews', () => {
    expect(siteUrl({ VERCEL_ENV: 'preview', VERCEL_URL: 'transferdle-git-v7-sserran0.vercel.app' }))
      .toBe('https://transferdle-git-v7-sserran0.vercel.app')
  })
  it('falls back to production if a preview has no URL', () => {
    expect(siteUrl({ VERCEL_ENV: 'preview' })).toBe(PRODUCTION_URL)
  })
})

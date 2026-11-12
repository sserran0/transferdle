import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const config = JSON.parse(read('../vercel.json')) as { headers: { source: string; headers: { key: string; value: string }[] }[] }

// Report-only first; once production is clean it is renamed to Content-Security-Policy.
const header = config.headers
  .find((h) => h.source === '/(.*)')
  ?.headers.find((h) => /^Content-Security-Policy(-Report-Only)?$/.test(h.key))

const directive = (name: string) =>
  header?.value.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))?.split(/\s+/).slice(1) ?? []

describe('Content-Security-Policy in vercel.json', () => {
  it('is present on every route', () => {
    expect(header).toBeDefined()
  })

  it('allows every host that player photos are loaded from', () => {
    const images = JSON.parse(read('../src/data/images.json')) as Record<string, { imageUrl: string }>
    const hosts = new Set(Object.values(images).map((i) => new URL(i.imageUrl).origin))
    expect(hosts.size).toBeGreaterThan(0)
    for (const origin of hosts) expect(directive('img-src'), origin).toContain(origin)
  })

  it('stays locked down: nothing inline or eval-able, no plugins, no framing', () => {
    expect(header?.value).not.toMatch(/unsafe-inline|unsafe-eval|\*(?!\.)/)
    expect(directive('script-src')).toEqual(["'self'"])
    expect(directive('object-src')).toEqual(["'none'"])
    expect(directive('frame-ancestors')).toEqual(["'none'"])
  })
})

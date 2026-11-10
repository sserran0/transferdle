// Usage: npm run images
// Looks up openly licensed photos on Wikimedia Commons for each player in
// src/data/players.json (via Wikidata: Transfermarkt ID P2446 -> image P18) and
// writes src/data/images.json. Players without a free photo are simply omitted
// and keep the initials avatar. Run on demand; the app never calls these APIs.
import { readFileSync, writeFileSync } from 'node:fs'
import { entryFromCommons, filenameFromFilePath, tmIdFromPlayerId, type CommonsInfo, type ImageEntry } from './images.ts'

const UA = 'transferdle-build/0.1 (https://github.com/sserran0/transferdle)'
const PLAYERS = new URL('../src/data/players.json', import.meta.url)
const OUT = new URL('../src/data/images.json', import.meta.url)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const chunk = <T>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))

async function wikidataFiles(tmIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>() // tm id -> Commons file name
  for (const ids of chunk(tmIds, 150)) {
    const query = `SELECT ?tm ?img WHERE { VALUES ?tm { ${ids.map((i) => `"${i}"`).join(' ')} } ?item wdt:P2446 ?tm . ?item wdt:P18 ?img }`
    const res = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ query }),
    })
    if (!res.ok) throw new Error(`Wikidata ${res.status}: ${await res.text()}`)
    const json = (await res.json()) as { results: { bindings: { tm: { value: string }; img: { value: string } }[] } }
    for (const b of json.results.bindings) {
      const file = filenameFromFilePath(b.img.value)
      if (file && !out.has(b.tm.value)) out.set(b.tm.value, file)
    }
    await sleep(1000)
  }
  return out
}

async function commonsInfo(files: string[]): Promise<Map<string, CommonsInfo>> {
  const out = new Map<string, CommonsInfo>()
  for (const batch of chunk(files, 40)) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
      iiprop: 'url|extmetadata', iiurlwidth: '400',
      titles: batch.map((f) => `File:${f}`).join('|'),
    })
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`Commons ${res.status}`)
    const json = (await res.json()) as { query?: { pages?: { title: string; imageinfo?: CommonsInfo[] }[] } }
    for (const p of json.query?.pages ?? []) {
      if (p.imageinfo?.[0]) out.set(p.title.replace(/^File:/, '').replace(/_/g, ' '), p.imageinfo[0])
    }
    await sleep(500)
  }
  return out
}

const players = JSON.parse(readFileSync(PLAYERS, 'utf8')) as { id: string }[]
const files = await wikidataFiles(players.map((p) => tmIdFromPlayerId(p.id)))
const info = await commonsInfo([...new Set(files.values())])

const entries: Record<string, ImageEntry> = {}
let unlicensed = 0
for (const p of [...players].sort((a, b) => a.id.localeCompare(b.id))) {
  const file = files.get(tmIdFromPlayerId(p.id))
  const i = file && info.get(file)
  if (!i) continue
  const entry = entryFromCommons(i)
  if (entry) entries[p.id] = entry
  else unlicensed++
}

writeFileSync(OUT, `${JSON.stringify(entries, null, 1)}\n`)
console.log(`${Object.keys(entries).length}/${players.length} players have a free photo ` +
  `(${files.size} had a Commons image; ${unlicensed} rejected for licence).`)

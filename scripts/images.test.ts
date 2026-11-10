import { describe, expect, it } from 'vitest'
import { entryFromCommons, filenameFromFilePath, isAllowedLicense, stripHtml, tmIdFromPlayerId } from './images.ts'

describe('image helpers', () => {
  it('extracts the file name from a Wikidata FilePath URL', () => {
    expect(filenameFromFilePath('http://commons.wikimedia.org/wiki/Special:FilePath/Erling%20Haaland_2023.jpg')).toBe('Erling Haaland 2023.jpg')
    expect(filenameFromFilePath('http://example.com/x.jpg')).toBeNull()
  })
  it('only allows free, attribution-compatible licences', () => {
    for (const ok of ['CC0', 'Public domain', 'PD-USGov', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 3.0 at', 'CC-BY-SA-4.0']) expect(isAllowedLicense(ok), ok).toBe(true)
    for (const no of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'GFDL', 'Fair use', '', undefined]) expect(isAllowedLicense(no), String(no)).toBe(false)
  })
  it('strips html and entities from the author', () => {
    expect(stripHtml('<a href="x">Jane &amp; Co</a>\n <b>Doe</b>')).toBe('Jane & Co Doe')
  })
  it('builds a credited entry and rejects bad licences', () => {
    const base = { thumburl: 'https://t.org/a.jpg?utm=1', descriptionurl: 'https://c.org/File:A.jpg' }
    expect(entryFromCommons({ ...base, extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: '<a>Jane</a>' } } }))
      .toEqual({ imageUrl: 'https://t.org/a.jpg', imageCredit: 'Jane, CC BY-SA 4.0', imagePageUrl: 'https://c.org/File:A.jpg' })
    expect(entryFromCommons({ ...base, extmetadata: { LicenseShortName: { value: 'CC BY-NC 4.0' } } })).toBeNull()
    expect(entryFromCommons({ extmetadata: { LicenseShortName: { value: 'CC0' } } })).toBeNull()
  })
  it('reads the Transfermarkt id from a player id', () => {
    expect(tmIdFromPlayerId('erling-haaland-418560')).toBe('418560')
    expect(tmIdFromPlayerId('418560')).toBe('418560')
  })
})

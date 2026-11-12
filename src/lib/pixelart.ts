/**
 * Pixel-art sprites as character grids. Drawn as inline SVG rather than font glyphs
 * or emoji, which look different (or turn into coloured emoji) on every device.
 */
export type Pixmap = readonly string[]

/** '#' is a filled pixel, '.' is empty. */
export const ARROW_UP: Pixmap = [
  '....#....',
  '...###...',
  '..#####..',
  '.#######.',
  '#########',
  '...###...',
  '...###...',
  '...###...',
  '...###...',
]
export const ARROW_DOWN: Pixmap = [...ARROW_UP].reverse()

/** Fills the pixel to the right of every filled pixel, making diagonal strokes bolder. */
const thickenRight = (map: Pixmap): Pixmap =>
  map.map((row) => [...row, '.'].map((c, x, a) => (c === '#' || a[x - 1] === '#' ? '#' : '.')).join(''))

export const CHECK: Pixmap = thickenRight([
  '.........##',
  '........###',
  '##.....###.',
  '###...###..',
  '.###.###...',
  '..#####....',
  '...###.....',
  '....#......',
])

/**
 * Attempt block, a bevelled tile with chamfered corners:
 * '#' ink outline, 'o' base colour, 'l' light edge, 'd' shade edge.
 */
export const BLOCK: Pixmap = [
  '.############.',
  '##llllllllll##',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '#looooooooood#',
  '##dddddddddd##',
  '.############.',
]

export const pixmapSize = (map: Pixmap) => ({ w: map[0].length, h: map.length })

/** SVG path data covering every pixel whose character is in `chars`, one rectangle per horizontal run. */
export function pixelPath(map: Pixmap, chars = '#'): string {
  const parts: string[] = []
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!chars.includes(row[x])) continue
      let len = 1
      while (x + len < row.length && chars.includes(row[x + len])) len++
      parts.push(`M${x} ${y}h${len}v1h-${len}z`)
      x += len - 1
    }
  })
  return parts.join('')
}

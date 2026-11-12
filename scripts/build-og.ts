// Usage: npm run og
// Regenerates public/og-image.png (1200x630), the link-preview card shown when the
// site is shared. The scene is drawn at 240x126 "game pixels" and scaled up exactly
// 5x with smoothing off, so every edge is a hard pixel. No network access needed.
import { writeFileSync } from 'node:fs'
import { GlobalFonts, createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas'
import { GRASS_A, GRASS_B, LINE, pitchGrid } from '../src/lib/pitch.ts'

const W = 240, H = 126, SCALE = 5 // 240x126 * 5 = 1200x630

// Mirrors src/index.css and src/components/PitchBackground.tsx.
const INK = '#14210f', PAPER = '#f6f1da', ACCENT = '#ffd23f'
const RED = '#ff6b5e', YELLOW = '#f7d44a', GREEN = '#3fbf4a'
const PITCH: Record<number, [number, number, number]> = {
  [GRASS_A]: [106, 184, 76], [GRASS_B]: [118, 194, 87], [LINE]: [244, 250, 232],
}

GlobalFonts.registerFromPath(
  new URL('../node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff', import.meta.url).pathname,
  'Press Start 2P',
)

const canvas = createCanvas(W, H)
const ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false
ctx.textBaseline = 'top'

// Pitch background, identical to the app's.
const img = ctx.createImageData(W, H)
pitchGrid(W, H).forEach((cell, i) => img.data.set([...PITCH[cell], 255], i * 4))
ctx.putImageData(img, 0, 0)

/** Text with a hard ink outline and block shadow, like the h1 wordmark. */
function outlined(text: string, x: number, y: number, fill: string, ring = 2, shadow = 3) {
  ctx.fillStyle = INK
  for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) ctx.fillText(text, x + dx, y + dy)
  ctx.fillText(text, x + shadow, y + shadow)
  for (let dx = 0; dx <= ring; dx++) ctx.fillText(text, x + shadow + dx, y + shadow + ring)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
}

/** 8-bit box: block shadow, ink border, paper fill, light/dark bevel. */
function box(c: SKRSContext2D, x: number, y: number, w: number, h: number) {
  c.fillStyle = INK; c.fillRect(x + 3, y + 3, w, h) // block shadow
  c.fillRect(x, y, w, h) // border
  c.fillStyle = PAPER; c.fillRect(x + 2, y + 2, w - 4, h - 4)
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(x + 2, y + 2, w - 4, 1); c.fillRect(x + 2, y + 2, 1, h - 4)
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 2, y + h - 3, w - 4, 1); c.fillRect(x + w - 3, y + 2, 1, h - 4)
}

// Wordmark: "Transfer" in accent yellow, "dle" in white (matches the page h1).
ctx.font = '16px "Press Start 2P"'
const wordW = ctx.measureText('Transferdle').width
const wx = Math.round((W - wordW) / 2), wy = 18
const split = ctx.measureText('Transfer').width
outlined('Transferdle', wx, wy, ACCENT)
ctx.fillStyle = '#fff'
ctx.fillText('dle', wx + Math.round(split), wy) // recolour the last letters on top of the outline

// Card with the pixel ball and the tagline.
const CX = 12, CY = 50, CW = 216, CH = 58
box(ctx, CX, CY, CW, CH)
const ball = await loadImage(new URL('../public/icon-512.png', import.meta.url).pathname)
ctx.drawImage(ball, 0, 0, 512, 512, CX + 16, CY + 13, 32, 32) // 16x16 art at exactly 2x

ctx.font = '8px "Press Start 2P"'
ctx.fillStyle = INK
const tx = CX + 16 + 32 + 8
ctx.fillText("Guess the player's", tx, CY + 10)
ctx.fillText('market value', tx, CY + 22)

// Guess-colour squares, echoing the share grid: red, yellow, green.
;[RED, YELLOW, GREEN].forEach((color, i) => {
  const x = tx + i * 12, y = CY + 36
  ctx.fillStyle = INK; ctx.fillRect(x, y, 10, 10)
  ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, 8, 8)
})

// Exact 5x nearest-neighbour upscale.
const out = createCanvas(W * SCALE, H * SCALE)
const octx = out.getContext('2d')
octx.imageSmoothingEnabled = false
octx.drawImage(canvas, 0, 0, W * SCALE, H * SCALE)
writeFileSync(new URL('../public/og-image.png', import.meta.url), out.toBuffer('image/png'))
console.log(`Wrote public/og-image.png (${W * SCALE}x${H * SCALE})`)

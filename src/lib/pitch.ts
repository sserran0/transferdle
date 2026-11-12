/** Cell values in the pixel pitch grid. */
export const GRASS_A = 0
export const GRASS_B = 1
export const LINE = 2

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

// Real pitch proportions (FIFA 105 x 68 m), as fractions of the pitch's length and width.
const PENALTY_DEPTH = 16.5 / 105
const PENALTY_WIDTH = 40.3 / 68
const GOAL_BOX_DEPTH = 5.5 / 105
const GOAL_BOX_WIDTH = 18.3 / 68
const PENALTY_SPOT = 11 / 105
const CIRCLE_RADIUS = 9.15 / 68

/**
 * A top-down football pitch as a cols x rows grid of cells (row-major).
 * The pitch is turned to suit the screen: on a landscape screen (laptops) the
 * goals are at the left and right and the halfway line is vertical; on a
 * portrait screen (phones) the goals are top and bottom. Every marking is sized
 * as a fraction of the pitch, so it fills the screen at any size. Pure so it can
 * be tested; the canvas component just paints it.
 */
export function pitchGrid(cols: number, rows: number): Uint8Array {
  if (cols <= rows) return portraitPitch(cols, rows)
  // Landscape: draw the portrait pitch for the rotated screen, then transpose.
  const p = portraitPitch(rows, cols)
  const grid = new Uint8Array(cols * rows)
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) grid[y * cols + x] = p[x * rows + y]
  return grid
}

/** Pitch with its length along the y axis (goals at top and bottom). */
function portraitPitch(w: number, h: number): Uint8Array {
  const grid = new Uint8Array(w * h)
  const stripe = 6 // mowing stripes run across the pitch, so they are rows here
  for (let y = 0; y < h; y++) {
    grid.fill(Math.floor(y / stripe) % 2 === 0 ? GRASS_A : GRASS_B, y * w, (y + 1) * w)
  }

  const plot = (x: number, y: number) => {
    if (x >= 0 && x < w && y >= 0 && y < h) grid[y * w + x] = LINE
  }
  const hLine = (x0: number, x1: number, y: number) => { for (let x = x0; x <= x1; x++) plot(x, y) }
  const vLine = (x: number, y0: number, y1: number) => { for (let y = y0; y <= y1; y++) plot(x, y) }
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    hLine(x0, x1, y0); hLine(x0, x1, y1); vLine(x0, y0, y1); vLine(x1, y0, y1)
  }
  // 3x3 so it is centred on a one-cell line (a 2x2 spot would sit off to one side).
  const spot = (x: number, y: number) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) plot(x + dx, y + dy) }

  const m = w < 24 || h < 24 ? 1 : 2 // margin around the pitch
  const left = m, right = w - 1 - m, top = m, bottom = h - 1 - m
  const pw = Math.max(1, right - left), ph = Math.max(1, bottom - top)
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)

  rect(left, top, right, bottom) // touchlines and goal lines
  hLine(left, right, cy) // halfway line

  // Penalty and goal boxes at each end, centred on the goal.
  const box = (width: number, depth: number) => {
    const x0 = Math.max(left, cx - Math.floor(width / 2))
    const x1 = Math.min(right, x0 + width)
    rect(x0, top, x1, top + depth)
    rect(x0, bottom - depth, x1, bottom)
  }
  box(Math.max(6, Math.round(pw * PENALTY_WIDTH)), Math.max(3, Math.round(ph * PENALTY_DEPTH)))
  box(Math.max(4, Math.round(pw * GOAL_BOX_WIDTH)), Math.max(2, Math.round(ph * GOAL_BOX_DEPTH)))
  if (ph >= 40) { // penalty spots, skipped when there is no room for them
    spot(cx, top + Math.round(ph * PENALTY_SPOT))
    spot(cx, bottom - Math.round(ph * PENALTY_SPOT))
  }

  // Centre circle (midpoint circle algorithm) and spot. Sized from the short
  // side so it stays a true circle.
  const r = clamp(Math.round(Math.min(pw, ph) * CIRCLE_RADIUS), 3, Math.max(3, Math.floor(ph / 2) - 1))
  let x = r, y = 0, err = 1 - r
  while (x >= y) {
    for (const [dx, dy] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) plot(cx + dx, cy + dy)
    y++
    if (err < 0) err += 2 * y + 1
    else { x--; err += 2 * (y - x) + 1 }
  }
  spot(cx, cy)

  return grid
}

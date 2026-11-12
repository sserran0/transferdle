/** Cell values in the pixel pitch grid. */
export const GRASS_A = 0
export const GRASS_B = 1
export const LINE = 2

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * A top-down football pitch as a cols x rows grid of cells (row-major):
 * mown stripes, touchlines, penalty boxes, the halfway line, centre circle and
 * centre spot. Pure so it can be tested; the canvas component just paints it.
 */
export function pitchGrid(cols: number, rows: number): Uint8Array {
  const grid = new Uint8Array(cols * rows)
  const stripe = 6
  for (let y = 0; y < rows; y++) {
    grid.fill(Math.floor(y / stripe) % 2 === 0 ? GRASS_A : GRASS_B, y * cols, (y + 1) * cols)
  }

  const plot = (x: number, y: number) => {
    if (x >= 0 && x < cols && y >= 0 && y < rows) grid[y * cols + x] = LINE
  }
  const hLine = (x0: number, x1: number, y: number) => { for (let x = x0; x <= x1; x++) plot(x, y) }
  const vLine = (x: number, y0: number, y1: number) => { for (let y = y0; y <= y1; y++) plot(x, y) }
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    hLine(x0, x1, y0); hLine(x0, x1, y1); vLine(x0, y0, y1); vLine(x1, y0, y1)
  }

  const m = cols < 24 || rows < 24 ? 1 : 2 // margin around the pitch
  const left = m, right = cols - 1 - m, top = m, bottom = rows - 1 - m
  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2)

  rect(left, top, right, bottom) // touchlines and goal lines
  hLine(left, right, cy) // halfway line

  // Penalty boxes at each end.
  const boxW = clamp(Math.round(cols * 0.5), 10, 36)
  const boxH = clamp(Math.round(rows * 0.12), 4, 12)
  const bx0 = Math.max(left, cx - Math.floor(boxW / 2)), bx1 = Math.min(right, bx0 + boxW)
  rect(bx0, top, bx1, top + boxH)
  rect(bx0, bottom - boxH, bx1, bottom)

  // Centre circle (midpoint circle algorithm) and spot.
  const r = clamp(Math.round(Math.min(cols, rows) * 0.18), 4, 12)
  let x = r, y = 0, err = 1 - r
  while (x >= y) {
    for (const [dx, dy] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) plot(cx + dx, cy + dy)
    y++
    if (err < 0) err += 2 * y + 1
    else { x--; err += 2 * (y - x) + 1 }
  }
  plot(cx, cy); plot(cx - 1, cy); plot(cx, cy - 1); plot(cx - 1, cy - 1)

  return grid
}

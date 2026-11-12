import { useEffect, useRef } from 'react'
import { GRASS_A, GRASS_B, LINE, pitchGrid } from '../lib/pitch'

/** CSS pixels per grid cell: the "pixel size" of the background. */
const CELL = 8
const COLORS: Record<number, [number, number, number]> = {
  [GRASS_A]: [106, 184, 76],
  [GRASS_B]: [118, 194, 87],
  [LINE]: [244, 250, 232],
}

/** Fixed, decorative pixel-art pitch drawn at low resolution and scaled up crisply. */
export function PitchBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let frame = 0
    let cols = 0, rows = 0
    const paint = () => {
      cols = Math.ceil(window.innerWidth / CELL)
      rows = Math.ceil(window.innerHeight / CELL)
      canvas.width = cols
      canvas.height = rows
      const grid = pitchGrid(cols, rows)
      const img = ctx.createImageData(cols, rows)
      grid.forEach((cell, i) => {
        const [r, g, b] = COLORS[cell]
        img.data.set([r, g, b, 255], i * 4)
      })
      ctx.putImageData(img, 0, 0)
    }
    const onResize = () => {
      // Phone browsers resize the viewport by ~100px as the address bar slides
      // in and out while scrolling. Ignore a height-only change that small so the
      // lines don't jump; a rotation or window resize still redraws.
      const sameWidth = Math.ceil(window.innerWidth / CELL) === cols
      if (sameWidth && Math.abs(Math.ceil(window.innerHeight / CELL) - rows) * CELL < 120) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={ref} className="pitch" aria-hidden="true" />
}

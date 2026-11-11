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
    const paint = () => {
      const cols = Math.ceil(window.innerWidth / CELL)
      const rows = Math.ceil(window.innerHeight / CELL)
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

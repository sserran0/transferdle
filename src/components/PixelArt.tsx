import type { Feedback } from '../lib/scoring'
import { ARROW_DOWN, ARROW_UP, BLOCK, CHECK, pixelPath, pixmapSize, type Pixmap } from '../lib/pixelart'

interface IconProps { scale?: number; className?: string }

/** One-colour sprite in the surrounding text colour. Crisp at any size or pixel density. */
function Sprite({ map, scale = 2, className }: IconProps & { map: Pixmap }) {
  const { w, h } = pixmapSize(map)
  return (
    <svg
      className={`pixel${className ? ` ${className}` : ''}`}
      width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false"
    >
      <path d={pixelPath(map)} />
    </svg>
  )
}

export const ArrowUp = (p: IconProps) => <Sprite map={ARROW_UP} {...p} />
export const ArrowDown = (p: IconProps) => <Sprite map={ARROW_DOWN} {...p} />
export const Check = (p: IconProps) => <Sprite map={CHECK} {...p} />

/** A coloured attempt block in the same shades as the guess boxes. */
export function AttemptBlock({ feedback, scale = 2 }: { feedback: Feedback; scale?: number }) {
  const { w, h } = pixmapSize(BLOCK)
  return (
    <svg
      className={`pixel blk blk-${feedback}`} width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges" aria-hidden="true" focusable="false"
    >
      <path className="blk-ink" d={pixelPath(BLOCK, '#')} />
      {/* Base colour under the whole tile so the light and shade edges are tints of it. */}
      <path className="blk-base" d={pixelPath(BLOCK, 'old')} />
      <path d={pixelPath(BLOCK, 'l')} fill="#fff" fillOpacity=".45" />
      <path d={pixelPath(BLOCK, 'd')} fill="#000" fillOpacity=".2" />
    </svg>
  )
}

/** One block per attempt, readable by screen readers as a list of colours. */
export function AttemptBlocks({ feedbacks }: { feedbacks: Feedback[] }) {
  return (
    <div className="blocks" role="img" aria-label={`Your guesses: ${feedbacks.join(', ')}`}>
      {feedbacks.map((f, i) => <AttemptBlock key={i} feedback={f} />)}
    </div>
  )
}

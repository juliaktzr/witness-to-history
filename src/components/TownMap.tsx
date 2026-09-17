import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isPlaceholder, type Figure, type MapPlace, type PlaceKind, type ScenarioMap } from '../content/types'
import { Avatar } from './Avatar'
import type { AvatarPrefs } from '../engine/avatarPrefs'

interface Props {
  map: ScenarioMap
  figures: Figure[]
  visited: string[]
  /** ID of the map place the student's character is standing at or walking to. */
  avatarPlace: string | null
  avatarPrefs: AvatarPrefs
  /** Called when the character finishes walking to a place. */
  onArrive?: (placeId: string) => void
  onOpenFigure: (figureId: string, placeId?: string) => void
}

const W = 100
const H = 62

/** Small deterministic pseudo-random so trees land in the same spots every render. */
function seeded(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/** Place y is a percent of the map's height; the SVG is H units tall. */
const sy = (yPercent: number) => (yPercent * H) / 100

function roadPath(places: MapPlace[]): string {
  if (places.length < 2) return ''
  const pts = [...places].sort((a, b) => a.x - b.x).map((p) => [p.x, sy(p.y) + 3] as const)
  const start = [Math.max(-2, pts[0][0] - 18), pts[0][1] + 4] as const
  const end = [Math.min(W + 2, pts[pts.length - 1][0] + 18), pts[pts.length - 1][1] - 4] as const
  const all = [start, ...pts, end]
  let d = `M ${all[0][0]} ${all[0][1]}`
  for (let i = 1; i < all.length; i++) {
    const [x0, y0] = all[i - 1]
    const [x1, y1] = all[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  return d
}

/** Generic little buildings. Deliberately simple, so nothing reads as a picture of a specific real place. */
function PlaceIcon({ kind }: { kind: PlaceKind }) {
  const wall = '#f3e9d6'
  const roof = '#7a2e0e'
  const line = '#3b2f1e'
  switch (kind) {
    case 'meeting_house':
    case 'church':
      return (
        <g>
          <rect x={-4} y={-3} width={8} height={5.5} fill={wall} stroke={line} strokeWidth={0.4} />
          <polygon points="-4.6,-3 0,-6.2 4.6,-3" fill={roof} stroke={line} strokeWidth={0.4} />
          <rect x={-0.9} y={-9.5} width={1.8} height={3.6} fill={wall} stroke={line} strokeWidth={0.4} />
          <polygon points="-1.2,-9.5 0,-11.5 1.2,-9.5" fill={roof} stroke={line} strokeWidth={0.4} />
          <rect x={-0.8} y={0} width={1.6} height={2.5} fill={line} />
        </g>
      )
    case 'shop':
    case 'tavern':
      return (
        <g>
          <rect x={-4} y={-3} width={8} height={5.5} fill={wall} stroke={line} strokeWidth={0.4} />
          <polygon points="-4.6,-3 0,-5.5 4.6,-3" fill={roof} stroke={line} strokeWidth={0.4} />
          <rect x={-4.2} y={-1.4} width={8.4} height={1.2} fill="#c9bfa9" stroke={line} strokeWidth={0.3} />
          {[-3, -1, 1, 3].map((x) => (
            <rect key={x} x={x - 0.5} y={-1.4} width={1} height={1.2} fill={roof} />
          ))}
          <rect x={-3} y={0.2} width={2} height={1.6} fill="#9ec5d8" stroke={line} strokeWidth={0.3} />
          <rect x={1} y={0.2} width={1.6} height={2.3} fill={line} />
        </g>
      )
    case 'farm':
      return (
        <g>
          <rect x={-4.5} y={-3} width={9} height={5.5} fill="#a5451d" stroke={line} strokeWidth={0.4} />
          <polygon points="-5,-3 -3.5,-5.5 3.5,-5.5 5,-3" fill={roof} stroke={line} strokeWidth={0.4} />
          <rect x={-1.2} y={-0.5} width={2.4} height={3} fill={wall} stroke={line} strokeWidth={0.3} />
          <line x1={-9} y1={2.2} x2={-5} y2={2.2} stroke={line} strokeWidth={0.4} />
          <line x1={5} y1={2.2} x2={9} y2={2.2} stroke={line} strokeWidth={0.4} />
          {[-8.5, -6.5, 6.5, 8.5].map((x) => (
            <line key={x} x1={x} y1={1} x2={x} y2={3} stroke={line} strokeWidth={0.4} />
          ))}
        </g>
      )
    case 'dock':
      return (
        <g>
          <ellipse cx={0} cy={2} rx={9} ry={2.6} fill="#9ec5d8" />
          <rect x={-5} y={-1.5} width={10} height={2.4} fill="#a5451d" stroke={line} strokeWidth={0.4} />
          {[-3, -1, 1, 3].map((x) => (
            <line key={x} x1={x} y1={-1.5} x2={x} y2={0.9} stroke={line} strokeWidth={0.3} />
          ))}
        </g>
      )
    case 'signpost':
      return (
        <g>
          <rect x={-0.5} y={-9} width={1} height={12} fill="#6b4a2a" stroke={line} strokeWidth={0.3} />
          <path d="M-0.5,-8.5 h6.5 l1.6,1.3 l-1.6,1.3 h-6.5 z" fill="#d9c2a0" stroke={line} strokeWidth={0.35} />
          <path d="M0.5,-5.2 h-6.5 l-1.6,1.3 l1.6,1.3 h6.5 z" fill="#d9c2a0" stroke={line} strokeWidth={0.35} />
          <circle cx={-3} cy={3} r={1} fill="#8b8b7a" />
          <circle cx={2.5} cy={3.4} r={0.7} fill="#8b8b7a" />
        </g>
      )
    case 'field':
      return (
        <g>
          <ellipse cx={0} cy={0} rx={9} ry={4} fill="#d9c98a" stroke="#a89a5a" strokeWidth={0.4} />
          {[-2, 0, 2].map((y) => (
            <line key={y} x1={-7} y1={y} x2={7} y2={y} stroke="#a89a5a" strokeWidth={0.4} />
          ))}
        </g>
      )
    case 'house':
    default:
      return (
        <g>
          <rect x={-3.5} y={-2.5} width={7} height={5} fill={wall} stroke={line} strokeWidth={0.4} />
          <polygon points="-4,-2.5 0,-5.5 4,-2.5" fill={roof} stroke={line} strokeWidth={0.4} />
          <rect x={-0.8} y={0.3} width={1.6} height={2.2} fill={line} />
        </g>
      )
  }
}

/**
 * Pins are HTML (fixed pixel size) over a map that scales with the screen, so
 * on narrow phones two pins can collide. After layout, measure them and nudge
 * later pins sideways until they no longer overlap. Re-runs on resize.
 */
function useNudgedPins(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null)
  const [dx, setDx] = useState<Record<string, number>>({})
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const measure = () => {
      const pins = [...root.querySelectorAll<HTMLElement>('.pin')]
      const host = root.getBoundingClientRect()
      const boxes = pins.map((el) => {
        const r = el.getBoundingClientRect()
        const prev = Number(el.dataset.dx ?? 0)
        return { id: el.dataset.figure!, l: r.left - prev, r: r.right - prev, t: r.top, b: r.bottom }
      })
      boxes.sort((a, b) => a.l - b.l)
      const next: Record<string, number> = {}
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i]
        let shift = 0
        let leftShift = 0
        for (let j = 0; j < i; j++) {
          const a = boxes[j]
          const vertical = a.t < b.b && b.t < a.b
          if (!vertical) continue
          const aLeft = a.l + (next[a.id] ?? 0)
          const aRight = a.r + (next[a.id] ?? 0)
          if (b.l + shift < aRight + 6 && b.r + shift > aLeft - 6) {
            shift = aRight + 6 - b.l
            leftShift = Math.min(leftShift, aLeft - 6 - b.r)
          }
        }
        const maxRight = host.right - 4 - b.r
        const maxLeft = host.left + 4 - b.l // negative or zero
        // Prefer moving right; if there is no room, move left instead.
        next[b.id] = shift <= maxRight ? shift : leftShift >= maxLeft ? leftShift : Math.max(0, maxRight)
      }
      setDx((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { ref, dx }
}

/** Walking speed: milliseconds per SVG unit of road, clamped to a comfortable range. */
const MS_PER_UNIT = 16
const MIN_WALK_MS = 450
const MAX_WALK_MS = 1600

/**
 * Keeps the character's position in map percent and walks it along the drawn
 * road whenever the target place changes. Reduced motion jumps instantly.
 */
function useWalker(
  places: MapPlace[],
  targetId: string | null,
  roadRef: React.RefObject<SVGPathElement | null>,
  onArrive?: (placeId: string) => void,
) {
  const findPlace = (id: string | null) => places.find((p) => p.id === id)
  /** Where the character stands for a place: on the road, just left of the doorstep. */
  const toPos = (p: MapPlace | undefined) => (p ? { x: Math.max(2, p.x - 3.5), y: ((sy(p.y) + 3) / H) * 100 } : null)
  const [pos, setPos] = useState(() => toPos(findPlace(targetId)))
  const [walking, setWalking] = useState(false)
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const lastId = useRef<string | null>(targetId)
  const onArriveRef = useRef(onArrive)
  onArriveRef.current = onArrive

  useEffect(() => {
    if (targetId === lastId.current) return
    const target = findPlace(targetId)
    const from = pos
    lastId.current = targetId
    if (!target) return
    const to = toPos(target)!
    const road = roadRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!from || !road || reduce) {
      setPos(to)
      onArriveRef.current?.(target.id)
      return
    }
    // Find the road lengths nearest to the start and end points, then walk between them.
    const total = road.getTotalLength()
    const nearest = (x: number, yPct: number) => {
      const y = (yPct / 100) * H
      let best = 0
      let bestD = Infinity
      for (let l = 0; l <= total; l += 0.5) {
        const pt = road.getPointAtLength(l)
        const d = Math.hypot(pt.x - x, pt.y - y)
        if (d < bestD) {
          bestD = d
          best = l
        }
      }
      return best
    }
    const l0 = nearest(from.x, from.y)
    const l1 = nearest(to.x, to.y)
    const duration = Math.min(MAX_WALK_MS, Math.max(MIN_WALK_MS, Math.abs(l1 - l0) * MS_PER_UNIT))
    setFacing(to.x >= from.x ? 'right' : 'left')
    setWalking(true)
    let raf = 0
    const start = performance.now()
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    let lastX = from.x
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const l = l0 + (l1 - l0) * ease(t)
      const pt = road.getPointAtLength(l)
      const next = { x: pt.x, y: (pt.y / H) * 100 }
      if (Math.abs(next.x - lastX) > 0.05) setFacing(next.x > lastX ? 'right' : 'left')
      lastX = next.x
      setPos(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setPos(to)
        setWalking(false)
        onArriveRef.current?.(target.id)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setWalking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId])

  return { pos, walking, facing }
}

export function TownMap({ map, figures, visited, avatarPlace, avatarPrefs, onArrive, onOpenFigure }: Props) {
  const places = map.places
  const { ref, dx } = useNudgedPins([places, figures, visited])
  const roadRef = useRef<SVGPathElement>(null)
  const { pos, walking, facing } = useWalker(places, avatarPlace, roadRef, onArrive)
  const rand = seeded(places.map((p) => p.id).join('|'))
  const trees: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < 26 && trees.length < 18; i++) {
    const x = 3 + rand() * (W - 6)
    const y = 4 + rand() * (H - 8)
    const clear = places.every((p) => Math.hypot(p.x - x, sy(p.y) - y) > 12)
    if (clear) trees.push({ x, y, r: 1.6 + rand() * 1.4 })
  }
  const here = walking ? undefined : places.find((p) => p.id === (avatarPlace ?? map.here))
  const byPlace = new Map<string, Figure[]>()
  for (const f of figures) if (f.place) byPlace.set(f.place, [...(byPlace.get(f.place) ?? []), f])

  return (
    <div className="town-map" ref={ref}>
      <svg className="town-map-art" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="tm-ground" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#c9d6a0" />
            <stop offset="100%" stopColor="#a9bd7c" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#tm-ground)" />
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx={(i * 37 + 11) % W} cy={(i * 23 + 9) % H} rx={14 + i * 3} ry={6 + i} fill="#b7c98b" opacity={0.7} />
        ))}
        <path d={roadPath(places)} fill="none" stroke="#8b6b45" strokeWidth={2.8} strokeLinecap="round" />
        <path ref={roadRef} d={roadPath(places)} fill="none" stroke="#d9c2a0" strokeWidth={1.8} strokeLinecap="round" />
        {trees.map((t, i) => (
          <g key={i}>
            <circle cx={t.x} cy={t.y} r={t.r} fill="#4f7a3a" />
            <circle cx={t.x - t.r * 0.4} cy={t.y - t.r * 0.35} r={t.r * 0.6} fill="#6a9a4c" />
          </g>
        ))}
        {places.map((p) => (
          <g key={p.id} transform={`translate(${p.x} ${sy(p.y)})`}>
            <ellipse cx={0} cy={3} rx={7} ry={1.6} fill="#000" opacity={0.12} />
            <PlaceIcon kind={p.kind} />
          </g>
        ))}
        {here && (
          <g transform={`translate(${here.x} ${sy(here.y) + 3})`}>
            <ellipse cx={0} cy={0} rx={9} ry={2.8} fill="none" stroke="#0b57d0" strokeWidth={0.6} strokeDasharray="1.5 1" />
          </g>
        )}
      </svg>

      {places.map((p) => (
        <span key={p.id} className="place-label" style={{ left: `clamp(3.4rem, ${p.x}%, calc(100% - 3.4rem))`, top: `min(${p.y + 6}%, calc(100% - 1.6rem))` }} aria-hidden="true">
          {isPlaceholder(p.label) ? 'Place name coming soon' : p.label}
          {here?.id === p.id && <span className="place-here"> You are here</span>}
        </span>
      ))}

      {pos && (
        <div
          className={`avatar-token ${walking ? 'is-walking' : ''} face-${facing}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          aria-hidden="true"
          data-walking={walking ? 'true' : 'false'}
        >
          <Avatar prefs={avatarPrefs} />
        </div>
      )}

      {places.map((p, placeIndex) =>
        (byPlace.get(p.id) ?? []).map((f, i) => {
          const done = visited.includes(f.id)
          const placeName = isPlaceholder(p.label) ? 'a place with no name yet' : p.label
          return (
            <button
              key={f.id}
              type="button"
              className={`pin ${done ? 'pin-done' : ''}`}
              data-figure={f.id}
              data-dx={dx[f.id] ?? 0}
              style={{
                left: `clamp(3rem, ${p.x + i * 9}%, calc(100% - 3rem))`,
                top: `max(${p.y - 19}%, 2.7rem)`,
                translate: `${dx[f.id] ?? 0}px 0`,
                ['--i' as string]: placeIndex + i,
              }}
              aria-label={`Talk to ${f.name} at ${placeName}${done ? ' (already talked)' : ''}`}
              onClick={() => onOpenFigure(f.id, p.id)}
            >
              <span className="pin-name" aria-hidden="true">
                {f.name}
                {done && ' ✓'}
              </span>
              <span className="pin-tail" aria-hidden="true" />
            </button>
          )
        }),
      )}
    </div>
  )
}

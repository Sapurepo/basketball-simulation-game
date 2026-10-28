import { itemById } from '../data/items'
import type { Placement } from '../engine/types'
import { type ArtName, artSize } from './shopArt'

// 무대 배치: 110×80 논리 격자(바닥선 y=60). 창문은 늘 있고, 커튼은 창문에 붙어 함께 움직인다
export const WINDOW_POS: [number, number] = [10, 22]
export const WALL = new Set(['window', 'curtain', 'clock', 'frame'])

export type Layout = Record<string, Placement>

// 끌거나 방향키로 옮기는 대상 (커튼을 잡으면 창문이 움직인다)
export const anchorOf = (id: string) => (id === 'curtain' ? 'window' : id)

const defaultPos = (id: string): [number, number] =>
  id === 'window' ? WINDOW_POS : (itemById(id)?.pos ?? [0, 0])

// 놓일 수 있는 자리: 창문은 벽 가운데, 시계·액자는 벽, 러그는 바닥 앞쪽,
// 가구·탈것은 바닥선에 걸치게. 가로로는 1/3까지 무대 밖으로 나갈 수 있다
export function clampPos(id: string, x: number, y: number): [number, number] {
  const [w, h] = artSize(id as ArtName)
  const c = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  if (id === 'window') return [c(x, 6, 110 - w - 6), c(y, 8, 30)]
  if (id === 'clock' || id === 'frame')
    return [c(x, 0, 110 - w), c(y, 4, 56 - h)]
  const x0 = -Math.floor(w / 3)
  const x1 = 110 - Math.ceil((w * 2) / 3)
  if (id === 'rug') return [c(x, x0, x1), c(y, 60, 80 - h)]
  return [c(x, x0, x1), c(y, 58 - h, 84 - h)]
}

// 지금 자리. 커튼은 창문 자리에서 (-6, -4)
export interface Place {
  x: number
  y: number
  flip: boolean
  hidden: boolean
}

export function placeOf(layout: Layout | undefined, id: string): Place {
  const own = layout?.[id] ?? {}
  if (id === 'curtain') {
    const win = placeOf(layout, 'window')
    return { x: win.x - 6, y: win.y - 4, flip: false, hidden: !!own.hidden }
  }
  const [dx, dy] = defaultPos(id)
  return {
    x: own.x ?? dx,
    y: own.y ?? dy,
    flip: !!own.flip,
    hidden: !!own.hidden,
  }
}

export const patchPlace = (
  layout: Layout | undefined,
  id: string,
  patch: Placement,
): Layout => ({ ...layout, [id]: { ...layout?.[id], ...patch } })

// 제자리로: 위치·반전만 지우고 보관 여부는 둔다
export function resetPlace(layout: Layout | undefined, id: string): Layout {
  const next = { ...layout }
  if (next[id]?.hidden) next[id] = { hidden: true }
  else delete next[id]
  return next
}

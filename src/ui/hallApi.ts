import { migrateLook } from '../engine/save'
import type { Look, Position } from '../engine/types'

// 공용 명예의 전당 API 조회 (functions/api/hall.ts)
export type HallSort = 'ovr' | 'fmvp'
export const SORTS: [HallSort, string][] = [
  ['ovr', '최고 OVR순'],
  ['fmvp', '파이널 MVP순'],
]
export interface HallRow {
  id: string
  rank: number
  name: string
  position: Position
  look?: Look
  peakOvr: number
  fmvp: number
  trophies: number
  seasons: number
  retiredYear: number
}

export async function fetchHall(sort: HallSort, page: number, size?: number) {
  const q = new URLSearchParams({ sort, page: String(page) })
  if (size) q.set('size', String(size))
  const res = await fetch(`/api/hall?${q}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as {
    total: number
    rows: (Omit<HallRow, 'look'> & { look: Look | null })[]
  }
  return {
    total: data.total,
    rows: data.rows.map((r): HallRow => ({
      ...r,
      look: r.look ? migrateLook(r.look, r.name) : undefined,
    })),
  }
}

import { migrateLook } from '../engine/save'
import type { Look, Position } from '../engine/types'

// 공용 명예의 전당 API 조회 (functions/api/hall.ts)
export type HallSort = 'ovr' | 'fmvp'
export const SORTS: [HallSort, string][] = [
  ['ovr', '최고 OVR순'],
  ['fmvp', '파이널 MVP순'],
]
// 베스트 5 3-2 배치: 앞줄 SF·C·PF, 뒷줄 PG·SG. 상세 팝업의 이전·다음도 이 순서
export const BEST_ORDER: Position[][] = [
  ['SF', 'C', 'PF'],
  ['PG', 'SG'],
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

// 상위 size 명(최대 100), best 면 포지션별 1위
export async function fetchHall(
  sort: HallSort,
  opts: { size?: number; best?: boolean } = {},
) {
  const q = new URLSearchParams({ sort })
  if (opts.size) q.set('size', String(opts.size))
  if (opts.best) q.set('best', '1')
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

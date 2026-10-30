import { formatMoney } from '../engine/events'
import { migrateLook } from '../engine/save'
import type { Look, Position } from '../engine/types'
import { tr } from '../i18n'

// 공용 명예의 전당 API 조회 (functions/api/hall.ts)
export type HallSort = 'ovr' | 'fmvp' | 'earnings' | 'minutes' | 'pts' | 'ast'
// [id, 정렬 이름, 칩에 쓰는 짧은 이름 — '정렬 기준' 라벨 아래 한 줄에 들어가게]
export const SORTS: [HallSort, string, string][] = [
  ['ovr', '최고 OVR순', '최고 OVR'],
  ['fmvp', '파이널 MVP순', '파이널 MVP'],
  ['earnings', '수익순', '수익'],
  ['minutes', '출전시간순', '출전시간'],
  ['pts', '통산 득점순', '득점'],
  ['ast', '통산 어시스트순', '어시스트'],
]
export const isHallSort = (v: string | null): v is HallSort =>
  SORTS.some(([id]) => id === v)
// 리그 필터: 그 리그를 한 시즌이라도 뛴 선수. 둘 다 뛰었으면 양쪽에 다 나온다
export type HallLeague = 'all' | 'KBL' | 'NBA'
export const LEAGUES: [HallLeague, string][] = [
  ['all', '전체'],
  ['KBL', 'KBL'],
  ['NBA', 'NBA'],
]
export const isHallLeague = (v: string | null): v is HallLeague =>
  LEAGUES.some(([id]) => id === v)
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
  // 통산 수입(만원)·출전시간·득점·어시스트. 정렬 다양화 전 기록은 null
  earnings: number | null
  minutes: number | null
  pts: number | null
  ast: number | null
}

// 상위 size 명(최대 100), best 면 포지션별 1위
export async function fetchHall(
  sort: HallSort,
  opts: { size?: number; best?: boolean; league?: HallLeague } = {},
) {
  const q = new URLSearchParams({ sort })
  if (opts.size) q.set('size', String(opts.size))
  if (opts.best) q.set('best', '1')
  if (opts.league && opts.league !== 'all') q.set('league', opts.league)
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

// 정렬 기준값(내림차순). 기록이 없는 옛 행은 뒤로
const sortValue = (sort: HallSort, r: HallRow) =>
  sort === 'ovr' ? r.peakOvr : sort === 'fmvp' ? r.fmvp : (r[sort] ?? -1)
// 이 브라우저의 기록처럼 서버를 거치지 않는 목록을 같은 기준으로 정렬할 때
export const compareRows = (sort: HallSort) => (a: HallRow, b: HallRow) =>
  sortValue(sort, b) - sortValue(sort, a) ||
  b.peakOvr - a.peakOvr ||
  b.fmvp - a.fmvp

// 통산 기록 칸의 표시값. 없으면 undefined
export function statText(
  k: 'earnings' | 'minutes' | 'pts' | 'ast',
  r: HallRow,
): string | undefined {
  const v = r[k]
  if (v === null) return undefined
  if (k === 'earnings') return formatMoney(v, 'KRW')
  if (k === 'minutes') return tr('{n}분', { n: v.toLocaleString() })
  return k === 'pts'
    ? tr('{n}점', { n: v.toLocaleString() })
    : tr('{n}어시', { n: v.toLocaleString() })
}

// 목록 한 줄의 보조 정보: 정렬 기준이 통산 기록이면 그 값을 맨 앞에. 시즌 수가 없는 기록(내 기록)은 그 칸을 뺀다
export function rowDetail(sort: HallSort, r: HallRow): string[] {
  const lead =
    sort === 'ovr' || sort === 'fmvp'
      ? []
      : [statText(sort, r) ?? tr('기록 없음')]
  return [
    ...lead,
    tr('트로피 {n}', { n: r.trophies }),
    ...(r.seasons ? [tr('{n}시즌', { n: r.seasons })] : []),
    tr('{year}년 은퇴', { year: r.retiredYear }),
  ]
}

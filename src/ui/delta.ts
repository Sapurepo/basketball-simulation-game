import { ATTR_KEYS } from '../engine/player'
import type { Attributes, StatLine } from '../engine/types'

// 시즌 진행 전후 능력치 차이. 막대가 보여주는 반올림 정수끼리 비교한다
export const attrDelta = (before: Attributes, after: Attributes) =>
  Object.fromEntries(
    ATTR_KEYS.map((k) => [k, Math.round(after[k]) - Math.round(before[k])]),
  ) as Attributes

// 직전 시즌 대비 경기당 평균 증감. 어느 쪽이든 경기가 없으면 비교하지 않는다
export const statDelta = (prev: StatLine, cur: StatLine, k: keyof StatLine) =>
  prev.games && cur.games
    ? cur[k] / cur.games - prev[k] / prev.games
    : undefined

// '+1.3' / '−0.8' (digits 0 이면 '+2'). 반올림해 0 이면 표시하지 않는다
export function fmtDelta(d: number, digits = 1) {
  const m = 10 ** digits
  const r = Math.round(d * m) / m
  if (!r) return ''
  return r > 0 ? `+${r.toFixed(digits)}` : `−${Math.abs(r).toFixed(digits)}`
}

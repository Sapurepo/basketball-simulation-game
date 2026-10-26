import type { SeasonRecord, Stage, StatLine } from '../engine/types'

export const STAGE_LABEL: Record<Stage, string> = {
  HS: '고교',
  COLLEGE: '대학',
  KBL: 'KBL',
  NBA: 'NBA',
  FREE: '무소속',
  RETIRED: '은퇴',
}

export const avg = (s: StatLine, k: keyof StatLine) =>
  s.games ? (s[k] / s.games).toFixed(1) : '-'

export const pct = (m: number, a: number) =>
  a ? `${((m / a) * 100).toFixed(1)}%` : '-'

// 고교·대학은 단일 연도, 프로는 시즌 표기(2031-32)
export function seasonLabel(r: Pick<SeasonRecord, 'year' | 'stage'>) {
  return r.stage === 'KBL' || r.stage === 'NBA'
    ? `${r.year}-${String((r.year + 1) % 100).padStart(2, '0')}`
    : String(r.year)
}

import type { SeasonRecord, Service, Stage, StatLine } from '../engine/types'
import { tr } from '../i18n'

export const STAGE_LABEL: Record<Stage, string> = {
  HS: '고교',
  COLLEGE: '대학',
  KBL: 'KBL',
  NBA: 'NBA',
  MILITARY: '군 복무',
  FREE: '무소속',
  RETIRED: '은퇴',
}

export function serviceLabel(s: Service) {
  if (s.status === 'exempt') return tr('병역특례(예술체육요원)')
  if (s.status === 'serving')
    return tr(s.kind === 'sangmu' ? '상무 복무 중' : '현역 복무 중')
  if (s.status === 'done')
    return tr(s.kind === 'sangmu' ? '상무 전역' : '현역 전역')
  return tr('미필')
}

// 무대 라벨(현재 언어)
export const stageLabel = (s: Stage) => tr(STAGE_LABEL[s])

export const avg = (s: StatLine, k: keyof StatLine) =>
  s.games ? (s[k] / s.games).toFixed(1) : '-'

export const pct = (m: number, a: number) =>
  a ? `${((m / a) * 100).toFixed(1)}%` : '-'

// 고교·대학은 단일 연도, 프로는 시즌 표기(2031-32)
export function seasonLabel(r: Pick<SeasonRecord, 'year' | 'stage'>) {
  return r.stage === 'KBL' || r.stage === 'NBA' || r.stage === 'MILITARY'
    ? `${r.year}-${String((r.year + 1) % 100).padStart(2, '0')}`
    : String(r.year)
}

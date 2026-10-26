// 실제 리그 규정·수치를 게임 밸런스 보정용으로만 사용한다. 출처와 근사 여부는 docs/dataSources.md 참고.
import type { Stage } from '../engine/types'

export interface LeagueConfig {
  label: string
  quarterMinutes: number
  // 해당 무대 주전급 평균 OVR. 능력치는 이 값 대비 상대값으로 스탯이 계산된다.
  level: number
  avgScore: number
}

export const LEAGUES: Record<
  Exclude<Stage, 'FREE' | 'RETIRED'> | 'NATIONAL',
  LeagueConfig
> = {
  HS: { label: '고교', quarterMinutes: 8, level: 50, avgScore: 72 },
  COLLEGE: { label: '대학', quarterMinutes: 10, level: 60, avgScore: 76 },
  KBL: { label: 'KBL', quarterMinutes: 10, level: 66, avgScore: 80 },
  NBA: { label: 'NBA', quarterMinutes: 12, level: 85, avgScore: 114 },
  MILITARY: { label: '상무', quarterMinutes: 10, level: 62, avgScore: 78 },
  NATIONAL: { label: '국가대표', quarterMinutes: 10, level: 70, avgScore: 80 },
}

export const KBL_GAMES = 54
export const NBA_GAMES = 82
export const UNIV_LEAGUE_GAMES = 20 // 11개 팀 더블 라운드로빈
export const TWO_WAY_GAME_LIMIT = 50
export const D_LEAGUE_GAMES = 18

// 병역: 만 28세까지 입대 연기 가능(게임용 단순화), 4년 주기 아시안게임
export const ENLIST_MIN_AGE = 22
export const ENLIST_MAX_AGE = 28
export const ASIAN_GAMES_FIRST = 2030

// 연봉 테이블: [OVR, 금액]. 사이는 선형 보간.
// KBL 단위: 만원. 샐러리캡 30억, 2025-26 국내 최고 보수 8억.
export const KBL_SALARY: [number, number][] = [
  [55, 4200],
  [60, 7000],
  [65, 15000],
  [70, 30000],
  [75, 52000],
  [80, 80000],
]
// NBA 단위: 달러. 2025-26 캡 $154.647M, 루키 최저 $1.27M, 맥스는 캡의 35% 근사.
export const NBA_SALARY: [number, number][] = [
  [80, 1_272_870],
  [84, 3_000_000],
  [88, 12_000_000],
  [91, 28_000_000],
  [94, 45_000_000],
  [97, 54_000_000],
]
export const NBA_TWO_WAY_SALARY = 636_435

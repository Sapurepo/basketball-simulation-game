export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type AttrKey =
  | 'shooting'
  | 'finishing'
  | 'playmaking'
  | 'rebounding'
  | 'defense'
  | 'athleticism'
export type Attributes = Record<AttrKey, number>
export type Stage =
  'HS' | 'COLLEGE' | 'KBL' | 'NBA' | 'MILITARY' | 'FREE' | 'RETIRED'
export type GrowthType = 'early' | 'normal' | 'late'

// 외형(픽셀 캐릭터): 팔레트 인덱스
export interface Look {
  skin: number
  hair: number
  // 이전 저장 파일 호환을 위해 선택 필드
  hairStyle?: number
  accessory?: number
}

export interface Player {
  name: string
  position: Position
  style: string
  height: number
  look?: Look
  attrs: Attributes
  potential: number
  // 숨은 특성: UI 에 직접 노출하지 않는다.
  growthType: GrowthType
  injuryProne: boolean
  clutch: boolean
}

export interface Contract {
  teamId: string
  teamName: string
  salary: number
  currency: 'KRW' | 'USD'
  yearsLeft: number
  twoWay?: boolean
}

export interface StatLine {
  games: number
  minutes: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  fgm: number
  fga: number
  tpm: number
  tpa: number
  ftm: number
  fta: number
}

export interface GameLog {
  label: string
  opponent: string
  myScore: number
  oppScore: number
  box: StatLine
  pbp: string[]
}

// 리그 베스트 팀(퍼스트~서드)의 한 자리
export interface BestPlayer {
  position: Position
  name: string
  team: string
  ovr: number
  pts: number
  reb: number
  ast: number
  me?: boolean
}

export interface SeasonRecord {
  year: number
  age: number
  stage: Stage
  team: string
  ovr: number
  stats: StatLine
  playoffStats?: StatLine
  wins: number
  losses: number
  // 시즌 결과 요약 조각들 (화면에서는 뱃지로 표시)
  result: string[]
  awards: string[]
  featured: GameLog[]
  // 리그 베스트 퍼스트·세컨드·서드 팀 (프로·대학만)
  bestTeams?: BestPlayer[][]
  minutesShare: number
  salary?: { amount: number; currency: 'KRW' | 'USD' }
}

export interface EventOption {
  id: string
  label: string
  desc?: string
  // 구단 제안이면 로고 표시용
  teamId?: string
}

export interface GameEvent {
  kind: string
  title: string
  body: string
  options: EventOption[]
  data?: Record<string, unknown>
}

export interface Modifiers {
  focus?: AttrKey
  growthBonus: number
  // 상무 전역 시즌: 시즌 중반(12월)부터 합류
  lateReturn?: boolean
}

// 병역: 상무(국군체육부대) 또는 현역. 아시안게임 금메달이면 예술체육요원 편입.
export interface Service {
  status: 'pending' | 'serving' | 'done' | 'exempt'
  kind?: 'sangmu' | 'active'
  returnTo?: {
    stage: Stage
    teamId: string
    teamName: string
    contract?: Contract
  }
}

export interface Honor {
  year: number
  name: string
}

export interface GameState {
  version: 1
  rng: number
  year: number
  age: number
  stage: Stage
  teamId: string
  teamName: string
  stageYear: number
  player: Player
  contract?: Contract
  history: SeasonRecord[]
  events: GameEvent[]
  mods: Modifiers
  earnings: { KRW: number; USD: number }
  peakOvr: number
  service: Service
  honors: Honor[]
}

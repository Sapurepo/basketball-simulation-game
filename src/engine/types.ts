export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type AttrKey =
  | 'shooting'
  | 'finishing'
  | 'playmaking'
  | 'rebounding'
  | 'defense'
  | 'athleticism'
export type Attributes = Record<AttrKey, number>
export type Stage = 'HS' | 'COLLEGE' | 'KBL' | 'NBA' | 'FREE' | 'RETIRED'
export type GrowthType = 'early' | 'normal' | 'late'

export interface Player {
  name: string
  position: Position
  style: string
  height: number
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
  result: string
  awards: string[]
  featured: GameLog[]
  minutesShare: number
  salary?: { amount: number; currency: 'KRW' | 'USD' }
}

export interface EventOption {
  id: string
  label: string
  desc?: string
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
}

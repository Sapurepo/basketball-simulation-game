import type { Text } from '../i18n'

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type AttrKey =
  | 'shooting'
  | 'finishing'
  | 'playmaking'
  | 'rebounding'
  | 'defense'
  | 'athleticism'
  | 'speed'
export type Attributes = Record<AttrKey, number>
export type Stage =
  'HS' | 'COLLEGE' | 'KBL' | 'NBA' | 'MILITARY' | 'FREE' | 'RETIRED'
export type GrowthType = 'early' | 'normal' | 'late'
// 성장 기질: 천재형(훈련 없으면 성장 둔화) · 노력형(훈련마다 성장 보너스, 훈련 성공 +2) · 보통
export type Ethic = 'gifted' | 'steady' | 'normal'

// 외형(픽셀 캐릭터 v2). 이전 저장 파일의 팔레트 인덱스 외형은 save.ts 에서 변환한다.
export type HairStyle =
  | 'crew'
  | 'flatTop'
  | 'spiky'
  | 'bangs'
  | 'slick'
  | 'buzz'
  | 'curtains'
  | 'afro'
  | 'messy'
export type Face = 'fierce' | 'calm' | 'grin'
// 뒤 8종은 상점 치장 아이템이 입힌다
export type Accessory =
  | 'wrist'
  | 'knee'
  | 'sleeve'
  | 'headband'
  | 'bandaid'
  | 'glasses'
  | 'cap'
  | 'shades'
  | 'chain'
  | 'headphones'
  | 'earbuds'
  | 'goldShoes'
  | 'undershirt'
  | 'beanie'
  | 'visor'
  | 'bucketHat'
  | 'truckerCap'
  | 'fedora'
  | 'tights'
export interface Look {
  // 피부 팔레트 인덱스 0~5
  skin: number
  hair: string
  hairStyle: HairStyle
  face: Face
  acc: Accessory[]
  num: number
  // 헤드밴드·손목밴드 색
  accent?: string
}

export interface Player {
  name: string
  position: Position
  style: string
  height: number
  // kg. 생성 때 스피드에 반영되고 이후에는 표시용
  weight: number
  look?: Look
  attrs: Attributes
  potential: number
  // 노력치: 훈련 1회마다 해당 능력치 +1 (능력치별 EV_MAX, 합계 EV_TOTAL). 성장 분배를 그쪽으로 기울인다
  ev: Partial<Attributes>
  // 숨은 특성: UI 에 직접 노출하지 않는다.
  growthType: GrowthType
  ethic: Ethic
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

// 중계 한 장면. made2~blk 는 내 선수, mate 는 동료, opp 는 상대, 나머지는 구분선
export type PlayKind =
  | 'made2'
  | 'miss2'
  | 'made3'
  | 'miss3'
  | 'ft'
  | 'reb'
  | 'ast'
  | 'stl'
  | 'blk'
  | 'mate'
  | 'opp'
  | 'start'
  | 'qend'
  | 'end'

export interface Play {
  // 경기 시작부터 지난 초
  t: number
  kind: PlayKind
  pts: number
  // 이 장면까지의 점수
  me: number
  op: number
  text: Text
  // 슛 시도: 결과 앞에 먼저 보여 준다 (두 박자 중계)
  pre?: Text
  // 중계 목록에 안 나오고 점수·시계에만 반영되는 장면
  quiet?: boolean
  // 막판 접전의 득점
  hot?: boolean
}

export interface Cast {
  team: string
  quarterMinutes: number
  plays: Play[]
}

export interface GameLog {
  label: string
  opponent: string
  myScore: number
  oppScore: number
  box: StatLine
  cast?: Cast
  // 이전 저장의 텍스트 중계 (cast 가 없을 때만)
  pbp?: Text[]
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
  // 우승한 결승 시리즈 기록 (이전 저장에는 없다)
  finalsStats?: StatLine
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
  label: Text
  desc?: Text
  // 구단 제안이면 로고 표시용
  teamId?: string
}

export interface GameEvent {
  kind: string
  title: Text
  body: Text
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

// 훈련 12종 (6종목). 이전 저장의 shootout·passDrill·dribbleDrill 은 events.ts drillKind 가 ft·pass·drib 으로 읽는다
export type DrillKind =
  | 'ft'
  | 'three'
  | 'pass'
  | 'team'
  | 'reb'
  | 'box'
  | 'drib'
  | 'foot'
  | 'react'
  | 'fast'
  | 'bench'
  | 'squat'

export interface Honor {
  year: number
  name: string
}

// 무대 위 아이템 하나의 배치. x·y 는 110×80 논리 격자, 없으면 아이템 기본 자리
export interface Placement {
  x?: number
  y?: number
  flip?: boolean
  hidden?: boolean
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
  // 이번 오프시즌에 마친 훈련 (시즌을 진행하면 비운다). 이전 저장 파일에는 없다
  drillsDone?: DrillKind[]
  // 보유 자금(만원)과 상점에서 산 아이템 id. 이전 저장 파일에는 없다
  cash?: number
  items?: string[]
  // 무대에 적용한 벽지·바닥타일 아이템 id, 쓰고 있는 모자 아이템 id (슬롯 아이템은 적용 중일 때만 효과)
  wall?: string
  floor?: string
  hat?: string
  // 무대 배치 편집 결과 (아이템 id → 옮긴 자리·반전·보관). 없는 항목은 기본 자리
  layout?: Record<string, Placement>
  // 공용 명예의 전당 등록용 커리어 고유 id와 등록 여부
  careerId?: string
  hallPosted?: boolean
}

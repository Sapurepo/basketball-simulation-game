import { DRILLS } from './events'
import { START_CASH } from './game'
import { hallFmvp, hallTrophies, toHallPayload } from './hallEntry'
import { idealWeight } from './player'
import type {
  Accessory,
  GameState,
  HairStyle,
  Look,
  Position,
  Stage,
} from './types'

const KEY = 'basketball-career-v1'
const HALL_KEY = 'basketball-hall-v1'

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseSave(raw) : null
  } catch {
    return null
  }
}

// 화면은 마지막 시즌의 주요 경기만 다시 보여 준다. 지난 시즌 중계(세이브의 대부분)는 저장하지 않는다
export const compactSave = (s: GameState): GameState => ({
  ...s,
  history: s.history.map((h, i) =>
    i < s.history.length - 1 ? { ...h, featured: [] } : h,
  ),
})

export function saveGame(s: GameState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(compactSave(s)))
    else localStorage.removeItem(KEY)
  } catch {
    // 시크릿 모드 등 저장 불가 환경: 메모리 상태로만 진행
  }
}

// 이전 외형: 팔레트 인덱스 (피부 4 · 머리색 4 · 머리 모양 4 · 액세서리 3)
interface LegacyLook {
  skin: number
  hair: number
  hairStyle?: number
  accessory?: number
}
const LEGACY_HAIRS = ['#2b2420', '#5a3a22', '#a8743a', '#d8d2c4']
const LEGACY_STYLES: HairStyle[] = ['crew', 'buzz', 'curtains', 'afro']
const LEGACY_ACC: Accessory[][] = [[], ['headband'], ['glasses']]

export function migrateLook(look: Look | LegacyLook, name: string): Look {
  if (typeof look.hair === 'string') return look as Look
  const old = look as LegacyLook
  // 등번호가 없던 시절: 이름으로 1~99 사이 번호를 고정 배정
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return {
    skin: old.skin,
    hair: LEGACY_HAIRS[old.hair] ?? LEGACY_HAIRS[0],
    hairStyle: LEGACY_STYLES[old.hairStyle ?? 0] ?? 'crew',
    face: 'fierce',
    acc: LEGACY_ACC[old.accessory ?? 0] ?? [],
    num: (h % 99) + 1,
  }
}

export function parseSave(raw: string): GameState {
  const s = JSON.parse(raw) as GameState
  if (s?.version !== 1 || !s.player || !Array.isArray(s.history)) {
    throw new Error('올바른 저장 파일이 아닙니다.')
  }
  // 병역 시스템 이전 저장 파일 호환
  s.service ??= { status: 'pending' }
  s.honors ??= []
  // 스피드·몸무게·자금·아이템 이전 저장 파일 호환
  s.player.attrs.speed ??= s.player.attrs.athleticism
  s.player.weight ??= idealWeight(s.player.height)
  s.cash ??= START_CASH
  // 성장 기질·노력치 이전 저장 파일: 보통 기질, 노력치 0
  s.player.ethic ??= 'normal'
  s.player.ev ??= {}
  // 미들슛 훈련이 빠지기 전 저장 파일: 완료 목록에서 지운다
  s.drillsDone = s.drillsDone?.filter((k) => k in DRILLS)
  s.items ??= []
  // 공용 명예의 전당 이전 저장 파일
  s.careerId ??= crypto.randomUUID()
  // 펫 세분화 이전의 '강아지'는 포메라니안으로
  s.items = s.items.map((id) => (id === 'dog' ? 'pomeranian' : id))
  if (s.player.look) s.player.look = migrateLook(s.player.look, s.player.name)
  // 모자 슬롯 이전 저장 파일: 쓰고 있던 스냅백을 모자 슬롯에 넣는다
  if (!s.hat && s.player.look?.acc.includes('cap') && s.items.includes('cap'))
    s.hat = 'cap'
  // 결과가 문자열이던 저장 파일 호환
  for (const h of s.history) {
    const r = h.result as unknown
    if (typeof r === 'string') h.result = r.split(' · ')
  }
  return s
}

function download(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// 오류 화면용: 해석이 안 되는 세이브라도 저장된 그대로 내려받는다. 저장된 게 없으면 false
export function exportRawSave(): boolean {
  const raw = localStorage.getItem(KEY)
  if (!raw) return false
  download(raw, 'career-backup.json')
  return true
}

// 이 브라우저의 명예의 전당(내 기록): 은퇴한 커리어의 요약
export interface HallEntry {
  // 커리어 id. 이전 기록에는 없다
  id?: string
  name: string
  position: Position
  look?: Look
  peakOvr: number
  stage: Stage
  trophies: number
  // NBA 파이널 MVP 횟수. 이전 기록에는 없다
  fmvp?: number
  year: number
  // KBL 챔피언결정전 우승 횟수. 이전 기록에는 없다
  kblTitles?: number
  // 통산 수입(만원)·출전시간·득점·어시스트. 이전 기록에는 없다
  earnings?: number
  minutes?: number
  pts?: number
  ast?: number
}

export function loadHall(): HallEntry[] {
  try {
    const hall = JSON.parse(
      localStorage.getItem(HALL_KEY) ?? '[]',
    ) as HallEntry[]
    for (const e of hall) if (e.look) e.look = migrateLook(e.look, e.name)
    return hall
  } catch {
    return []
  }
}

export function recordHall(s: GameState): HallEntry[] {
  const hall = loadHall()
  if (s.stage !== 'RETIRED' || hall.some((e) => e.id && e.id === s.careerId))
    return hall
  const payload = toHallPayload(s)
  const entry: HallEntry = {
    id: s.careerId,
    name: s.player.name,
    position: s.player.position,
    look: s.player.look,
    peakOvr: s.peakOvr,
    stage: s.stage,
    trophies: hallTrophies(s),
    fmvp: hallFmvp(s),
    year: s.year,
    kblTitles: payload.kblTitles,
    earnings: payload.earnings,
    minutes: payload.minutes,
    pts: payload.pts,
    ast: payload.ast,
  }
  const next = [...hall, entry].sort(
    (a, b) => b.peakOvr - a.peakOvr || b.trophies - a.trophies,
  )
  try {
    localStorage.setItem(HALL_KEY, JSON.stringify(next))
  } catch {
    // 저장 불가 환경
  }
  return next
}

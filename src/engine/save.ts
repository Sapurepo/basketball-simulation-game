import { START_CASH } from './game'
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

export function saveGame(s: GameState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
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
  s.items ??= []
  if (s.player.look) s.player.look = migrateLook(s.player.look, s.player.name)
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

export function exportSave(s: GameState) {
  download(JSON.stringify(s), `career-${s.player.name}-${s.year}.json`)
}

// 오류 화면용: 해석이 안 되는 세이브라도 저장된 그대로 내려받는다. 저장된 게 없으면 false
export function exportRawSave(): boolean {
  const raw = localStorage.getItem(KEY)
  if (!raw) return false
  download(raw, 'career-backup.json')
  return true
}

// 명예의 전당: 끝났거나 버린 커리어의 요약. 랜딩 랭킹에 쓴다.
export interface HallEntry {
  name: string
  position: Position
  look?: Look
  peakOvr: number
  stage: Stage
  trophies: number
  year: number
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
  if (!s.history.length) return loadHall()
  const entry: HallEntry = {
    name: s.player.name,
    position: s.player.position,
    look: s.player.look,
    peakOvr: s.peakOvr,
    stage: s.stage,
    trophies:
      s.history.reduce((n, h) => n + h.awards.length, 0) + s.honors.length,
    year: s.year,
  }
  // ponytail: 최고 오버롤 순 상위 10명만 보관, 동률은 트로피 수
  const hall = [...loadHall(), entry]
    .sort((a, b) => b.peakOvr - a.peakOvr || b.trophies - a.trophies)
    .slice(0, 10)
  try {
    localStorage.setItem(HALL_KEY, JSON.stringify(hall))
  } catch {
    // 저장 불가 환경
  }
  return hall
}

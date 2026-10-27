import type {
  Accessory,
  Face,
  GameState,
  HairStyle,
  Look,
  Position,
} from './types'

// 공용 명예의 전당 등록 규칙. 클라이언트(등록 데이터 생성)와 Pages Function(검증)이 함께 쓴다
export interface HallPayload {
  id: string
  name: string
  position: Position
  look: Look | null
  peakOvr: number
  fmvp: number
  trophies: number
  seasons: number
  retiredYear: number
}

export const NAME_MAX = 10
export const HALL_PAGE_SIZE = 50
const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
const HAIR_STYLES: HairStyle[] = [
  'crew',
  'flatTop',
  'spiky',
  'bangs',
  'slick',
  'buzz',
  'curtains',
  'afro',
  'messy',
]
const FACES: Face[] = ['fierce', 'calm', 'grin']
const ACCESSORIES: Accessory[] = [
  'wrist',
  'knee',
  'sleeve',
  'headband',
  'bandaid',
  'glasses',
  'cap',
  'shades',
  'chain',
  'headphones',
  'earbuds',
  'goldShoes',
  'undershirt',
  'tights',
]
// ponytail: 짧은 금칙어 목록만 거른다. 우회 표기까지 막으려면 신고·삭제 운영이나 외부 필터가 필요
const BANNED = ['시발', '씨발', '병신', '좆', '개새', '섹스', 'fuck', 'shit']

export const hallTrophies = (s: GameState) =>
  s.history.reduce((n, h) => n + h.awards.length, 0) + s.honors.length

export const hallFmvp = (s: GameState) =>
  s.history.filter((h) => h.awards.includes('NBA 파이널 MVP')).length

export function toHallPayload(s: GameState): HallPayload {
  return {
    id: s.careerId ?? '',
    name: s.player.name,
    position: s.player.position,
    look: s.player.look ?? null,
    peakOvr: s.peakOvr,
    fmvp: hallFmvp(s),
    trophies: hallTrophies(s),
    seasons: s.history.length,
    retiredYear: s.year,
  }
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const isHex = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

export function cleanName(name: string) {
  // 제어 문자를 지우고 공백을 하나로
  return name.replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim()
}

function validLook(v: unknown): v is Look {
  if (!v || typeof v !== 'object') return false
  const l = v as Record<string, unknown>
  return (
    isInt(l.skin, 0, 5) &&
    isHex(l.hair) &&
    HAIR_STYLES.includes(l.hairStyle as HairStyle) &&
    FACES.includes(l.face as Face) &&
    Array.isArray(l.acc) &&
    l.acc.length <= ACCESSORIES.length &&
    l.acc.every((a) => ACCESSORIES.includes(a as Accessory)) &&
    isInt(l.num, 0, 99) &&
    (l.accent === undefined || isHex(l.accent))
  )
}

// 서버 검증: 통과하면 정리된 값, 아니면 거부 사유
export function validateHall(v: unknown): HallPayload | string {
  if (!v || typeof v !== 'object') return '형식 오류'
  const p = v as Record<string, unknown>
  if (typeof p.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(p.id))
    return '커리어 id 오류'
  const name = typeof p.name === 'string' ? cleanName(p.name) : ''
  if (!name || [...name].length > NAME_MAX) return '이름 길이 오류'
  const lower = name.toLowerCase().replace(/\s/g, '')
  if (BANNED.some((w) => lower.includes(w))) return '사용할 수 없는 이름'
  if (!POSITIONS.includes(p.position as Position)) return '포지션 오류'
  if (p.look !== null && !validLook(p.look)) return '외형 오류'
  if (!isInt(p.seasons, 1, 40)) return '시즌 수 오류'
  const seasons = p.seasons
  if (!isInt(p.peakOvr, 20, 99)) return 'OVR 오류'
  if (!isInt(p.fmvp, 0, seasons)) return '파이널 MVP 오류'
  // 한 시즌 수상은 많아야 열 개 남짓, 아시안게임 메달까지 넉넉히
  if (!isInt(p.trophies, 0, seasons * 15)) return '트로피 오류'
  if (!isInt(p.retiredYear, 2026, 2200)) return '은퇴 연도 오류'
  return {
    id: p.id.toLowerCase(),
    name,
    position: p.position as Position,
    look: p.look as Look | null,
    peakOvr: p.peakOvr,
    fmvp: p.fmvp,
    trophies: p.trophies,
    seasons,
    retiredYear: p.retiredYear,
  }
}

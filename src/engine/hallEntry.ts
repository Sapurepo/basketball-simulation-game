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
  // 한 시즌이라도 뛴 리그 (둘 다 가능)
  kbl: boolean
  nba: boolean
  // 통산 수입(만원, USD 는 환산)과 정규시즌 통산 출전시간·득점·어시스트
  earnings: number
  minutes: number
  pts: number
  ast: number
}

export const USD_TO_MANWON = 1400 / 10000

export const NAME_MAX = 10
// 랭킹 화면에 보여주는 인원 (API 한 번 조회 상한)
export const HALL_TOP = 100
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

export const hallEarnings = (s: GameState) =>
  s.earnings.KRW + Math.round(s.earnings.USD * USD_TO_MANWON)

const hallTotal = (s: GameState, k: 'minutes' | 'pts' | 'ast') =>
  s.history.reduce((n, h) => n + h.stats[k], 0)

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
    kbl: s.history.some((h) => h.stage === 'KBL'),
    nba: s.history.some((h) => h.stage === 'NBA'),
    earnings: hallEarnings(s),
    minutes: hallTotal(s, 'minutes'),
    pts: hallTotal(s, 'pts'),
    ast: hallTotal(s, 'ast'),
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

export const OUTDATED_CLIENT =
  '게임이 업데이트됐어요. 페이지를 새로고침한 뒤 다시 등록해 주세요.'

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
  // 정렬 다양화(1.4.0) 전 번들은 아래 여섯 값을 보내지 않는다. "리그 오류" 대신 새로고침을 안내한다
  if (!('kbl' in p) && !('earnings' in p)) return OUTDATED_CLIENT
  if (typeof p.kbl !== 'boolean' || typeof p.nba !== 'boolean')
    return '리그 오류'
  // 시즌당 상한: 수입 1천억 원, 출전 5,000분, 6,000점, 3,000어시스트 (NBA 최고 연봉·82경기 48분 기준으로 넉넉히)
  if (!isInt(p.earnings, 0, seasons * 10_000_000)) return '수입 오류'
  if (!isInt(p.minutes, 0, seasons * 5000)) return '출전시간 오류'
  if (!isInt(p.pts, 0, seasons * 6000)) return '득점 오류'
  if (!isInt(p.ast, 0, seasons * 3000)) return '어시스트 오류'
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
    kbl: p.kbl,
    nba: p.nba,
    earnings: p.earnings,
    minutes: p.minutes,
    pts: p.pts,
    ast: p.ast,
  }
}

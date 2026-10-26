import { clamp, type Rng } from './rng'
import type { AttrKey, Attributes, GrowthType, Player, Position } from './types'

export const ATTR_KEYS: AttrKey[] = [
  'shooting',
  'finishing',
  'playmaking',
  'rebounding',
  'defense',
  'athleticism',
]

export const ATTR_LABELS: Record<AttrKey, string> = {
  shooting: '슈팅',
  finishing: '돌파',
  playmaking: '패스',
  rebounding: '리바운드',
  defense: '수비',
  athleticism: '운동능력',
}

export const POSITION_LABELS: Record<Position, string> = {
  PG: '포인트가드',
  SG: '슈팅가드',
  SF: '스몰포워드',
  PF: '파워포워드',
  C: '센터',
}

// 오버롤 = 포지션별 가중평균 (각 행 합계 1)
const WEIGHTS: Record<Position, Attributes> = {
  PG: {
    shooting: 0.2,
    finishing: 0.15,
    playmaking: 0.35,
    rebounding: 0.05,
    defense: 0.15,
    athleticism: 0.1,
  },
  SG: {
    shooting: 0.35,
    finishing: 0.2,
    playmaking: 0.15,
    rebounding: 0.05,
    defense: 0.15,
    athleticism: 0.1,
  },
  SF: {
    shooting: 0.25,
    finishing: 0.2,
    playmaking: 0.1,
    rebounding: 0.1,
    defense: 0.2,
    athleticism: 0.15,
  },
  PF: {
    shooting: 0.1,
    finishing: 0.2,
    playmaking: 0.05,
    rebounding: 0.3,
    defense: 0.2,
    athleticism: 0.15,
  },
  C: {
    shooting: 0.05,
    finishing: 0.2,
    playmaking: 0.05,
    rebounding: 0.35,
    defense: 0.25,
    athleticism: 0.1,
  },
}

export const STYLES: Record<
  Position,
  { name: string; bonus: Partial<Attributes> }[]
> = {
  PG: [
    { name: '플레이메이커', bonus: { playmaking: 8, shooting: 3 } },
    { name: '공격형 가드', bonus: { shooting: 6, finishing: 5 } },
    { name: '수비형 가드', bonus: { defense: 8, athleticism: 3 } },
  ],
  SG: [
    { name: '슈터', bonus: { shooting: 10 } },
    { name: '슬래셔', bonus: { finishing: 7, athleticism: 4 } },
    { name: '3&D', bonus: { shooting: 5, defense: 6 } },
  ],
  SF: [
    { name: '스윙맨', bonus: { finishing: 6, shooting: 4 } },
    { name: '3&D', bonus: { shooting: 5, defense: 6 } },
    { name: '포인트 포워드', bonus: { playmaking: 8, shooting: 2 } },
  ],
  PF: [
    { name: '스트레치 빅', bonus: { shooting: 9, rebounding: 2 } },
    { name: '파워 포워드', bonus: { rebounding: 6, finishing: 5 } },
    { name: '수비형 빅', bonus: { defense: 8, athleticism: 3 } },
  ],
  C: [
    { name: '림 프로텍터', bonus: { defense: 9, rebounding: 2 } },
    { name: '포스트 스코어러', bonus: { finishing: 9, rebounding: 2 } },
    { name: '리바운더', bonus: { rebounding: 9, athleticism: 2 } },
  ],
}

const HEIGHT: Record<Position, [number, number]> = {
  PG: [178, 188],
  SG: [184, 193],
  SF: [190, 198],
  PF: [195, 202],
  C: [198, 210],
}

export const START_TOTAL = 240

export function overall(p: Pick<Player, 'attrs' | 'position'>): number {
  const w = WEIGHTS[p.position]
  return Math.round(ATTR_KEYS.reduce((s, k) => s + w[k] * p.attrs[k], 0))
}

export function potentialGrade(potential: number): string {
  if (potential >= 92) return 'S'
  if (potential >= 85) return 'A'
  if (potential >= 78) return 'B'
  if (potential >= 70) return 'C'
  return 'D'
}

export function createPlayer(
  rng: Rng,
  name: string,
  position: Position,
  styleName: string,
): Player {
  const w = WEIGHTS[position]
  const bonus = STYLES[position].find((s) => s.name === styleName)?.bonus ?? {}
  const raw = ATTR_KEYS.map(
    (k) => 40 + (w[k] - 1 / 6) * 60 + (bonus[k] ?? 0) + rng.range(-3, 3),
  )
  const scale = START_TOTAL / raw.reduce((a, b) => a + b, 0)
  const attrs = Object.fromEntries(
    ATTR_KEYS.map((k, i) => [k, Math.round(raw[i] * scale)]),
  ) as Attributes
  const [hMin, hMax] = HEIGHT[position]
  return {
    name,
    position,
    style: styleName,
    height: rng.int(hMin, hMax),
    attrs,
    potential: Math.round(clamp(rng.normal(78, 7), 60, 97)),
    growthType: rng.pick<GrowthType>(['early', 'normal', 'normal', 'late']),
    injuryProne: rng.chance(0.2),
    clutch: rng.chance(0.25),
  }
}

const PEAK: Record<GrowthType, number> = { early: 25, normal: 27, late: 29 }

function ageMult(age: number): number {
  if (age <= 18) return 0.3
  if (age <= 21) return 0.28
  if (age <= 24) return 0.25
  return 0.2
}

// 한 시즌 성장(또는 노쇠). minutesShare = 평균 출전시간 / 경기 시간.
export function grow(
  rng: Rng,
  p: Player,
  age: number,
  minutesShare: number,
  focus: AttrKey | undefined,
  bonus: number,
): void {
  const peak = PEAK[p.growthType]
  const gap = p.potential - overall(p)
  let g: number
  if (age >= peak) {
    g = -rng.range(0.3, 1) * (age - peak + 1) * 0.7 + bonus * 0.5
  } else if (gap <= 0) {
    g = rng.range(-0.5, 0.5) + bonus * 0.3
  } else {
    const play = 0.7 + 0.5 * clamp(minutesShare, 0, 1)
    g = gap * ageMult(age) * play * rng.range(0.75, 1.25) + bonus
  }

  // s_i = b_i / Σ w_j·b_j (b = w + 0.1 + 집중 보너스) → 오버롤 변화량이 정확히 g 가 된다.
  // 0.1 은 주력 능력치 하나만 99 로 치솟지 않도록 성장을 고르게 퍼뜨린다.
  const w = WEIGHTS[p.position]
  const b = (k: AttrKey) => w[k] + 0.1 + (k === focus ? 0.2 : 0)
  const denom = ATTR_KEYS.reduce((s, k) => s + w[k] * b(k), 0)
  for (const k of ATTR_KEYS) {
    let d = (g * b(k)) / denom
    if (k === 'athleticism' && age >= peak) d -= 1
    p.attrs[k] = clamp(p.attrs[k] + d, 20, 99)
  }
}

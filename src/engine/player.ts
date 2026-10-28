import { clamp, type Rng } from './rng'
import type { AttrKey, Attributes, GrowthType, Player, Position } from './types'

export const ATTR_KEYS: AttrKey[] = [
  'shooting',
  'finishing',
  'playmaking',
  'rebounding',
  'defense',
  'athleticism',
  'speed',
]

export const ATTR_LABELS: Record<AttrKey, string> = {
  shooting: '슈팅',
  finishing: '돌파',
  playmaking: '패스',
  rebounding: '리바운드',
  defense: '수비',
  athleticism: '운동능력',
  speed: '스피드',
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
    playmaking: 0.3,
    rebounding: 0.05,
    defense: 0.1,
    athleticism: 0.1,
    speed: 0.1,
  },
  SG: {
    shooting: 0.3,
    finishing: 0.2,
    playmaking: 0.1,
    rebounding: 0.05,
    defense: 0.15,
    athleticism: 0.1,
    speed: 0.1,
  },
  SF: {
    shooting: 0.2,
    finishing: 0.2,
    playmaking: 0.1,
    rebounding: 0.1,
    defense: 0.15,
    athleticism: 0.15,
    speed: 0.1,
  },
  PF: {
    shooting: 0.1,
    finishing: 0.2,
    playmaking: 0.05,
    rebounding: 0.3,
    defense: 0.15,
    athleticism: 0.15,
    speed: 0.05,
  },
  C: {
    shooting: 0.05,
    finishing: 0.2,
    playmaking: 0.05,
    rebounding: 0.35,
    defense: 0.2,
    athleticism: 0.1,
    speed: 0.05,
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
    { name: '슬래셔', bonus: { finishing: 6, speed: 5 } },
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
// 생성 화면에서 고를 수 있는 신장: 포지션 범위 ±4cm
export const heightRange = (p: Position): [number, number] => [
  HEIGHT[p][0] - 4,
  HEIGHT[p][1] + 4,
]
export const WEIGHT_RANGE: [number, number] = [60, 130]
export const idealWeight = (height: number) => height - 100
// 몸무게가 스피드에 주는 보정: 적정 체중보다 2.5kg 무거울 때마다 -1 (최대 -10), 가벼우면 최대 +4
export const weightSpeedMod = (height: number, weight: number) =>
  clamp(Math.round((idealWeight(height) - weight) / 2.5), -10, 4)

// 생성 시 능력치 합계와 조정 범위
export const START_TOTAL = 280
export const ATTR_MIN = 25
export const ATTR_MAX = 60

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
  const n = ATTR_KEYS.length
  const raw = ATTR_KEYS.map(
    (k) => 40 + (w[k] - 1 / n) * 60 + (bonus[k] ?? 0) + rng.range(-3, 3),
  )
  const scale = START_TOTAL / raw.reduce((a, b) => a + b, 0)
  const attrs = Object.fromEntries(
    ATTR_KEYS.map((k, i) => [k, Math.round(raw[i] * scale)]),
  ) as Attributes
  // 반올림 오차는 주력 능력치에 몰아 합계를 정확히 START_TOTAL 로 맞춘다 (생성 화면의 포인트 풀 기준)
  const main = ATTR_KEYS.reduce((a, b) => (w[b] > w[a] ? b : a))
  attrs[main] += START_TOTAL - ATTR_KEYS.reduce((s, k) => s + attrs[k], 0)
  const [hMin, hMax] = HEIGHT[position]
  const height = rng.int(hMin, hMax)
  return {
    name,
    position,
    style: styleName,
    height,
    weight: idealWeight(height) + rng.int(-5, 8),
    attrs,
    potential: rollPotential(rng),
    growthType: rng.pick<GrowthType>(['early', 'normal', 'normal', 'late']),
    injuryProne: rng.chance(0.2),
    clutch: rng.chance(0.25),
  }
}

// 정규분포만으로는 S(92+)가 약 2.7%. 2.8% 확률로 S 구간을 한 번 더 뽑아 약 5.4%로 맞춘다
function rollPotential(rng: Rng) {
  const p = Math.round(clamp(rng.normal(78, 7), 60, 97))
  return p < 92 && rng.chance(0.028) ? rng.int(92, 95) : p
}

// 전성기 종료 나이. 그 뒤 37세까지는 완만히, 38세(DECLINE_AGE)부터 급격히 노쇠한다.
const PEAK: Record<GrowthType, number> = { early: 33, normal: 35, late: 36 }
const DECLINE_AGE = 38

function ageMult(age: number): number {
  if (age <= 18) return 0.3
  if (age <= 21) return 0.28
  if (age <= 24) return 0.25
  if (age <= 27) return 0.2
  return 0.12
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
  if (age >= DECLINE_AGE) {
    g = -(1.0 + 0.4 * (age - DECLINE_AGE)) * rng.range(0.8, 1.2) + bonus * 0.5
  } else if (age >= peak) {
    g = -rng.range(0.2, 0.8) + bonus * 0.5
  } else if (gap <= 0) {
    g = rng.range(-0.5, 0.5) + bonus * 0.3
  } else {
    const play = 0.7 + 0.5 * clamp(minutesShare, 0, 1)
    g = gap * ageMult(age) * play * rng.range(0.75, 1.25) + bonus
  }

  // s_i = b_i / Σ w_j·b_j (b = w + 0.1 + 집중 보너스) → 오버롤 변화량이 정확히 g 가 된다.
  // 0.1 은 주력 능력치 하나만 99 로 치솟지 않도록 성장을 고르게 퍼뜨린다.
  // 이미 99 인 능력치는 분배에서 빼서 성장이 증발하지 않게 한다 (가중치가 몰린 포지션이 손해 보던 문제)
  const w = WEIGHTS[p.position]
  const b = (k: AttrKey) =>
    g > 0 && p.attrs[k] >= 99 ? 0 : w[k] + 0.1 + (k === focus ? 0.2 : 0)
  const denom = ATTR_KEYS.reduce((s, k) => s + w[k] * b(k), 0) || 1
  for (const k of ATTR_KEYS) {
    let d = (g * b(k)) / denom
    if ((k === 'athleticism' || k === 'speed') && age >= DECLINE_AGE) d -= 1
    p.attrs[k] = clamp(p.attrs[k] + d, 20, 99)
  }
}

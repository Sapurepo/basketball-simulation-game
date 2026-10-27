// 훈련 미니게임 판정. 화면과 분리해 테스트한다.

import { clamp } from '../engine/rng'

// 누르고 있으면 GAUGE_MS 마다 0→1→0 을 오간다(삼각파). 3왕복(MAX_HOLD_MS)을 넘기면 놓친 걸로 본다
export const GAUGE_MS = 600
export const MAX_HOLD_MS = GAUGE_MS * 6
export const gaugeAt = (heldMs: number) => {
  const t = heldMs / GAUGE_MS
  const leg = Math.floor(t)
  const f = t - leg
  return leg % 2 ? 1 - f : f
}

export type Zone = [lo: number, hi: number]
export type Verdict = 'good' | 'short' | 'long' | 'late'
export const judge = (v: number, [lo, hi]: Zone): Verdict =>
  v < lo ? 'short' : v > hi ? 'long' : 'good'

// 초록 구간 폭은 해당 능력치에 비례: 20 이면 0.04, 100 이면 0.15
export const zoneWidth = (stat: number) =>
  0.04 + 0.11 * clamp((stat - 20) / 80, 0, 1)

// 슈팅: 2K 처럼 꼭대기 근처에서 떼야 들어간다
export const SHOT_PEAK = 0.86
export const shotZone = (stat: number): Zone => {
  const w = zoneWidth(stat)
  return [SHOT_PEAK - w / 2, SHOT_PEAK + w / 2]
}

// 패스: 동료까지 거리(게이지 0~1 과 같은 축)를 중심으로. 구간은 슈팅보다 1.6배 넓다
export const PASS_ZONE_SCALE = 1.6
export const passDistance = (r = Math.random()) => 0.35 + r * 0.5
export const passZone = (d: number, stat: number): Zone => {
  const w = zoneWidth(stat) * PASS_ZONE_SCALE
  return [d - w / 2, d + w / 2]
}

// 드리블: 수비가 기운 반대쪽으로. 라운드마다 반응 시간이 줄고 350ms 에서 멈춘다
export type Side = 'left' | 'right'
export const reactionMs = (round: number) => Math.max(350, 850 - round * 60)
export const beatDefender = (choice: Side, lean: Side) => choice !== lean

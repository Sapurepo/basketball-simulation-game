// 훈련 미니게임 판정. 화면과 분리해 테스트한다.

// 누르고 있으면 GAUGE_MS 동안 0→1 로 차고, OVERFILL 에 닿으면 자동으로 손을 뗀다
export const GAUGE_MS = 1000
export const OVERFILL = 1.15
export const gaugeAt = (heldMs: number) => heldMs / GAUGE_MS

export type Zone = [lo: number, hi: number]
export type Verdict = 'good' | 'short' | 'long'
export const judge = (v: number, [lo, hi]: Zone): Verdict =>
  v < lo ? 'short' : v > hi ? 'long' : 'good'

// 슈팅: 2K 처럼 꼭대기 근처 좁은 구간에서 떼야 들어간다
export const SHOT_ZONE: Zone = [0.8, 0.92]

// 패스: 동료까지 거리(게이지 0~1 과 같은 축)를 중심으로 ±0.07
export const passDistance = (r = Math.random()) => 0.35 + r * 0.5
export const passZone = (d: number): Zone => [d - 0.07, d + 0.07]

// 드리블: 수비가 기운 반대쪽으로. 라운드마다 반응 시간이 줄고 450ms 에서 멈춘다
export type Side = 'left' | 'right'
export const reactionMs = (round: number) => Math.max(450, 1100 - round * 65)
export const beatDefender = (choice: Side, lean: Side) => choice !== lean

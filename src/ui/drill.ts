// 훈련 미니게임 판정 보조. 진행·연출은 drillEngine.ts
import { clamp } from '../engine/rng'

// 게이지 초록 구간 폭은 해당 능력치에 비례: 20 이면 0.04, 100 이면 0.15
export const zoneWidth = (stat: number) =>
  0.04 + 0.11 * clamp((stat - 20) / 80, 0, 1)

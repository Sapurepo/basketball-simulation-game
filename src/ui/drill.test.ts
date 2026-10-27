import { describe, expect, test } from 'vitest'
import {
  beatDefender,
  gaugeAt,
  judge,
  OVERFILL,
  passDistance,
  passZone,
  reactionMs,
  SHOT_ZONE,
} from './drill'

describe('훈련 판정', () => {
  test('게이지는 누른 시간에 비례해 차고, 구간 안에서 떼야 성공', () => {
    expect(gaugeAt(0)).toBe(0)
    expect(gaugeAt(500)).toBeCloseTo(0.5)
    expect(judge(SHOT_ZONE[0] - 0.01, SHOT_ZONE)).toBe('short')
    expect(judge(SHOT_ZONE[0], SHOT_ZONE)).toBe('good')
    expect(judge(SHOT_ZONE[1], SHOT_ZONE)).toBe('good')
    expect(judge(SHOT_ZONE[1] + 0.01, SHOT_ZONE)).toBe('long')
    expect(judge(OVERFILL, SHOT_ZONE)).toBe('long')
  })

  test('패스 목표 구간은 동료 거리를 중심으로 게이지 안에 있다', () => {
    for (const r of [0, 0.5, 0.999]) {
      const d = passDistance(r)
      const [lo, hi] = passZone(d)
      expect(lo).toBeGreaterThan(0)
      expect(hi).toBeLessThan(1)
      expect(judge(d, [lo, hi])).toBe('good')
    }
  })

  test('드리블: 수비가 기운 반대쪽만 성공, 반응 시간은 줄어들다 바닥에서 멈춘다', () => {
    expect(beatDefender('left', 'right')).toBe(true)
    expect(beatDefender('right', 'right')).toBe(false)
    expect(reactionMs(1)).toBeLessThan(reactionMs(0))
    expect(reactionMs(100)).toBe(reactionMs(99))
    expect(reactionMs(100)).toBeGreaterThan(300)
  })
})

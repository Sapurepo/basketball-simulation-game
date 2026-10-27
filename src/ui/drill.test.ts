import { describe, expect, test } from 'vitest'
import {
  beatDefender,
  GAUGE_MS,
  gaugeAt,
  judge,
  MAX_HOLD_MS,
  passDistance,
  passZone,
  reactionMs,
  shotZone,
  zoneWidth,
} from './drill'

describe('훈련 판정', () => {
  test('게이지는 삼각파로 오르내리고 3왕복이 한계다', () => {
    expect(gaugeAt(0)).toBe(0)
    expect(gaugeAt(GAUGE_MS / 2)).toBeCloseTo(0.5)
    expect(gaugeAt(GAUGE_MS)).toBeCloseTo(1)
    expect(gaugeAt(GAUGE_MS * 1.5)).toBeCloseTo(0.5)
    expect(gaugeAt(GAUGE_MS * 2)).toBeCloseTo(0)
    expect(gaugeAt(GAUGE_MS * 5)).toBeCloseTo(1)
    expect(MAX_HOLD_MS).toBe(GAUGE_MS * 6)
  })

  test('초록 구간 폭은 능력치에 비례하고 구간 안에서 떼야 성공', () => {
    expect(zoneWidth(30)).toBeLessThan(zoneWidth(90))
    expect(zoneWidth(30)).toBeCloseTo(0.054, 2)
    expect(zoneWidth(90)).toBeCloseTo(0.136, 2)
    expect(zoneWidth(0)).toBe(zoneWidth(20))
    expect(zoneWidth(99)).toBeLessThanOrEqual(0.15)
    const zone = shotZone(50)
    expect(judge(zone[0] - 0.01, zone)).toBe('short')
    expect(judge(zone[0], zone)).toBe('good')
    expect(judge(zone[1], zone)).toBe('good')
    expect(judge(zone[1] + 0.01, zone)).toBe('long')
    expect(zone[1]).toBeLessThanOrEqual(1)
  })

  test('패스 목표 구간은 동료 거리를 중심으로 게이지 안에 있다', () => {
    for (const r of [0, 0.5, 0.999])
      for (const stat of [20, 60, 99]) {
        const d = passDistance(r)
        const [lo, hi] = passZone(d, stat)
        expect(lo).toBeGreaterThan(0)
        expect(hi).toBeLessThan(1)
        expect(judge(d, [lo, hi])).toBe('good')
      }
  })

  test('드리블: 수비가 기운 반대쪽만 성공, 반응 시간은 줄어들다 바닥에서 멈춘다', () => {
    expect(beatDefender('left', 'right')).toBe(true)
    expect(beatDefender('right', 'right')).toBe(false)
    expect(reactionMs(0)).toBe(850)
    expect(reactionMs(1)).toBeLessThan(reactionMs(0))
    expect(reactionMs(100)).toBe(reactionMs(99))
    expect(reactionMs(100)).toBe(350)
  })
})

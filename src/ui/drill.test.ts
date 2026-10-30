import { expect, test } from 'vitest'
import { zoneWidth } from './drill'

test('초록 구간 폭은 능력치에 비례하고 20 아래·99 위에서 멈춘다', () => {
  expect(zoneWidth(30)).toBeLessThan(zoneWidth(90))
  expect(zoneWidth(30)).toBeCloseTo(0.054, 2)
  expect(zoneWidth(90)).toBeCloseTo(0.136, 2)
  expect(zoneWidth(0)).toBe(zoneWidth(20))
  expect(zoneWidth(99)).toBeLessThanOrEqual(0.15)
})

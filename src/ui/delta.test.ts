import { describe, expect, it } from 'vitest'
import { ATTR_KEYS } from '../engine/player'
import { emptyLine } from '../engine/sim'
import type { Attributes } from '../engine/types'
import { attrDelta, fmtDelta, statDelta } from './delta'

const attrs = (v: number): Attributes =>
  Object.fromEntries(ATTR_KEYS.map((k) => [k, v])) as Attributes

describe('attrDelta', () => {
  it('막대 표시값(반올림)끼리의 차이. 50→52.3 은 +2, 50→49.2 는 −1, 50.4→50.6 은 +1', () => {
    const before = { ...attrs(50), defense: 50.4 }
    const after = { ...attrs(50), shooting: 52.3, speed: 49.2, defense: 50.6 }
    const d = attrDelta(before, after)
    expect(d.shooting).toBe(2)
    expect(d.speed).toBe(-1)
    expect(d.defense).toBe(1)
    expect(d.rebounding).toBe(0)
  })
})

describe('statDelta', () => {
  it('경기당 평균의 차이. 10경기 150득점 → 20경기 340득점이면 +2.0', () => {
    const prev = { ...emptyLine(), games: 10, pts: 150 }
    const cur = { ...emptyLine(), games: 20, pts: 340 }
    expect(statDelta(prev, cur, 'pts')).toBeCloseTo(2)
  })
  it('어느 쪽이든 경기 수 0이면 undefined', () => {
    expect(statDelta(emptyLine(), { ...emptyLine(), games: 5 }, 'pts')).toBe(
      undefined,
    )
    expect(statDelta({ ...emptyLine(), games: 5 }, emptyLine(), 'pts')).toBe(
      undefined,
    )
  })
})

describe('fmtDelta', () => {
  it('부호와 소수 한 자리. 반올림해 0 이면 빈 문자열', () => {
    expect(fmtDelta(1.26)).toBe('+1.3')
    expect(fmtDelta(-0.8)).toBe('−0.8')
    expect(fmtDelta(0.04)).toBe('')
    expect(fmtDelta(2, 0)).toBe('+2')
    expect(fmtDelta(-1, 0)).toBe('−1')
  })
})

import { describe, expect, test } from 'vitest'
import { build, DRAWN_POSES, H, ROSTER, W, type Spec } from './sprite'

const spec = (over: Partial<Spec> = {}): Spec => ({
  ...ROSTER[0].look,
  jersey: '#23306b',
  trim: '#f2c14e',
  ...over,
})

describe('픽셀 스프라이트 v2', () => {
  test('모든 포즈·프레임이 30×54 격자에 외곽선과 함께 그려진다', () => {
    for (const pose of DRAWN_POSES)
      for (const frame of [0, 1]) {
        const g = build(spec(), pose, frame)
        expect(g).toHaveLength(H)
        for (const row of g) expect(row).toHaveLength(W)
        const flat = g.flat()
        expect(flat).toContain('#16130f')
        expect(flat).toContain('#23306b')
      }
  })

  test('두 프레임은 서로 달라 애니메이션이 된다', () => {
    for (const pose of DRAWN_POSES)
      expect(build(spec(), pose, 0)).not.toEqual(build(spec(), pose, 1))
  })

  test('등번호·헤어·액세서리가 결과를 바꾼다', () => {
    const base = build(spec(), 'idle', 0)
    expect(build(spec({ num: 23 }), 'idle', 0)).not.toEqual(base)
    expect(build(spec({ hairStyle: 'afro' }), 'idle', 0)).not.toEqual(base)
    expect(build(spec({ acc: ['glasses'] }), 'idle', 0)).not.toEqual(base)
  })

  test('상점 치장 8종은 모든 포즈에서 결과를 바꾼다', () => {
    const wear = [
      'cap',
      'shades',
      'chain',
      'headphones',
      'earbuds',
      'goldShoes',
      'undershirt',
      'tights',
    ] as const
    for (const pose of DRAWN_POSES) {
      const base = build(spec({ acc: [] }), pose, 0)
      for (const a of wear)
        expect(build(spec({ acc: [a] }), pose, 0)).not.toEqual(base)
    }
    // 금색 농구화: 신발 자리(x 8, y 42+6) 가 금색 계열
    const g = build(spec({ acc: ['goldShoes'], trim: '#f7f3ea' }), 'guard', 0)
    expect(g.flat()).toContain('#f2c14e')
  })

  test('가드 포즈는 공 없이 서 있다 (수비수·패스 받는 동료)', () => {
    const ball = (g: (string | null)[][]) =>
      g.flat().filter((c) => c === '#e8792e').length
    expect(ball(build(spec(), 'idle', 0))).toBeGreaterThan(0)
    const g = build(spec(), 'guard', 0)
    expect(ball(g)).toBe(0)
    // 두 팔을 내리고 선다: 오른팔(x 22, y 31) 이 그려져 있다
    expect(g[31][22]).not.toBeNull()
    expect(g[31][22]).not.toBe('#16130f')
  })

  test('트로피 포즈는 머리 위 우승컵까지 잘리지 않고 외곽선이 그려진다', () => {
    for (const frame of [0, 1]) {
      // 트림이 금색이 아니어도 금색이 보여야 컵이다
      const g = build(spec({ trim: '#f7f3ea' }), 'trophy', frame)
      expect(g.flat()).toContain('#f2c14e')
      // 컵은 머리카락(스파이키 윗끝 3행)보다 위, 그러나 0행은 외곽선 몫으로 비운다
      const top = g.findIndex((row) => row.some((c) => c && c !== '#16130f'))
      expect(top).toBeGreaterThanOrEqual(1)
      expect(top).toBeLessThanOrEqual(2)
      expect(g[top - 1].some((c) => c === '#16130f')).toBe(true)
    }
  })

  test('로스터 24종은 모두 그릴 수 있다', () => {
    expect(ROSTER).toHaveLength(24)
    for (const r of ROSTER)
      expect(() => build(spec(r.look), 'idle', 0)).not.toThrow()
  })
})

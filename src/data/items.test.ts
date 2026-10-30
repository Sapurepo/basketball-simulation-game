import { describe, expect, test } from 'vitest'
import en from '../i18n/en'
import ja from '../i18n/ja'
import { artSize, hasArt } from '../ui/shopArt'
import { BUFF_CAP, GROWTH_CAP, ITEMS, itemEffects, tierOf } from './items'

describe('상점 아이템', () => {
  test('이름과 소개 문구가 영어·일본어 카탈로그에 있다', () => {
    for (const it of ITEMS)
      for (const k of [it.name, it.line]) {
        expect(en.text[k], k).toBeTruthy()
        expect(ja.text[k], k).toBeTruthy()
      }
  })

  test('무대에 놓이는 아이템은 아트와 기본 자리가 있다', () => {
    const placed = ITEMS.filter(
      (it) => it.kind !== 'pet' && !it.acc && !it.slot,
    )
    expect(placed.length).toBeGreaterThan(0)
    for (const it of placed) {
      expect(hasArt(it.id), it.id).toBe(true)
      expect(it.pos, it.id).toHaveLength(2)
    }
  })

  test('착용 아이템은 카드에 쓸 아트가 있다', () => {
    for (const it of ITEMS.filter((i) => i.acc)) {
      expect(hasArt(it.id), it.id).toBe(true)
      const [w, h] = artSize(it.id as Parameters<typeof artSize>[0])
      expect(w * h).toBeGreaterThan(0)
    }
  })

  test('등급은 가격 구간으로 정한다', () => {
    expect(tierOf(300)).toBe(0)
    expect(tierOf(1000)).toBe(1)
    expect(tierOf(8500)).toBe(1)
    expect(tierOf(1e4)).toBe(2)
    expect(tierOf(1e6)).toBe(3)
  })

  test('모자는 슬롯이라 착용 아트가 있고, 고교 자금(300만)으로 살 수 있는 아이템이 있다', () => {
    const hats = ITEMS.filter((i) => i.slot === 'hat')
    expect(hats.length).toBeGreaterThan(1)
    for (const h of hats) expect(h.acc, h.id).toBeTruthy()
    expect(ITEMS.filter((i) => i.price <= 300).length).toBeGreaterThan(0)
  })

  test('슬롯 아이템은 적용 중인 것만 효과가 있고, 버프·성장은 상한에 걸린다', () => {
    // 벽지 둘을 가져도 적용한 하나만, 모자는 쓴 것만
    const fx = itemEffects({
      items: ['wallKraft', 'wallNews', 'cap', 'beanie'],
      wall: 'wallKraft',
      hat: 'beanie',
    })
    expect(fx.growth).toBe(0.05)
    expect(fx.attrs).toEqual({ athleticism: 1 })
    // 패스 +1 아이템 넷(이어폰·헤드폰·패스 벽·안경)은 +3 에서 멈춘다
    const buff = itemEffects({
      items: ['earbuds', 'headphones', 'passWall', 'glasses'],
    })
    expect(buff.attrs.playmaking).toBe(BUFF_CAP)
    expect(buff.attrs.shooting).toBe(1)
    // 성장 보너스 전부 모아도 +2.0
    const all = itemEffects({ items: ITEMS.map((i) => i.id) })
    expect(all.growth).toBe(GROWTH_CAP)
  })
})

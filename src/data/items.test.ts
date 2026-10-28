import { describe, expect, test } from 'vitest'
import en from '../i18n/en'
import ja from '../i18n/ja'
import { artSize, hasArt } from '../ui/shopArt'
import { ITEMS, tierOf } from './items'

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
    expect(tierOf(8500)).toBe(0)
    expect(tierOf(1e5)).toBe(1)
    expect(tierOf(1e6)).toBe(2)
    expect(tierOf(5e7)).toBe(3)
  })
})

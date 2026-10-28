import { describe, expect, test } from 'vitest'
import en from '../i18n/en'
import ja from '../i18n/ja'
import type { SeasonRecord } from '../engine/types'
import { fanReaction, mood, SNS_TEXT } from './sns'

const rec = (o: Partial<SeasonRecord> = {}): SeasonRecord => ({
  year: 2035,
  age: 24,
  stage: 'KBL',
  team: '창원 LG 세이커스',
  ovr: 75,
  stats: { games: 50, pts: 600 } as SeasonRecord['stats'],
  wins: 30,
  losses: 24,
  result: [],
  awards: [],
  featured: [],
  minutesShare: 0.7,
  ...o,
})

describe('SNS 팬 반응', () => {
  test('상황 우선순위: 우승 > MVP > 부상 > 이적 > 부진 > 호성적', () => {
    expect(mood(rec({ awards: ['NBA 챔피언', 'NBA MVP'] }))).toBe('champ')
    expect(mood(rec({ awards: ['KBL 국내선수 MVP'] }))).toBe('mvp')
    expect(mood(rec({ result: ['부상 결장'] }), rec({ team: 'x' }))).toBe(
      'injury',
    )
    expect(mood(rec(), rec({ team: 'x' }))).toBe('moved')
    expect(mood(rec({ minutesShare: 0.1 }))).toBe('slump')
    expect(
      mood(rec({ stats: { games: 10, pts: 250 } as SeasonRecord['stats'] })),
    ).toBe('hot')
    expect(mood(rec())).toBe('base')
  })

  test('같은 시즌은 같은 반응, NBA 좋아요가 KBL 보다 많다', () => {
    const a = fanReaction('김농구', rec())
    expect(fanReaction('김농구', rec())).toEqual(a)
    expect(a.comments).toHaveLength(3)
    expect(fanReaction('김농구', rec({ stage: 'NBA' })).likes).toBeGreaterThan(
      a.likes * 5,
    )
  })

  test('댓글 템플릿은 전부 영어·일본어로 번역돼 있다', () => {
    const all = Object.values(SNS_TEXT).flat()
    expect(all.filter((k) => !(k in en.text))).toEqual([])
    expect(all.filter((k) => !(k in ja.text))).toEqual([])
  })
})

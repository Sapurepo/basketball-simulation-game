import { expect, test } from 'vitest'
import {
  OUTDATED_CLIENT,
  periodStart,
  toHallPayload,
  USD_TO_MANWON,
  validateHall,
} from './hallEntry'
import { playCareer } from './testBot'
import type { Accessory } from './types'

const career = () => ({
  ...playCareer(7),
  careerId: '123e4567-e89b-42d3-a456-426614174000',
})

test('은퇴 커리어의 등록 데이터는 서버 검증을 통과한다', () => {
  const p = toHallPayload(career())
  expect(validateHall(JSON.parse(JSON.stringify(p)))).toEqual(p)
})

test('조작된 값과 부적절한 이름은 거부한다', () => {
  const s = career()
  const p = toHallPayload(s)
  const bad = (patch: object) => validateHall({ ...p, ...patch })
  expect(bad({ peakOvr: 120 })).toBeTypeOf('string')
  expect(bad({ fmvp: p.seasons + 1 })).toBeTypeOf('string')
  expect(bad({ kbl: 1 })).toBeTypeOf('string')
  expect(bad({ kblFmvp: p.seasons + 1 })).toBeTypeOf('string')
  // 1.4.0 전 번들(통산 기록 6개 필드 없음)은 새로고침 안내를 받는다
  const { kbl, nba, earnings, minutes, pts, ast, kblFmvp, ...old } = p
  void [kbl, nba, earnings, minutes, pts, ast]
  expect(validateHall(old)).toBe(OUTDATED_CLIENT)
  // KBL 챔결 MVP 정렬 전 번들(kblFmvp 없음)도 마찬가지
  expect(validateHall({ ...old, kbl, nba, earnings, minutes, pts, ast })).toBe(
    OUTDATED_CLIENT,
  )
  expect(p.kblFmvp).toBe(
    s.history.filter((h) => h.awards.includes('KBL 챔피언결정전 MVP')).length,
  )
  void kblFmvp
  expect(bad({ earnings: -1 })).toBeTypeOf('string')
  expect(bad({ pts: p.seasons * 6000 + 1 })).toBeTypeOf('string')
  expect(bad({ id: 'x' })).toBeTypeOf('string')
  expect(bad({ name: '' })).toBeTypeOf('string')
  expect(bad({ name: '열한글자이름입니다요요' })).toBeTypeOf('string')
  expect(bad({ name: '씨 발' })).toBeTypeOf('string')
  expect(bad({ look: { ...p.look, hairStyle: '<script>' } })).toBeTypeOf(
    'string',
  )
  // 제어 문자와 연속 공백은 정리해서 받는다
  expect(validateHall({ ...p, name: ' 김\u0000코트  선수 ' })).toMatchObject({
    name: '김코트 선수',
  })
})

test('통산 기록은 정규시즌 합, 수입은 달러를 만원으로 환산해 더한다', () => {
  const s = career()
  const p = toHallPayload(s)
  expect(p.pts).toBe(s.history.reduce((n, h) => n + h.stats.pts, 0))
  expect(p.earnings).toBe(
    s.earnings.KRW + Math.round(s.earnings.USD * USD_TO_MANWON),
  )
  expect(p.kbl || p.nba).toBe(
    s.history.some((h) => h.stage === 'KBL' || h.stage === 'NBA'),
  )
})

test('착용 가능한 액세서리를 전부 단 외형도 통과한다 (1.4.0 모자 포함)', () => {
  // 봇 커리어는 외형이 없어 실제 신고된 페이로드의 외형을 쓴다. visor 때문에 '외형 오류'가 났었다
  const acc: Accessory[] = [
    'bandaid',
    'wrist',
    'headband',
    'knee',
    'glasses',
    'earbuds',
    'undershirt',
    'tights',
    'goldShoes',
    'chain',
    'sleeve',
    'headphones',
    'visor',
    'shades',
    'cap',
    'beanie',
    'bucketHat',
    'truckerCap',
    'fedora',
  ]
  const look = {
    skin: 2,
    hair: '#2A2324',
    hairStyle: 'buzz' as const,
    face: 'fierce' as const,
    acc,
    num: 69,
  }
  const p = { ...toHallPayload(career()), look }
  expect(validateHall(p)).toEqual(p)
  expect(validateHall({ ...p, look: { ...look, acc: ['crown'] } })).toBe(
    '외형 오류',
  )
})

test('기간 시작은 KST 기준 자정·월요일·1일', () => {
  // 2026-10-30(금) 10:00 KST = 01:00 UTC
  const now = Date.UTC(2026, 9, 30, 1)
  const kst = (d: number) => Date.UTC(2026, 9, d) - 9 * 3_600_000
  expect(periodStart('all', now)).toBe(0)
  expect(periodStart('day', now)).toBe(kst(30))
  expect(periodStart('week', now)).toBe(kst(26))
  expect(periodStart('month', now)).toBe(kst(1))
  // KST 로는 31일 00:30 이지만 UTC 로는 아직 30일: KST 날짜를 따른다
  expect(periodStart('day', Date.UTC(2026, 9, 30, 15, 30))).toBe(kst(31))
})

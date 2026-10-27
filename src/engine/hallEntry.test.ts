import { expect, test } from 'vitest'
import { toHallPayload, validateHall } from './hallEntry'
import { playCareer } from './testBot'

const career = () => ({
  ...playCareer(7),
  careerId: '123e4567-e89b-42d3-a456-426614174000',
})

test('은퇴 커리어의 등록 데이터는 서버 검증을 통과한다', () => {
  const p = toHallPayload(career())
  expect(validateHall(JSON.parse(JSON.stringify(p)))).toEqual(p)
})

test('조작된 값과 부적절한 이름은 거부한다', () => {
  const p = toHallPayload(career())
  const bad = (patch: object) => validateHall({ ...p, ...patch })
  expect(bad({ peakOvr: 120 })).toBeTypeOf('string')
  expect(bad({ fmvp: p.seasons + 1 })).toBeTypeOf('string')
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

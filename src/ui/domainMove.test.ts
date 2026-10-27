import { expect, test } from 'vitest'
import { pack, unpack } from './domainMove'

test('이사 데이터는 압축해 URL 안전 문자로 묶고 그대로 풀린다', async () => {
  const data = {
    save: JSON.stringify({ name: '김코트', h: 'x'.repeat(50_000) }),
    hall: '[]',
  }
  const text = await pack(data)
  expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
  // 반복이 많은 세이브는 크게 줄어든다
  expect(text.length).toBeLessThan(2_000)
  expect(await unpack(text)).toEqual(data)
})

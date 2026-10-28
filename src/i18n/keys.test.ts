import { describe, expect, it } from 'vitest'
import en from './en'
import ja from './ja'

// 소스의 tr('…') 리터럴 키가 카탈로그에 전부 있는지 (vite 의 raw import 로 소스를 읽는다)
const files = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function literalKeys() {
  const keys = new Set<string>()
  for (const [path, src] of Object.entries(files)) {
    if (path.includes('.test.') || path.includes('/i18n/')) continue
    for (const m of src.matchAll(/\btr\(\s*'((?:[^'\\]|\\.)*)'/g))
      keys.add(m[1])
    for (const m of src.matchAll(/\btr\(\s*\n\s*'((?:[^'\\]|\\.)*)'/g))
      keys.add(m[1])
  }
  return [...keys].filter((k) => /[가-힣]/.test(k))
}

describe('UI 문자열 카탈로그', () => {
  const keys = literalKeys()
  it('소스의 tr 리터럴이 전부 있다', () => {
    expect(keys.length).toBeGreaterThan(50)
    expect(keys.filter((k) => !(k in en.text))).toEqual([])
    expect(keys.filter((k) => !(k in ja.text))).toEqual([])
  })
})

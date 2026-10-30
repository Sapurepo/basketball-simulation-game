import { describe, expect, test } from 'vitest'
import en from '../i18n/en'
import ja from '../i18n/ja'
import { CHANGELOG_DOC } from './changelog'
import { GUIDE } from './guide'
import type { Catalog } from '../i18n'
import type { LegalDoc } from './legal'
import { ODDS } from './odds'

// 번역 문서(translated)의 한국어 문장·표 칸이 카탈로그에 전부 있는지. 숫자만 있는 칸은 번역하지 않는다
function koreanStrings(doc: LegalDoc) {
  const out = new Set<string>()
  const add = (s: string) => {
    if (/[가-힣]/.test(s)) out.add(s)
  }
  add(doc.title)
  if (doc.subtitle) add(doc.subtitle)
  add(doc.intro)
  for (const s of doc.sections) {
    add(s.title)
    for (const b of s.blocks) {
      if (typeof b === 'string') add(b)
      else if ('list' in b) b.list.forEach(add)
      else b.table.forEach((r) => r.forEach(add))
    }
  }
  return [...out]
}

const missing = (c: Catalog, keys: string[]) =>
  keys.filter((k) => !(k in c.text) && !c.patterns.some(([re]) => re.test(k)))

describe('번역 문서 카탈로그', () => {
  for (const doc of [ODDS, GUIDE, CHANGELOG_DOC]) {
    test(`${doc.title}: 영어·일본어 번역이 전부 있다`, () => {
      expect(doc.translated).toBe(true)
      const keys = koreanStrings(doc)
      expect(keys.length).toBeGreaterThan(10)
      expect(missing(en, keys)).toEqual([])
      expect(missing(ja, keys)).toEqual([])
    })
  }
})

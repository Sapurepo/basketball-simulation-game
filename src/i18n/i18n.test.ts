import { beforeAll, describe, expect, it, vi } from 'vitest'
import { advanceSeason, newGame, resolveEvent } from '../engine/game'
import { createPlayer } from '../engine/player'
import { Rng } from '../engine/rng'
import { botChoice } from '../engine/testBot'
import type { GameState } from '../engine/types'
import { generatePbp } from '../engine/commentary'
import { ROSTER } from '../ui/sprite'
import { formatMoney } from '../engine/events'
import { ko, loadLang, setLang, type Text, tr, tx } from './index'

// 카탈로그를 미리 받아 두면 setLang 이 바로 바뀐다
beforeAll(() => Promise.all([loadLang('en'), loadLang('ja')]))

// 봇 커리어가 만들어 내는 모든 엔진 문장(수상·결과·라벨·이벤트·중계)을 모은다
function collect(n: number) {
  const keys = new Set<string>()
  const add = (t: Text | undefined) => {
    if (t === undefined) return
    if (typeof t === 'string') return void keys.add(t)
    keys.add(t.k)
    for (const v of Object.values(t.v ?? {})) if (typeof v === 'object') add(v)
  }
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const
  for (let i = 0; i < n; i++) {
    const rng = new Rng(i * 31 + 7)
    const p = createPlayer(rng, '테스트', positions[i % 5], 'n/a')
    let s: GameState = newGame(rng.state, p, 'yongsan')
    for (let k = 0; k < 400 && s.stage !== 'RETIRED'; k++) {
      for (const ev of s.events) {
        add(ev.title)
        add(ev.body)
        for (const o of ev.options) {
          add(o.label)
          add(o.desc)
        }
      }
      s = s.events.length ? resolveEvent(s, botChoice(s)) : advanceSeason(s)
    }
    for (const h of s.history) {
      for (const a of h.awards) keys.add(a)
      for (const r of h.result) keys.add(r)
      for (const g of h.featured) {
        keys.add(g.label)
        for (const l of g.pbp) add(l)
      }
      keys.add(h.team)
    }
    for (const h of s.honors) keys.add(h.name)
    keys.add(s.teamName)
  }
  return keys
}

describe('번역 커버리지', () => {
  const keys = collect(120)
  const untranslated = (lang: 'en' | 'ja') => {
    setLang(lang)
    const miss = [...keys].filter((k) => /[가-힣]/.test(k) && tr(k) === k)
    setLang('ko')
    return miss
  }
  it('엔진이 만드는 문장은 전부 영어·일본어로 번역된다', () => {
    const en = untranslated('en')
    const ja = untranslated('ja')
    expect(en).toEqual([])
    expect(ja).toEqual([])
  })
  it('변수 치환과 ko 렌더', () => {
    const t: Text = {
      k: '{team}로 복귀합니다. {when}',
      v: { team: 'X', when: '조기 전역해 바로 시즌을 준비합니다.' },
    }
    expect(ko(t)).toBe('X로 복귀합니다. 조기 전역해 바로 시즌을 준비합니다.')
    expect(tx(t)).toBe(ko(t))
  })
})

describe('선수 이름은 번역·치환하지 않는다', () => {
  const box = {
    games: 1,
    minutes: 30,
    pts: 21,
    reb: 5,
    ast: 4,
    stl: 1,
    blk: 1,
    fgm: 8,
    fga: 15,
    tpm: 2,
    tpa: 5,
    ftm: 3,
    fta: 4,
  }
  it.each(['{text}', '{pts}', '슈터', '$&'])('이름 %s', (name) => {
    setLang('en')
    const lines = generatePbp(
      new Rng(3),
      name,
      '서울 SK 나이츠',
      '부산 KCC 이지스',
      box,
      80,
      75,
      10,
    )
    const out = lines.map(tx)
    setLang('ko')
    // 이름이 원문 그대로 들어가고, 팀명은 번역된다
    expect(out.at(-1)).toContain(`${name}: 21 pts`)
    expect(out[0]).toBe('Seoul SK Knights vs Busan KCC Egis — tip-off!')
    expect(out.filter((l) => l.includes(name)).length).toBeGreaterThan(3)
  })
})

describe('브라우저 로드', () => {
  it('document 가 있어도 모듈 로드 중 오류가 없고 lang·title 을 맞춘다', async () => {
    const doc = { documentElement: { lang: '' }, title: '' }
    vi.stubGlobal('document', doc)
    vi.resetModules()
    await import('./index')
    vi.unstubAllGlobals()
    expect(doc.documentElement.lang).toMatch(/^(ko|en|ja)$/)
    expect(doc.title).not.toBe('')
  })
})

describe('금액 표기', () => {
  it.each([
    [1, '₩10K'],
    [9999, '₩100.0M'],
    [99_999, '₩1.0B'],
    [100_000, '₩1.0B'],
    [99_999_999, '₩1.0T'],
  ])('en %d만원 → %s', (amount, out) => {
    setLang('en')
    const s = formatMoney(amount, 'KRW')
    setLang('ko')
    expect(s).toBe(out)
  })
  it.each([
    [8500, '₩8500万'],
    [180_000, '₩18億'],
    [125_000, '₩12.5億'],
    [130_000_000, '₩1.3兆'],
  ])('ja %d만원 → %s', (amount, out) => {
    setLang('ja')
    const s = formatMoney(amount, 'KRW')
    setLang('ko')
    expect(s).toBe(out)
  })
})

describe('아바타 캐릭터 이름', () => {
  it.each(['en', 'ja'] as const)('%s 로 표기된다', (lang) => {
    setLang(lang)
    const miss = ROSTER.map((r) => r.name).filter((n) => tr(n) === n)
    setLang('ko')
    expect(miss).toEqual([])
  })
})

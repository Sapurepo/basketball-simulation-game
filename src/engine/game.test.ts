import { describe, expect, test } from 'vitest'
import { generatePbp } from './commentary'
import { advanceSeason, newGame, resolveEvent } from './game'
import { createPlayer, START_TOTAL } from './player'
import { Rng } from './rng'
import { parseSave } from './save'
import { playCareer } from './testBot'

const careers = Array.from({ length: 200 }, (_, i) =>
  playCareer(i * 7919 + 1, (['PG', 'SG', 'SF', 'PF', 'C'] as const)[i % 5]),
)

describe('커리어 전체 진행', () => {
  test('같은 시드는 같은 커리어를 만든다', () => {
    expect(JSON.stringify(playCareer(42))).toBe(JSON.stringify(playCareer(42)))
  })

  test('모든 커리어가 은퇴로 끝나고 기록이 정상 범위다', () => {
    for (const s of careers) {
      expect(s.stage).toBe('RETIRED')
      expect(s.history.length).toBeGreaterThanOrEqual(10)
      s.history.forEach((h, i) => {
        expect(h.age).toBe(16 + i)
        for (const v of Object.values(h.stats))
          expect(Number.isFinite(v)).toBe(true)
        expect(h.stats.fgm).toBeLessThanOrEqual(h.stats.fga)
        for (const g of h.featured) {
          expect(g.box.pts).toBeLessThanOrEqual(g.myScore)
          expect(g.myScore).not.toBe(g.oppScore)
          expect(g.pbp.at(-1)).toContain(`${g.myScore} : ${g.oppScore}`)
        }
      })
    }
  })

  test('NBA 진출은 가능하지만 드물다', () => {
    const nba = careers.filter((s) => s.history.some((h) => h.stage === 'NBA'))
    expect(nba.length).toBeGreaterThan(0)
    expect(nba.length / careers.length).toBeLessThan(0.35)
  })
})

test('선수 생성 시 능력치 합계는 기준값 근처다', () => {
  const p = createPlayer(new Rng(1), 'a', 'PG', '플레이메이커')
  const total = Object.values(p.attrs).reduce((a, b) => a + b, 0)
  expect(Math.abs(total - START_TOTAL)).toBeLessThanOrEqual(3)
})

test('중계 로그의 최종 스코어가 박스스코어와 일치한다', () => {
  const rng = new Rng(7)
  const box = {
    games: 1,
    minutes: 30,
    pts: 21,
    reb: 5,
    ast: 4,
    stl: 1,
    blk: 0,
    fgm: 8,
    fga: 15,
    tpm: 2,
    tpa: 5,
    ftm: 3,
    fta: 4,
  }
  const lines = generatePbp(rng, '홍길동', 'A', 'B', box, 80, 75, 10)
  const last = lines.filter((l) => l.startsWith('['))
  expect(last.at(-1)).toMatch(/\(\d+-\d+\)/)
  expect(lines).toContain('— 4쿼터 종료 (80-75) —')
})

test('이벤트가 남아 있으면 시즌을 진행하지 않는다', () => {
  const rng = new Rng(3)
  let s = newGame(3, createPlayer(rng, 'a', 'C', '리바운더'), 'yongsan')
  s = advanceSeason(s)
  expect(s.events.length).toBeGreaterThan(0)
  expect(advanceSeason(s)).toBe(s)
  const next = resolveEvent(s, s.events[0].options[0].id)
  expect(next.events.length).toBeLessThan(s.events.length + 2)
})

test('저장 파일 검증', () => {
  expect(() => parseSave('{"foo":1}')).toThrow()
  const s = careers[0]
  expect(parseSave(JSON.stringify(s)).player.name).toBe(s.player.name)
})

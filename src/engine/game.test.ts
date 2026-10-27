import { describe, expect, test } from 'vitest'
import { generatePbp } from './commentary'
import { isDrill } from './events'
import { buffed, itemById, itemEffects } from '../data/items'
import {
  advanceSeason,
  availableDrills,
  buyItem,
  newGame,
  playDrill,
  resolveEvent,
  START_CASH,
} from './game'
import {
  createPlayer,
  overall,
  START_TOTAL,
  WEIGHT_RANGE,
  weightSpeedMod,
} from './player'
import { Rng } from './rng'
import { migrateLook, parseSave } from './save'
import type { Look } from './types'
import { botChoice, playCareer } from './testBot'

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

describe('병역', () => {
  test('29세 이상 프로 선수는 병역을 마쳤거나 면제다', () => {
    for (const s of careers) {
      if (
        s.history.some(
          (h) => h.age >= 29 && (h.stage === 'KBL' || h.stage === 'NBA'),
        )
      ) {
        expect(['done', 'exempt']).toContain(s.service.status)
      }
    }
  })

  test('상무 전역 후 KBL 원소속팀으로 시즌 중반에 복귀한다', () => {
    const cases = careers.flatMap((s) =>
      s.history.flatMap((h, i) => {
        const before = s.history[i - 1]
        const after = s.history[i + 1]
        return h.stage === 'MILITARY' &&
          before?.stage === 'KBL' &&
          after?.stage === 'KBL'
          ? [{ before, after }]
          : []
      }),
    )
    expect(cases.length).toBeGreaterThan(0)
    for (const { before, after } of cases) {
      expect(after.team).toBe(before.team)
      expect(after.result).toContain('전역 후 시즌 중반 합류')
    }
  })

  test('아시안게임 금메달이면 예술체육요원으로 면제된다', () => {
    const gold = careers.filter((s) =>
      s.honors.some((h) => h.name === '아시안게임 금메달'),
    )
    expect(gold.length).toBeGreaterThan(0)
    for (const s of gold) {
      const goldYear = s.honors.find(
        (h) => h.name === '아시안게임 금메달',
      )!.year
      const servedBefore = s.history.some(
        (h) => h.stage === 'MILITARY' && h.year < goldYear,
      )
      expect(s.service.status).toBe(servedBefore ? 'done' : 'exempt')
    }
  })
})

test('선수 생성 시 능력치 합계는 정확히 기준값이고 몸무게가 스피드를 보정한다', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const p = createPlayer(new Rng(seed), 'a', 'PG', '플레이메이커')
    const total = Object.values(p.attrs).reduce((a, b) => a + b, 0)
    expect(total).toBe(START_TOTAL)
    expect(p.attrs.speed).toBeGreaterThan(0)
    expect(p.weight).toBeGreaterThanOrEqual(WEIGHT_RANGE[0])
    expect(p.weight).toBeLessThanOrEqual(WEIGHT_RANGE[1])
  }
  expect(weightSpeedMod(190, 90)).toBe(0)
  expect(weightSpeedMod(190, 120)).toBe(-10)
  expect(weightSpeedMod(190, 60)).toBe(4)
  expect(weightSpeedMod(190, 95)).toBe(-2)
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

test('이전 외형(팔레트 인덱스)은 v2 외형으로 바뀐다', () => {
  const s = structuredClone(careers[0])
  const legacy = { skin: 2, hair: 1, hairStyle: 3, accessory: 1 }
  ;(s.player as { look: unknown }).look = legacy
  expect(parseSave(JSON.stringify(s)).player.look).toEqual({
    skin: 2,
    hair: '#5a3a22',
    hairStyle: 'afro',
    face: 'fierce',
    acc: ['headband'],
    num: expect.any(Number),
  })
  // 선택 필드가 없던 더 오래된 외형, 외형이 아예 없던 선수
  ;(s.player as { look: unknown }).look = { skin: 0, hair: 0 }
  expect(parseSave(JSON.stringify(s)).player.look).toMatchObject({
    hairStyle: 'crew',
    acc: [],
  })
  delete s.player.look
  expect(parseSave(JSON.stringify(s)).player.look).toBeUndefined()
  // v2 외형은 그대로
  const v2 = migrateLook(legacy, '강민준')
  expect(migrateLook(v2, '강민준')).toBe(v2)
  expect(v2.num).toBe(migrateLook(legacy, '강민준').num)
})

describe('훈련 미니게임', () => {
  const base = () => {
    const rng = new Rng(11)
    return newGame(11, createPlayer(rng, 'a', 'PG', '플레이메이커'), 'yongsan')
  }

  test.each([
    ['shootout', 'shooting'],
    ['passDrill', 'playmaking'],
    ['dribbleDrill', 'finishing'],
  ] as const)('%s 는 시즌마다 한 번, %s 를 최대 +1 올린다', (kind, attr) => {
    const s = base()
    const before = s.player.attrs[attr]
    expect(availableDrills(s)).toContain(kind)
    const done = playDrill(s, kind, 'made:9')
    expect(done.player.attrs[attr]).toBe(Math.min(99, before + 1))
    expect(playDrill(s, kind, 'made:6').player.attrs[attr]).toBe(
      Math.min(99, before + 1),
    )
    expect(playDrill(s, kind, 'made:5').player.attrs[attr]).toBe(before)
    expect(() => playDrill(s, kind, 'auto')).not.toThrow()
    // 같은 오프시즌에는 다시 못 하고, 시즌을 진행하면 다시 열린다
    expect(availableDrills(done)).not.toContain(kind)
    expect(playDrill(done, kind, 'made:9')).toBe(done)
    expect(availableDrills(advanceSeason(done))).toContain(kind)
  })

  test('최고치(99)면 성공해도 오르지 않고, 안내도 실패가 아닌 최고치로 나온다', () => {
    const s = base()
    s.player.attrs.playmaking = 99
    s.events = [{ kind: 'passDrill', title: '', body: '', options: [] }]
    const next = resolveEvent(s, 'made:9')
    expect(next.player.attrs.playmaking).toBe(99)
    expect(next.events[0].body).toBe('패스 이미 최고치예요')
    expect(resolveEvent(s, 'made:5').events[0].body).toBe(
      '아쉽지만 감각은 익혔습니다.',
    )
  })

  test('은퇴하면 훈련이 없다', () => {
    expect(availableDrills({ ...base(), stage: 'RETIRED' })).toEqual([])
  })

  test('오프시즌에 훈련 이벤트가 더는 생기지 않는다', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = new Rng(seed)
      let s = newGame(seed, createPlayer(rng, 'a', 'SF', 'n/a'), 'yongsan')
      for (let i = 0; i < 300 && s.stage !== 'RETIRED'; i++) {
        expect(s.events.some((e) => isDrill(e.kind))).toBe(false)
        s = s.events.length ? resolveEvent(s, botChoice(s)) : advanceSeason(s)
      }
    }
  })

  test('이전 저장 파일에 남은 훈련 이벤트도 같은 기준으로 처리한다', () => {
    const s = {
      ...base(),
      events: [{ kind: 'passDrill', title: '', body: '', options: [] }],
    }
    const before = s.player.attrs.playmaking
    const next = resolveEvent(s, 'made:9')
    expect(next.player.attrs.playmaking).toBe(Math.min(99, before + 1))
    expect(next.events[0].title).toBe('10개 중 9개 성공')
  })
})

describe('상점과 자금', () => {
  const look = {
    skin: 0,
    hair: '#000000',
    hairStyle: 'crew' as const,
    face: 'calm' as const,
    acc: [] as Look['acc'],
    num: 7,
  }
  const base = () => {
    const rng = new Rng(5)
    const p = { ...createPlayer(rng, 'a', 'SG', '슈터'), look }
    return newGame(5, p, 'yongsan')
  }

  const price = (id: string) => itemById(id)!.price

  test('새 게임은 시작 자금으로 시작하고, 구입하면 자금이 줄고 치장이 입혀진다', () => {
    expect(base().cash).toBe(START_CASH)
    // 고교 자금으로는 가장 싼 스냅백도 못 산다
    expect(buyItem(base(), 'cap')).toEqual(base())
    const s = { ...base(), cash: price('cap') + 5 }
    const bought = buyItem(s, 'cap')
    expect(bought.cash).toBe(5)
    expect(bought.items).toEqual(['cap'])
    expect(bought.player.look?.acc).toContain('cap')
    // 원본은 그대로, 중복·자금 부족은 거부
    expect(s.items).toEqual([])
    expect(buyItem(bought, 'cap')).toBe(bought)
    expect(buyItem(s, 'car')).toBe(s)
    expect(buyItem(s, 'nope')).toBe(s)
  })

  test('아이템 효과는 합산되고 99 를 넘지 않는다', () => {
    const fx = itemEffects(['chain', 'headphones', 'pomeranian', 'nope'])
    expect(fx.attrs).toEqual({
      finishing: 2,
      rebounding: 1,
      shooting: 1,
      playmaking: 1,
    })
    expect(fx.growth).toBeCloseTo(0.1)
    const b = buffed({ ...base().player.attrs, shooting: 99 }, fx.attrs)
    expect(b.shooting).toBe(99)
    expect(b.finishing).toBe(base().player.attrs.finishing + 2)
  })

  test('시즌을 진행하면 고교 용돈이 쌓이고 버프는 시즌 기록에만 반영된다', () => {
    const s = buyItem({ ...base(), cash: price('chain') }, 'chain')
    const next = advanceSeason(s)
    expect(next.cash).toBe(100)
    expect(next.items).toEqual(['chain'])
    // 시즌 OVR 은 버프가 얹힌 값, 선수 능력치에는 남지 않는다 (성장분만 반영)
    expect(next.history[0].ovr).toBeGreaterThanOrEqual(overall(s.player))
    for (const v of Object.values(next.player.attrs)) {
      expect(v).toBeGreaterThanOrEqual(20)
      expect(v).toBeLessThanOrEqual(99)
    }
  })

  test('이전 저장 파일은 스피드·몸무게·자금을 기본값으로 채운다', () => {
    // JSON 왕복으로 느슨한 객체를 만들어 새 필드를 지운다
    const raw = JSON.parse(JSON.stringify(base()))
    delete raw.cash
    delete raw.items
    delete raw.player.weight
    delete raw.player.attrs.speed
    const loaded = parseSave(JSON.stringify(raw))
    expect(loaded.player.attrs.speed).toBe(loaded.player.attrs.athleticism)
    expect(loaded.player.weight).toBe(loaded.player.height - 100)
    expect(loaded.cash).toBe(START_CASH)
    expect(loaded.items).toEqual([])
  })

  test('벽지는 사면 바로 적용되고, 이전 저장 파일의 강아지는 포메라니안이 된다', () => {
    const rich = { ...base(), cash: price('wallStripe') + price('floorCheck') }
    const s = buyItem(buyItem(rich, 'wallStripe'), 'floorCheck')
    expect([s.wall, s.floor]).toEqual(['wallStripe', 'floorCheck'])
    const raw = JSON.parse(JSON.stringify(s))
    raw.items = ['dog', 'cap']
    expect(parseSave(JSON.stringify(raw)).items).toEqual(['pomeranian', 'cap'])
  })
})

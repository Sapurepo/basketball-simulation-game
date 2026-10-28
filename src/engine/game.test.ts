import { describe, expect, test } from 'vitest'
import { generatePbp } from './commentary'
import { buildOffseason, isDrill } from './events'
import { buffed, itemById, itemEffects } from '../data/items'
import {
  advanceSeason,
  availableDrills,
  buyItem,
  newGame,
  playDrill,
  resolveEvent,
  START_CASH,
  toggleAccessory,
} from './game'
import {
  createPlayer,
  grow,
  overall,
  START_TOTAL,
  WEIGHT_RANGE,
  weightSpeedMod,
} from './player'
import { Rng } from './rng'
import { migrateLook, parseSave } from './save'
import type { GameState, Look, Player } from './types'
import { botChoice, playCareer } from './testBot'
import { ko } from '../i18n'

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
          expect(ko(g.pbp.at(-1)!)).toContain(`${g.myScore} : ${g.oppScore}`)
        }
      })
    }
  })

  test('NBA 진출은 가능하지만 드물다', () => {
    const nba = careers.filter((s) => s.history.some((h) => h.stage === 'NBA'))
    expect(nba.length).toBeGreaterThan(0)
    // 2026-10-28 미국 대학 경로·은퇴 45세 이후 봇 600개 실측 35.3%
    expect(nba.length / careers.length).toBeLessThan(0.45)
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
  const lines = generatePbp(rng, '홍길동', 'A', 'B', box, 80, 75, 10).map(ko)
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
    expect(ko(next.events[0].body)).toBe('패스 이미 최고치예요')
    expect(ko(resolveEvent(s, 'made:5').events[0].body)).toBe(
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
    expect(ko(next.events[0].title)).toBe('10개 중 9개 성공')
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

  test('치장은 벗었다 다시 입을 수 있고, 보유와 버프는 그대로다', () => {
    const s = buyItem({ ...base(), cash: price('cap') }, 'cap')
    const off = toggleAccessory(s, 'cap')
    expect(off.player.look?.acc).not.toContain('cap')
    expect(off.items).toEqual(['cap'])
    expect(itemEffects(off.items).attrs.defense).toBe(1)
    expect(toggleAccessory(off, 'cap').player.look?.acc).toContain('cap')
    // 보유하지 않았거나 치장이 아닌 아이템은 그대로
    expect(toggleAccessory(base(), 'cap')).toEqual(base())
    expect(toggleAccessory(s, 'car')).toBe(s)
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

describe('노쇠 완화와 은퇴 45세', () => {
  const mk = (age: number) => {
    const rng = new Rng(3)
    const p = createPlayer(rng, 'a', 'SF', '스윙맨')
    p.growthType = 'normal'
    p.potential = 70
    for (const k of Object.keys(p.attrs) as (keyof typeof p.attrs)[])
      p.attrs[k] = 70
    const s = newGame(3, p, 'yongsan')
    return { ...s, age }
  }

  test('36세 보통형은 완만히 떨어지고 38세부터 급노쇠다', () => {
    // overall() 은 반올림이라 능력치 평균으로 잰다
    const mean = (a: Record<string, number>) =>
      Object.values(a).reduce((x, y) => x + y, 0) / Object.keys(a).length
    const g = (age: number) => {
      const s = mk(age)
      const before = mean(s.player.attrs)
      grow(new Rng(1), s.player, age, 0.8, undefined, 0)
      return mean(s.player.attrs) - before
    }
    expect(g(36)).toBeGreaterThanOrEqual(-1)
    expect(g(36)).toBeLessThanOrEqual(0)
    // 38세는 -(1.0)×0.8~1.2 에 운동능력·스피드 -1 이 더해진다
    expect(g(38)).toBeLessThan(-1)
  })

  test('은퇴 고민은 36세부터, 강제 은퇴는 45세', () => {
    const kinds = (age: number) =>
      buildOffseason(new Rng(1), {
        ...mk(age),
        stage: 'KBL',
        service: { status: 'exempt' },
        contract: {
          teamId: 'x',
          teamName: 'x',
          salary: 1,
          currency: 'KRW',
          yearsLeft: 2,
        },
      }).map((e) => e.kind)
    expect(kinds(35)).not.toContain('retire')
    expect(kinds(36)).toContain('retire')
    expect(kinds(44)).not.toContain('forceRetire')
    expect(kinds(45)).toEqual(['forceRetire'])
  })
})

describe('미국 대학 경로', () => {
  const mk = (ovr: number) => {
    const rng = new Rng(9)
    const p = createPlayer(rng, 'a', 'SG', '슈터')
    for (const k of Object.keys(p.attrs) as (keyof typeof p.attrs)[])
      p.attrs[k] = ovr
    return newGame(9, p, 'yongsan')
  }
  const ids = (s: ReturnType<typeof mk>) =>
    buildOffseason(new Rng(1), s).flatMap((e) => e.options.map((o) => o.id))

  test('고교 3학년 OVR 64 이상이면 미국 대학 제안이 2개 온다', () => {
    const us = (ovr: number) =>
      ids({ ...mk(ovr), stageYear: 3 }).filter((id) => id.startsWith('us:'))
    expect(us(64)).toHaveLength(2)
    expect(us(60)).toHaveLength(0)
  })

  test('NBA 드래프트 선택지는 미국 대학 OVR 78 이상에서만 열린다', () => {
    const college = (ovr: number, teamId: string) => ({
      ...mk(ovr),
      age: 20,
      stage: 'COLLEGE' as const,
      stageYear: 2,
      teamId,
    })
    expect(ids(college(78, 'duke'))).toContain('nba')
    expect(ids(college(77, 'duke'))).not.toContain('nba')
    expect(ids(college(90, 'korea'))).not.toContain('nba')
  })

  test('미국 대학 출신은 드래프트 점수 +4: 20세 195cm OVR 78 이 100번 중 60번 이상 지명된다', () => {
    // 보너스 없으면 Φ((78+1.2−82)/2) ≈ 8%, 있으면 Φ(0.6) ≈ 73%
    let drafted = 0
    for (let seed = 1; seed <= 100; seed++) {
      const s = {
        ...mk(78),
        rng: seed,
        age: 20,
        stage: 'COLLEGE' as const,
        stageYear: 2,
        teamId: 'duke',
        teamName: '듀크대',
        events: [
          {
            kind: 'collegeChoice',
            title: '',
            body: '',
            options: [{ id: 'nba', label: '' }],
          },
        ],
      }
      s.player.height = 195
      if (resolveEvent(s, 'nba').stage === 'NBA') drafted++
    }
    expect(drafted).toBeGreaterThanOrEqual(60)
  })

  test('미국 대학 시즌은 NCAA 명칭으로 기록된다', () => {
    const s = { ...mk(75), age: 19, stage: 'COLLEGE' as const, teamId: 'duke' }
    const h = advanceSeason(s).history[0]
    expect(h.result[0]).toMatch(/^정규시즌 \d+위$/)
    expect(h.featured.every((g) => /NCAA/.test(g.label))).toBe(true)
    expect(h.bestTeams?.[0]).toHaveLength(5)
  })
})

test('성장 분배: 99 능력치는 제외돼 오버롤 변화량이 줄지 않는다', () => {
  const rng = new Rng(7)
  const mk = (): Player => ({
    ...createPlayer(rng, 'x', 'C', '림 프로텍터'),
    potential: 99,
    growthType: 'normal',
  })
  const capped = mk()
  capped.attrs.rebounding = 99
  const free = mk()
  free.attrs = { ...capped.attrs, rebounding: 60 }
  const beforeCapped = overall(capped)
  const beforeFree = overall(free)
  grow(new Rng(1), capped, 20, 0.7, undefined, 0)
  grow(new Rng(1), free, 20, 0.7, undefined, 0)
  // gap 이 다르니 g 도 다르지만, 상한에 막힌 쪽도 gap 에 비례한 만큼은 그대로 오른다
  const gainCapped = overall(capped) - beforeCapped
  const gainFree = overall(free) - beforeFree
  expect(gainCapped / (99 - beforeCapped)).toBeCloseTo(
    gainFree / (99 - beforeFree),
    1,
  )
  expect(capped.attrs.rebounding).toBe(99)
})

describe('잔류와 연장 계약', () => {
  const mk = (stage: 'KBL' | 'NBA', teamId: string, yearsLeft: number) => {
    const rng = new Rng(4)
    const p = createPlayer(rng, 'a', 'SG', '슈터')
    for (const k of Object.keys(p.attrs) as (keyof typeof p.attrs)[])
      p.attrs[k] = 85
    return {
      ...newGame(4, p, 'yongsan'),
      age: 27,
      stage,
      teamId,
      teamName: teamId,
      service: { status: 'exempt' as const },
      contract: {
        teamId,
        teamName: teamId,
        salary: 1,
        currency: stage === 'KBL' ? ('KRW' as const) : ('USD' as const),
        yearsLeft,
      },
    }
  }
  const event = (s: ReturnType<typeof mk>, kind: string, seed: number) =>
    buildOffseason(new Rng(seed), structuredClone(s)).find(
      (e) => e.kind === kind,
    )

  test('FA 제안 1번은 항상 현 소속팀 (잔류), 다른 구단 3개가 더 붙는다', () => {
    for (let seed = 0; seed < 20; seed++) {
      for (const [stage, team, kind] of [
        ['KBL', 'changwon', 'kblFA'],
        ['NBA', 'bos', 'nbaFA'],
      ] as const) {
        const offers = event(mk(stage, team, 0), kind, seed)!.options.filter(
          (o) => o.id.startsWith('offer:'),
        )
        expect(offers).toHaveLength(4)
        expect(offers[0].teamId).toBe(team)
        expect(offers[0].label).toMatchObject({ k: '{team} (잔류)' })
        expect(offers.slice(1).map((o) => o.teamId)).not.toContain(team)
      }
    }
  })

  test('계약 1년 남으면 연장 제안, 받으면 다음 오프시즌 FA 를 건너뛴다', () => {
    expect(event(mk('KBL', 'changwon', 2), 'extension', 1)).toBeUndefined()
    let s: GameState = mk('KBL', 'changwon', 1)
    s = { ...s, events: buildOffseason(new Rng(1), structuredClone(s)) }
    const ext = s.events.find((e) => e.kind === 'extension')!
    expect(ext.options.map((o) => o.id)).toEqual(['offer:0', 'expire'])
    s = { ...s, events: [ext] }
    // 만료까지 뛰면 계약 그대로
    expect(resolveEvent(s, 'expire').contract?.yearsLeft).toBe(1)
    const signed = resolveEvent(s, 'offer:0')
    expect(signed.contract?.teamId).toBe('changwon')
    expect(signed.contract!.yearsLeft).toBeGreaterThanOrEqual(2)
    expect(signed.stage).toBe('KBL')
    const next = advanceSeason({ ...signed, events: [] })
    expect(next.events.map((e) => e.kind)).not.toContain('kblFA')
  })
})

import { UNIVERSITIES } from '../data/schools'
import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import { KBL_SALARY, NBA_SALARY, NBA_TWO_WAY_SALARY } from '../data/leagues'
import { ATTR_KEYS, ATTR_LABELS, overall } from './player'
import { clamp, sigmoid, type Rng } from './rng'
import type {
  AttrKey,
  Contract,
  EventOption,
  GameEvent,
  GameState,
  Stage,
} from './types'

const RETIRE_AGE = 41

export function interp(table: [number, number][], ovr: number): number {
  if (ovr <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i]
    if (ovr <= x1) {
      const [x0, y0] = table[i - 1]
      return y0 + ((y1 - y0) * (ovr - x0)) / (x1 - x0)
    }
  }
  return table.at(-1)![1]
}

export function formatMoney(amount: number, currency: 'KRW' | 'USD') {
  if (currency === 'USD') return `$${(amount / 1_000_000).toFixed(2)}M`
  // KRW 는 만원 단위로 저장
  return amount >= 10000
    ? `${(amount / 10000).toFixed(1)}억 원`
    : `${Math.round(amount)}만 원`
}

const notice = (title: string, body: string): GameEvent => ({
  kind: 'notice',
  title,
  body,
  options: [{ id: 'ok', label: '확인' }],
})

function setStage(
  s: GameState,
  stage: Stage,
  teamId: string,
  teamName: string,
) {
  s.stage = stage
  s.teamId = teamId
  s.teamName = teamName
  s.stageYear = 0
}

function sign(s: GameState, stage: 'KBL' | 'NBA', c: Contract) {
  s.contract = c
  setStage(s, stage, c.teamId, c.teamName)
}

type Offer = Contract

function offerOption(o: Offer, i: number): EventOption {
  return {
    id: `offer:${i}`,
    label: `${o.teamName}${o.twoWay ? ' (투웨이)' : ''}`,
    desc: `${formatMoney(o.salary, o.currency)} · ${o.yearsLeft}년`,
  }
}

function kblOffers(rng: Rng, s: GameState, n = 3): Offer[] {
  const ovr = overall(s.player)
  const teams = rng.shuffle([...KBL_TEAMS])
  if (s.stage === 'KBL') {
    teams.sort((a, b) => Number(b.id === s.teamId) - Number(a.id === s.teamId))
  }
  const years = s.age >= 32 ? [1, 2] : [2, 5]
  return teams.slice(0, n).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    salary: Math.round(interp(KBL_SALARY, ovr) * rng.range(0.88, 1.15)),
    currency: 'KRW' as const,
    yearsLeft: rng.int(years[0], years[1]),
  }))
}

function nbaOffers(rng: Rng, s: GameState, n = 3): Offer[] {
  const ovr = overall(s.player)
  const years = s.age >= 31 ? [1, 2] : [1, 4]
  return rng
    .shuffle([...NBA_TEAMS])
    .slice(0, n)
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      salary: Math.round(interp(NBA_SALARY, ovr) * rng.range(0.85, 1.15)),
      currency: 'USD' as const,
      yearsLeft: rng.int(years[0], years[1]),
    }))
}

function twoWay(rng: Rng): Offer {
  const t = rng.pick(NBA_TEAMS)
  return {
    teamId: t.id,
    teamName: t.name,
    salary: NBA_TWO_WAY_SALARY,
    currency: 'USD',
    yearsLeft: 1,
    twoWay: true,
  }
}

function offersEvent(
  kind: string,
  title: string,
  body: string,
  offers: Offer[],
  extra: EventOption[] = [],
): GameEvent {
  return {
    kind,
    title,
    body,
    options: [...offers.map(offerOption), ...extra],
    data: { offers },
  }
}

// ── 드래프트 ──────────────────────────────────────────

function kblDraft(rng: Rng, s: GameState): GameEvent {
  const ovr = overall(s.player)
  const score = ovr + (22 - s.age) * 0.3 + rng.normal(0, 2)
  const pick = Math.max(1, Math.round((70 - score) * 1.6) + 1 + rng.int(0, 2))
  if (pick > 20) {
    setStage(s, 'FREE', '', '무소속')
    s.contract = undefined
    return notice(
      'KBL 신인 드래프트 미지명',
      '이번 드래프트에서 이름이 불리지 않았습니다. 무소속으로 개인 훈련을 이어갑니다.',
    )
  }
  const t = rng.pick(KBL_TEAMS)
  const round = pick <= 10 ? 1 : 2
  const salary = Math.round(
    Math.max(interp(KBL_SALARY, ovr), round === 1 ? 11000 - pick * 500 : 4200),
  )
  sign(s, 'KBL', {
    teamId: t.id,
    teamName: t.name,
    salary,
    currency: 'KRW',
    yearsLeft: 3,
  })
  return notice(
    `KBL 신인 드래프트 ${round}라운드 ${pick}순위!`,
    `${t.name}이(가) ${s.player.name}을(를) 지명했습니다. 연봉 ${formatMoney(salary, 'KRW')}, 계약 3년.`,
  )
}

function nbaDraft(rng: Rng, s: GameState): GameEvent[] {
  const ovr = overall(s.player)
  const score =
    ovr + (22 - s.age) * 0.6 + (s.player.height - 195) / 5 + rng.normal(0, 2)
  if (score < 82) {
    return [
      notice(
        'NBA 드래프트 미지명',
        '60명의 이름 중 당신은 없었습니다. 같은 해 KBL 드래프트에 참가합니다.',
      ),
      kblDraft(rng, s),
    ]
  }
  const pick = clamp(Math.round((93 - score) * 5.5) + 1, 1, 60)
  const t = rng.pick(NBA_TEAMS)
  const firstRound = pick <= 30
  const c: Contract = firstRound
    ? {
        teamId: t.id,
        teamName: t.name,
        salary: Math.round(13_000_000 * (1 - ((pick - 1) / 30) * 0.8)),
        currency: 'USD',
        yearsLeft: 4,
      }
    : { ...twoWay(rng), teamId: t.id, teamName: t.name, yearsLeft: 2 }
  sign(s, 'NBA', c)
  return [
    notice(
      `NBA 드래프트 ${firstRound ? 1 : 2}라운드 ${pick}순위!`,
      `${t.name}이(가) 당신을 지명했습니다. ${firstRound ? '루키 스케일' : '투웨이'} 계약 ${formatMoney(c.salary, 'USD')}.`,
    ),
  ]
}

function nbaTryout(rng: Rng, s: GameState): GameEvent {
  const ovr = overall(s.player)
  const p = sigmoid((ovr - 85) / 1.5 + (s.player.height - 195) / 10)
  if (!rng.chance(p)) {
    return notice(
      'NBA 서머리그 도전 실패',
      '서머리그에서 가능성을 보였지만 계약 제안은 오지 않았습니다. 기존 무대로 돌아갑니다.',
    )
  }
  const c =
    ovr >= 86 ? { ...nbaOffers(rng, s, 1)[0], yearsLeft: 2 } : twoWay(rng)
  sign(s, 'NBA', c)
  return notice(
    'NBA 계약 성공!',
    `${c.teamName}와(과) ${c.twoWay ? '투웨이' : '정식'} 계약을 맺었습니다. ${formatMoney(c.salary, 'USD')}.`,
  )
}

// ── 오프시즌 이벤트 생성 ───────────────────────────────

export function buildOffseason(rng: Rng, s: GameState): GameEvent[] {
  const ev: GameEvent[] = []
  const ovr = overall(s.player)

  if (s.age >= RETIRE_AGE) {
    return [
      {
        kind: 'forceRetire',
        title: '은퇴',
        body: `${s.age}세, 이제 코트를 떠날 시간입니다.`,
        options: [{ id: 'ok', label: '은퇴식 진행' }],
      },
    ]
  }
  const pro = s.stage === 'KBL' || s.stage === 'NBA' || s.stage === 'FREE'
  if (pro && s.age >= 34) {
    ev.push({
      kind: 'retire',
      title: '은퇴 고민',
      body: `${s.age}세. 몸이 예전 같지 않습니다. 현역을 이어갈까요?`,
      options: [
        { id: 'stay', label: '현역 연장' },
        { id: 'retire', label: '은퇴한다' },
      ],
    })
  }

  if (s.stage === 'HS' && s.stageYear >= 3) {
    const offers = [...UNIVERSITIES]
      .filter((u) => ovr >= u.strength - 8 + rng.normal(0, 2))
      .slice(0, 4)
    const list = offers.length ? offers : UNIVERSITIES.slice(-2)
    ev.push({
      kind: 'hsGraduate',
      title: '고교 졸업 — 진로 선택',
      body: `현재 오버롤 ${ovr}. 스카우트 제안이 도착했습니다.`,
      options: [
        ...list.map((u) => ({ id: `univ:${u.id}`, label: `${u.name} 진학` })),
        {
          id: 'kbl',
          label: '고졸 KBL 드래프트 참가',
          desc: '바로 프로에 도전',
        },
      ],
    })
  } else if (s.stage === 'COLLEGE') {
    const last = s.stageYear >= 4
    const options: EventOption[] = last
      ? []
      : [
          {
            id: 'stay',
            label: '학교 잔류',
            desc: `${s.stageYear + 1}학년 진급`,
          },
        ]
    options.push({
      id: 'kbl',
      label: last ? 'KBL 드래프트 참가' : 'KBL 얼리 엔트리',
    })
    if (ovr >= 80) options.push({ id: 'nba', label: 'NBA 드래프트 도전' })
    if (last || s.stageYear >= 1) {
      ev.push({
        kind: 'collegeChoice',
        title: last ? '대학 졸업 — 드래프트' : '얼리 엔트리 결정',
        body: `현재 오버롤 ${ovr}.`,
        options,
      })
    }
  } else if (s.stage === 'KBL') {
    const nbaOpt =
      ovr >= 80
        ? [
            {
              id: 'nba',
              label: 'NBA 서머리그 도전',
              desc: '실패 시 FA 시장 복귀',
            },
          ]
        : []
    if ((s.contract?.yearsLeft ?? 0) <= 0) {
      if (ovr >= 55) {
        ev.push(
          offersEvent(
            'kblFA',
            'KBL FA 시장',
            `현재 오버롤 ${ovr}. 영입 제안이 왔습니다.`,
            kblOffers(rng, s),
            nbaOpt,
          ),
        )
      } else {
        ev.push(freeChoice(s))
      }
    } else if (ovr >= 82) {
      ev.push({
        kind: 'nbaChallenge',
        title: 'NBA 도전 제안',
        body: '해외 진출 조항으로 NBA 서머리그에 참가할 수 있습니다.',
        options: [...nbaOpt, { id: 'stay', label: 'KBL 잔류' }],
      })
    }
  } else if (s.stage === 'NBA' && (s.contract?.yearsLeft ?? 0) <= 0) {
    const offers =
      ovr >= 83 ? nbaOffers(rng, s) : ovr >= 80 ? [twoWay(rng)] : []
    const extra: EventOption[] = [{ id: 'kbl', label: 'KBL 복귀' }]
    ev.push(
      offersEvent(
        'nbaFA',
        'NBA FA 시장',
        offers.length
          ? `현재 오버롤 ${ovr}. 계약 제안이 도착했습니다.`
          : `현재 오버롤 ${ovr}. NBA 팀들의 제안이 없습니다.`,
        offers,
        extra,
      ),
    )
  } else if (s.stage === 'FREE') {
    ev.push(freeChoice(s))
  }

  ev.push(trainingEvent())
  if (rng.chance(0.35)) ev.push(rng.pick(RANDOM_EVENTS)())
  return ev
}

function freeChoice(s: GameState): GameEvent {
  const options: EventOption[] = []
  if (s.age <= 24) options.push({ id: 'draft', label: 'KBL 드래프트 재도전' })
  options.push({ id: 'tryout', label: 'KBL 입단 테스트' })
  options.push({ id: 'free', label: '1년 더 개인 훈련' })
  options.push({ id: 'retire', label: '은퇴한다' })
  return {
    kind: 'free',
    title: '무소속 선수의 선택',
    body: '어디서 다시 시작할까요?',
    options,
  }
}

function trainingEvent(): GameEvent {
  return {
    kind: 'training',
    title: '비시즌 훈련 계획',
    body: '다음 시즌 집중적으로 키울 능력을 고르세요.',
    options: [
      ...ATTR_KEYS.map((k) => ({ id: k, label: ATTR_LABELS[k] })),
      { id: 'balance', label: '균형 훈련', desc: '포지션에 맞게 고르게 성장' },
    ],
  }
}

const RANDOM_EVENTS: (() => GameEvent)[] = [
  () => ({
    kind: 'trainer',
    title: '개인 트레이너 제안',
    body: '유명 스킬 트레이너가 비시즌 1:1 훈련을 제안했습니다.',
    options: [
      { id: 'yes', label: '함께 훈련한다', desc: '다음 시즌 성장 증가' },
      { id: 'no', label: '정중히 거절한다' },
    ],
  }),
  () => ({
    kind: 'camp',
    title: '해외 스킬 캠프 초청',
    body: '미국에서 열리는 엘리트 스킬 캠프에 초청받았습니다.',
    options: [
      { id: 'yes', label: '참가한다', desc: '능력치 하나 즉시 상승' },
      { id: 'no', label: '휴식을 택한다', desc: '컨디션 회복' },
    ],
  }),
  () => ({
    kind: 'mentor',
    title: '대선배의 조언',
    body: '은퇴한 레전드 선배가 식사 자리에서 진심 어린 조언을 건넵니다.',
    options: [
      { id: 'yes', label: '마음에 새긴다', desc: '잠재력 소폭 상승' },
      { id: 'no', label: '흘려듣는다' },
    ],
  }),
  () => ({
    kind: 'slump',
    title: '슬럼프',
    body: '최근 슛 감각이 좋지 않습니다. 어떻게 극복할까요?',
    options: [
      { id: 'coach', label: '멘탈 코칭을 받는다', desc: '안정적' },
      { id: 'grind', label: '야간 슈팅 1000개', desc: '모 아니면 도' },
    ],
  }),
]

// ── 이벤트 처리 ────────────────────────────────────────

export function applyEvent(
  rng: Rng,
  s: GameState,
  ev: GameEvent,
  optionId: string,
) {
  const ovr = overall(s.player)
  const front = (...e: GameEvent[]) => s.events.unshift(...e)
  const offer = () => {
    const offers = (ev.data?.offers ?? []) as Offer[]
    return offers[Number(optionId.split(':')[1])]
  }

  switch (ev.kind) {
    case 'notice':
      return
    case 'forceRetire':
      return retire(s)
    case 'retire':
      if (optionId === 'retire') retire(s)
      return
    case 'hsGraduate':
      if (optionId === 'kbl') return front(kblDraft(rng, s))
      {
        const u = UNIVERSITIES.find((x) => `univ:${x.id}` === optionId)!
        setStage(s, 'COLLEGE', u.id, u.name)
        return front(
          notice(`${u.name} 입학`, '대학 무대에서 새로운 도전을 시작합니다.'),
        )
      }
    case 'collegeChoice':
      if (optionId === 'kbl') return front(kblDraft(rng, s))
      if (optionId === 'nba') return front(...nbaDraft(rng, s))
      return
    case 'kblFA':
      if (optionId === 'nba') {
        const r = nbaTryout(rng, s)
        if (s.stage !== 'NBA') {
          // 도전 실패: FA 제안 재노출
          return front(r, {
            ...ev,
            options: ev.options.filter((o) => o.id !== 'nba'),
          })
        }
        return front(r)
      }
      return signOffer(s, 'KBL', offer(), front)
    case 'nbaChallenge':
      if (optionId === 'nba') return front(nbaTryout(rng, s))
      return
    case 'nbaFA':
      if (optionId === 'kbl') {
        return front(
          offersEvent(
            'kblFA',
            'KBL 복귀',
            'KBL 구단들의 영입 제안입니다.',
            kblOffers(rng, s),
          ),
        )
      }
      return signOffer(s, 'NBA', offer(), front)
    case 'free':
      if (optionId === 'retire') return retire(s)
      if (optionId === 'draft') return front(kblDraft(rng, s))
      if (optionId === 'tryout') {
        if (ovr + rng.normal(0, 2) >= 58) {
          const t = rng.pick(KBL_TEAMS)
          sign(s, 'KBL', {
            teamId: t.id,
            teamName: t.name,
            salary: 4200,
            currency: 'KRW',
            yearsLeft: 1,
          })
          return front(
            notice(
              '입단 테스트 합격',
              `${t.name}와(과) 1년 계약을 맺었습니다.`,
            ),
          )
        }
        setStage(s, 'FREE', '', '무소속')
        return front(
          notice('입단 테스트 불합격', '아쉽게도 합격하지 못했습니다.'),
        )
      }
      setStage(s, 'FREE', '', '무소속')
      return
    case 'training':
      s.mods.focus = optionId === 'balance' ? undefined : (optionId as AttrKey)
      return
    case 'trainer':
      if (optionId === 'yes') s.mods.growthBonus += 1.5
      return
    case 'camp':
      if (optionId === 'yes') {
        const k = rng.pick(ATTR_KEYS)
        s.player.attrs[k] = Math.min(99, s.player.attrs[k] + 2)
        return front(notice('캠프 성과', `${ATTR_LABELS[k]} +2`))
      }
      s.mods.growthBonus += 0.5
      return
    case 'mentor':
      if (optionId === 'yes')
        s.player.potential = Math.min(99, s.player.potential + 1)
      return
    case 'slump':
      if (optionId === 'grind') {
        const good = rng.chance(0.5)
        s.mods.growthBonus += good ? 2 : -1
        return front(
          notice(
            good ? '각성!' : '과부하',
            good
              ? '슛 감각이 돌아왔습니다.'
              : '무리한 훈련으로 몸이 지쳤습니다.',
          ),
        )
      }
      return
  }
}

function signOffer(
  s: GameState,
  stage: 'KBL' | 'NBA',
  o: Offer | undefined,
  front: (...e: GameEvent[]) => void,
) {
  if (!o) return
  sign(s, stage, o)
  front(
    notice(
      `${o.teamName} 계약`,
      `${formatMoney(o.salary, o.currency)} · ${o.yearsLeft}년 계약을 맺었습니다.`,
    ),
  )
}

function retire(s: GameState) {
  s.stage = 'RETIRED'
  s.contract = undefined
  s.events = []
}

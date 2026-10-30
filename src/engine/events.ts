import { isUsCollege, UNIVERSITIES, US_COLLEGES } from '../data/schools'
import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import {
  ENLIST_MAX_AGE,
  ENLIST_MIN_AGE,
  KBL_SALARY,
  LEAGUES,
  NBA_DRAFT_MARGIN,
  NBA_SALARY,
  NCAA_DRAFT_BONUS,
  NBA_TWO_WAY_SALARY,
} from '../data/leagues'
import {
  isAsianGamesYear,
  playAsianGames,
  selectedForNational,
} from './nationalTeam'
import { addEv, ATTR_KEYS, ATTR_LABELS, overall } from './player'
import { clamp, sigmoid, type Rng } from './rng'
import { getLang, T, type Text } from '../i18n'
import type {
  AttrKey,
  Contract,
  DrillKind,
  EventOption,
  GameEvent,
  GameState,
  Player,
  Stage,
} from './types'

// 고교 졸업 때 미국 대학 제안이 오는 OVR
const US_COLLEGE_OVR = 64
const RETIRE_AGE = 45
// 은퇴 고민 이벤트가 뜨기 시작하는 나이
const RETIRE_ASK_AGE = 36

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

// ponytail: 현재 언어로 포맷한 문자열을 이벤트에 박는다. 생성 뒤 언어를 바꾸면 그 문장만 이전 언어다
export function formatMoney(amount: number, currency: 'KRW' | 'USD') {
  if (currency === 'USD') return `$${(amount / 1_000_000).toFixed(2)}M`
  // KRW 는 만원 단위로 저장
  const lang = getLang()
  if (lang === 'ja') {
    // 소수 한 자리, .0 은 뗀다 (₩8500万 · ₩18億 · ₩1.3兆)
    const n = (x: number) => String(Math.round(x * 10) / 10)
    if (amount >= 100_000_000) return `₩${n(amount / 100_000_000)}兆`
    return amount >= 10000
      ? `₩${n(amount / 10000)}億`
      : `₩${Math.round(amount)}万`
  }
  if (lang === 'en') {
    // 만원 → 원. 반올림한 값이 1000 이 되면 다음 단위로 올린다
    const won = amount * 10000
    if (won < 1e6) return `₩${Math.round(won / 1e3)}K`
    for (const [u, s] of [
      [1e6, 'M'],
      [1e9, 'B'],
      [1e12, 'T'],
    ] as const) {
      const x = Math.round((won / u) * 10) / 10
      if (x < 1000 || s === 'T') return `₩${x.toFixed(1)}${s}`
    }
  }
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}조 원`
  return amount >= 10000
    ? `${(amount / 10000).toFixed(1)}억 원`
    : `${Math.round(amount)}만 원`
}

const notice = (title: Text, body: Text): GameEvent => ({
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

// own: 소속팀(잔류) 또는 떠났던 팀(복귀) 제안이면 라벨에 표시
function offerOption(
  o: Offer,
  i: number,
  own: '잔류' | '복귀' | undefined,
): EventOption {
  const tag = [own, o.twoWay ? '투웨이' : undefined].filter(Boolean).join('·')
  return {
    id: `offer:${i}`,
    teamId: o.teamId,
    label: tag
      ? { k: `{team} (${tag})`, v: { team: T(o.teamName) } }
      : { k: '{team}', v: { team: T(o.teamName) } },
    desc: {
      k: '연봉 {money}, {years}년 계약',
      v: { money: formatMoney(o.salary, o.currency), years: o.yearsLeft },
    },
  }
}

// 현 소속팀 제안을 맨 앞에 고정하고 다른 구단 n개를 붙인다
function withOwnTeam<T extends { id: string }>(
  rng: Rng,
  teams: T[],
  ownId: string | undefined,
  n: number,
): T[] {
  const own = teams.find((t) => t.id === ownId)
  const others = rng.shuffle(teams.filter((t) => t !== own)).slice(0, n)
  return own ? [own, ...others] : others
}

// 원팀: 지금 소속이면 그 팀, 아니면 그 리그에서 마지막으로 뛴 팀(복귀·전역 때 1번 제안)
function ownTeamId(s: GameState, league: 'KBL' | 'NBA'): string | undefined {
  if (s.stage === league) return s.teamId
  const name = s.history.findLast((h) => h.stage === league)?.team
  return (league === 'KBL' ? KBL_TEAMS : NBA_TEAMS).find((t) => t.name === name)
    ?.id
}

function kblOffers(rng: Rng, s: GameState, n = 3): Offer[] {
  const ovr = overall(s.player)
  const own = ownTeamId(s, 'KBL')
  const years = s.age >= 32 ? [1, 2] : [2, 5]
  return withOwnTeam(rng, KBL_TEAMS, own, n).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    salary: Math.round(interp(KBL_SALARY, ovr) * rng.range(0.88, 1.15)),
    currency: 'KRW' as const,
    yearsLeft: rng.int(years[0], years[1]),
  }))
}

function nbaOffers(rng: Rng, s: GameState, n = 3): Offer[] {
  const ovr = overall(s.player)
  const own = ownTeamId(s, 'NBA')
  const years = s.age >= 31 ? [1, 2] : [1, 4]
  return withOwnTeam(rng, NBA_TEAMS, own, n).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    salary: Math.round(interp(NBA_SALARY, ovr) * rng.range(0.85, 1.15)),
    currency: 'USD' as const,
    yearsLeft: rng.int(years[0], years[1]),
  }))
}

function twoWay(rng: Rng, teamId?: string): Offer {
  const t = NBA_TEAMS.find((x) => x.id === teamId) ?? rng.pick(NBA_TEAMS)
  return {
    teamId: t.id,
    teamName: t.name,
    salary: NBA_TWO_WAY_SALARY,
    currency: 'USD',
    yearsLeft: 1,
    twoWay: true,
  }
}

// NBA FA 제안: OVR 83 이상 정식(소속팀 잔류 + 다른 구단 n), 80~82 는 소속팀 투웨이(소속팀이 없으면 무작위)
function nbaFaOffers(rng: Rng, s: GameState, n = 3): Offer[] {
  const ovr = overall(s.player)
  if (ovr >= 83) return nbaOffers(rng, s, n)
  return ovr >= 80 ? [twoWay(rng, ownTeamId(s, 'NBA'))] : []
}

// ownId 제안은 잔류, back 이면 (리그 복귀·전역) 복귀로 표시
function offersEvent(
  kind: string,
  title: Text,
  body: Text,
  offers: Offer[],
  extra: EventOption[] = [],
  ownId?: string,
  back = false,
): GameEvent {
  return {
    kind,
    title,
    body,
    options: [
      ...offers.map((o, i) =>
        offerOption(
          o,
          i,
          ownId && o.teamId === ownId ? (back ? '복귀' : '잔류') : undefined,
        ),
      ),
      ...extra,
    ],
    data: { offers },
  }
}

// ── 드래프트 ──────────────────────────────────────────

function kblDraft(rng: Rng, s: GameState): GameEvent {
  const ovr = overall(s.player)
  const score = ovr + (22 - s.age) * 0.3 + rng.normal(0, 2)
  // 1순위 기준 점수 75: OVR 70 은 8순위 안팎, 80 은 확실한 1순위로 고점을 벌린다
  const pick = Math.max(1, Math.round((75 - score) * 1.2) + 1 + rng.int(0, 2))
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
    { k: 'KBL 신인 드래프트 {round}라운드 {pick}순위!', v: { round, pick } },
    {
      k: '{team}이(가) {name}을(를) 지명했습니다. 연봉 {money}에 3년 계약입니다.',
      v: {
        team: T(t.name),
        name: s.player.name,
        money: formatMoney(salary, 'KRW'),
      },
    },
  )
}

function nbaDraft(rng: Rng, s: GameState): GameEvent[] {
  const ovr = overall(s.player)
  const score =
    ovr +
    (22 - s.age) * 0.6 +
    (s.player.height - 195) / 5 +
    (isUsCollege(s.teamId) ? NCAA_DRAFT_BONUS : 0) +
    rng.normal(0, 2)
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
      {
        k: 'NBA 드래프트 {round}라운드 {pick}순위!',
        v: { round: firstRound ? 1 : 2, pick },
      },
      {
        k: firstRound
          ? '{team}의 지명을 받았습니다. {money}에 루키 스케일 계약입니다.'
          : '{team}의 지명을 받았습니다. {money}에 투웨이 계약입니다.',
        v: { team: T(t.name), money: formatMoney(c.salary, 'USD') },
      },
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
  return notice('NBA 계약 성공!', {
    k: c.twoWay
      ? '{team}와(과) {money}에 투웨이 계약을 맺었습니다.'
      : '{team}와(과) {money}에 정식 계약을 맺었습니다.',
    v: { team: T(c.teamName), money: formatMoney(c.salary, 'USD') },
  })
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
        body: { k: '{age}세, 이제 코트를 떠날 시간입니다.', v: { age: s.age } },
        options: [{ id: 'ok', label: '은퇴식 진행' }],
      },
    ]
  }
  // 전역 이벤트가 진로 선택을 담고 있으므로 아래 무대별 분기는 건너뛴다
  const discharged = s.stage === 'MILITARY'
  if (discharged) {
    ev.push(...leaveService(rng, s, true))
  }
  const pro = s.stage === 'KBL' || s.stage === 'NBA' || s.stage === 'FREE'
  if (
    pro &&
    s.service.status === 'pending' &&
    s.age >= ENLIST_MIN_AGE &&
    !ev.length
  ) {
    ev.push(enlistEvent(s))
  }
  if (pro && s.age >= RETIRE_ASK_AGE) {
    ev.push({
      kind: 'retire',
      title: '은퇴 고민',
      body: {
        k: '{age}세, 몸이 예전 같지 않습니다. 현역을 이어갈까요?',
        v: { age: s.age },
      },
      options: [
        { id: 'stay', label: '현역 연장' },
        { id: 'retire', label: '은퇴한다' },
      ],
    })
  }

  if (discharged) {
    // 전역 직후: 진로는 leaveService 가 만든 이벤트로 정한다
  } else if (s.stage === 'HS' && s.stageYear >= 3) {
    const offers = [...UNIVERSITIES]
      .filter((u) => ovr >= u.strength - 8 + rng.normal(0, 2))
      .slice(0, 4)
    const list = offers.length ? offers : UNIVERSITIES.slice(-2)
    // 미국 대학: 고교 최상위권이면 2곳에서 제안
    const us =
      ovr >= US_COLLEGE_OVR ? rng.shuffle([...US_COLLEGES]).slice(0, 2) : []
    ev.push({
      kind: 'hsGraduate',
      title: '고교 졸업 — 진로 선택',
      body: {
        k: '현재 오버롤은 {ovr}입니다. 스카우트 제안이 도착했습니다.',
        v: { ovr },
      },
      options: [
        ...list.map((u) => ({
          id: `univ:${u.id}`,
          label: { k: '{school} 진학', v: { school: T(u.name) } },
        })),
        ...us.map((u) => ({
          id: `us:${u.id}`,
          label: { k: '{school} 진학', v: { school: T(u.name) } },
          desc: '미국 NCAA. NBA 드래프트로 가는 길',
        })),
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
            desc: { k: '{year}학년 진급', v: { year: s.stageYear + 1 } },
          },
        ]
    options.push({
      id: 'kbl',
      label: last ? 'KBL 드래프트 참가' : 'KBL 얼리 엔트리',
    })
    // NBA 드래프트는 미국 대학에서만, 리그 평균 OVR 보다 넉넉히 높을 때 (상위권)
    if (isUsCollege(s.teamId) && ovr >= LEAGUES.NCAA.level + NBA_DRAFT_MARGIN)
      options.push({
        id: 'nba',
        label: 'NBA 드래프트 도전',
        desc: '미지명이면 같은 해 KBL 드래프트',
      })
    if (last || s.stageYear >= 1) {
      ev.push({
        kind: 'collegeChoice',
        title: last ? '대학 졸업 — 드래프트' : '얼리 엔트리 결정',
        body: { k: '현재 오버롤 {ovr}', v: { ovr } },
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
      // 원팀: 소속팀 잔류 제안은 문턱 없이, 다른 구단은 OVR 55 이상일 때만
      const offers = kblOffers(rng, s, ovr >= 55 ? 3 : 0)
      if (offers.length) {
        ev.push(
          offersEvent(
            'kblFA',
            'KBL FA 시장',
            {
              k: '현재 오버롤은 {ovr}입니다. 영입 제안이 왔습니다.',
              v: { ovr },
            },
            offers,
            nbaOpt,
            s.teamId,
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
    const offers = nbaFaOffers(rng, s)
    const extra: EventOption[] = [{ id: 'kbl', label: 'KBL 복귀' }]
    ev.push(
      offersEvent(
        'nbaFA',
        'NBA FA 시장',
        offers.length
          ? {
              k: '현재 오버롤은 {ovr}입니다. 계약 제안이 도착했습니다.',
              v: { ovr },
            }
          : {
              k: '현재 오버롤은 {ovr}입니다. NBA 팀들의 제안은 없습니다.',
              v: { ovr },
            },
        offers,
        extra,
        s.teamId,
      ),
    )
  } else if (s.stage === 'FREE') {
    ev.push(freeChoice(s))
  }

  // 계약 마지막 시즌을 앞두면 소속팀이 연장을 제안한다 (FA 잔류 제안과 같은 조건: KBL 은 항상, NBA 는 OVR 80 이상)
  if (
    s.contract?.yearsLeft === 1 &&
    (s.stage === 'KBL' || (s.stage === 'NBA' && ovr >= 80))
  ) {
    ev.push(
      offersEvent(
        'extension',
        '연장 계약 제안',
        {
          k: '계약이 1년 남았습니다. {team}이(가) 연장 계약을 제안했습니다.',
          v: { team: T(s.teamName) },
        },
        s.stage === 'KBL' ? kblOffers(rng, s, 0) : nbaFaOffers(rng, s, 0),
        [{ id: 'expire', label: '계약 만료까지 뛴다' }],
        s.teamId,
      ),
    )
  }

  if (
    isAsianGamesYear(s.year) &&
    s.stage !== 'HS' &&
    selectedForNational(rng, s)
  ) {
    ev.push({
      kind: 'asianGames',
      title: { k: '{year} 아시안게임 국가대표 발탁', v: { year: s.year } },
      body: '태극마크를 달 기회입니다. 금메달을 따면 병역특례(예술체육요원)를 받습니다.',
      options: [
        { id: 'go', label: '출전한다' },
        { id: 'skip', label: '소속팀 시즌 준비에 집중한다' },
      ],
    })
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

// 훈련 미니게임: 오프시즌마다 12종 중 최대 DRILL_MAX 개, 종류별로 한 번.
// UI 가 게임을 돌리고 DRILL_REPS 회 중 성공 수를 넘긴다. DRILL_NEED 개 이상이면 능력치 +gain(기본 1)
export const DRILL_REPS = 10
export const DRILL_NEED = 6
export const DRILL_MAX = 4
export type DrillCat = 'shoot' | 'pass' | 'reb' | 'drib' | 'def' | 'ath'
// 조작: 누르고 떼기 · 타이밍 탭 · 방향 고르기 · 동료 고르기 · 페이크+돌파 · 켜진 등 누르기 · 버튼 연타 · 누르고 버티다 떼기 · 좌우 번갈아 연타
export type DrillCtl =
  'hold' | 'tap' | 'lr' | 'team' | 'fake' | 'lamp' | 'mash' | 'box' | 'alt'
export const DRILL_CATS: [DrillCat, string][] = [
  ['shoot', '슈팅'],
  ['pass', '패스'],
  ['reb', '리바운드'],
  ['drib', '드리블'],
  ['def', '수비'],
  ['ath', '운동능력'],
]
export const DRILL_KINDS: DrillKind[] = [
  'ft',
  'three',
  'pass',
  'team',
  'reb',
  'box',
  'drib',
  'foot',
  'react',
  'fast',
  'bench',
  'squat',
]
export interface Drill {
  cat: DrillCat
  title: string
  attr: AttrKey
  ctl: DrillCtl
  // 카드 한 줄 소개, 플레이 화면 설명, 누르는 버튼 문구(조작이 버튼 하나일 때)
  desc: string
  body: string
  btn?: string
  // 성공 시 오르는 폭. 없으면 1. 어려운 훈련(3점슛)은 더 준다
  gain?: number
}
export const DRILLS: Record<DrillKind, Drill> = {
  ft: {
    cat: 'shoot',
    title: '자유투 훈련',
    attr: 'shooting',
    ctl: 'hold',
    desc: '성공 구간이 가장 넓은 루틴 슛',
    body: '게이지가 초록 구간에 있을 때 떼면 골인. 같은 리듬으로 반복해요.',
    btn: '누르고 있다가 떼서 슛',
  },
  three: {
    cat: 'shoot',
    title: '3점슛 훈련',
    attr: 'shooting',
    ctl: 'hold',
    desc: '구간은 가장 좁고 게이지는 빨라요. 성공하면 두 배로 올라요',
    body: '먼 거리라 구간이 좁고 게이지가 빨리 차요. 한 박자 빨리 떼는 감각이 필요해요.',
    btn: '누르고 있다가 떼서 슛',
    gain: 2,
  },
  pass: {
    cat: 'pass',
    title: '일반 패스',
    attr: 'playmaking',
    ctl: 'hold',
    desc: '동료까지의 거리만큼 힘 조절',
    body: '게이지가 곧 공이 날아갈 거리예요. 바닥의 초록 칸, 동료가 받을 수 있는 거리에서 떼요.',
    btn: '누르고 있다가 떼서 패스',
  },
  team: {
    cat: 'pass',
    title: '팀 패스 게임',
    attr: 'playmaking',
    ctl: 'team',
    desc: '3자 패스: 받자마자 부르는 동료에게 원터치로',
    body: '동료가 보낸 공이 점선 칸에 들어오는 순간, 손을 든 동료 쪽을 눌러 받자마자 바로 뿌려요. 너무 일찍 누르면 놓치고, 늦으면 공을 끌어요.',
  },
  reb: {
    cat: 'reb',
    title: '리바운드 점프',
    attr: 'rebounding',
    ctl: 'tap',
    desc: '림에 맞고 튀는 공을 가장 높은 곳에서 잡기',
    body: '림에 맞고 떨어지는 공이 점선 칸을 지날 때 손이 닿도록 미리 점프해요. 공마다 튀는 높이가 달라요.',
    btn: '점프!',
  },
  box: {
    cat: 'reb',
    title: '박스아웃 리바운드',
    attr: 'rebounding',
    ctl: 'box',
    desc: '몸으로 자리를 지키다 공이 떨어질 때 점프',
    body: '슛이 림에 닿기 전에 버튼을 눌러 뒤의 상대를 막아요. 누르는 동안 자리를 지키고, 공이 점선 칸으로 떨어질 때 떼면 점프해요. 림에 닿기 전에 떼거나 안 누르고 있으면 자리를 뺏겨요.',
    btn: '누르고 버티다 떼서 점프',
  },
  drib: {
    cat: 'drib',
    title: '드리블로 선수 제치기',
    attr: 'finishing',
    ctl: 'fake',
    desc: '페이크로 수비를 속이고 반대쪽으로 돌파',
    body: '페이크로 수비를 한쪽으로 끌어낸 뒤 반대쪽으로 치고 나가요. 수비가 자리를 잡고 있을 때 그냥 돌파하면 막혀요. 수비가 스스로 기울 때도 기회예요. 페이크를 반복하면 읽혀요.',
  },
  foot: {
    cat: 'def',
    title: '수비 풋워크',
    attr: 'defense',
    ctl: 'lr',
    desc: '잽에 속지 말고 돌파하는 쪽으로 따라가기',
    body: '공격수가 진짜로 치고 나가는 쪽으로 같이 미끄러져요. 살짝 움찔하는 잽 스텝에 반응하면 속은 거예요.',
  },
  react: {
    cat: 'ath',
    title: '반응속도 게임',
    attr: 'speed',
    ctl: 'lamp',
    desc: '선수 주변 4개 등 중 켜진 등을 바로 누르기',
    body: '선수를 둘러싼 4개의 등 중 하나가 파랗게 켜지면 그 등을 바로 눌러요. 다른 등을 누르거나 켜지기 전에 누르면 실패예요.',
  },
  fast: {
    cat: 'ath',
    title: '속공 레이스',
    attr: 'speed',
    ctl: 'alt',
    desc: '뒤쫓는 수비보다 먼저 레이업 지점까지 질주',
    body: '출발 신호가 뜨면 왼발·오른발 버튼을 번갈아 빠르게 눌러 달려요. 같은 버튼을 연달아 누르면 헛발을 디뎌요. 뒤에서 쫓아오는 수비보다 먼저 레이업 지점에 닿으면 성공.',
  },
  bench: {
    cat: 'ath',
    title: '벤치 프레스',
    attr: 'athleticism',
    ctl: 'mash',
    desc: '버튼을 연타해 바를 끝까지 밀어 올리기',
    body: '바가 가슴까지 내려오면 버튼을 빠르게 연타해 밀어 올려요. 손을 멈추면 바가 다시 내려와요. 중간 고비에서 더 무거워지고 횟수가 쌓일수록 지쳐요.',
    btn: '연타! 밀어 올리기',
  },
  squat: {
    cat: 'ath',
    title: '스쿼트',
    attr: 'athleticism',
    ctl: 'mash',
    desc: '버튼을 연타해 깊은 자세에서 일어나기',
    body: '바를 메고 깊게 앉은 자세에서 버튼을 빠르게 연타해 일어나요. 손을 멈추면 다시 주저앉아요. 무릎이 펴지기 직전 고비가 가장 무거워요.',
    btn: '연타! 일어나기',
  },
}
// 이전 저장(훈련 3종 시절)의 id 와 큐에 남은 훈련 이벤트를 지금 종류로 읽는다
const LEGACY_DRILLS: Record<string, DrillKind> = {
  shootout: 'ft',
  passDrill: 'pass',
  dribbleDrill: 'drib',
}
export const drillKind = (kind: string): DrillKind | undefined =>
  kind in DRILLS ? (kind as DrillKind) : LEGACY_DRILLS[kind]
export const isDrill = (kind: string) => !!drillKind(kind)

// 훈련 결과 안내: raised 는 실제 오른 폭. 성공했는데 0 이면 최고치(99)라서다
export const drillOutcome = (
  attr: AttrKey,
  success: boolean,
  raised: number,
): Text =>
  raised
    ? { k: '{attr} +{n}', v: { attr: T(ATTR_LABELS[attr]), n: raised } }
    : success
      ? { k: '{attr} 이미 최고치예요', v: { attr: T(ATTR_LABELS[attr]) } }
      : '아쉽지만 감각은 익혔습니다.'

// 성공 시 오르는 폭: 훈련별 기본(1, 3점슛 2) + 노력형 1
export const drillGain = (p: Player, kind: DrillKind) =>
  (DRILLS[kind].gain ?? 1) + (p.ethic === 'steady' ? 1 : 0)

// 'made:N' 또는 'auto'(코치에게 맡김: 3~7개). DRILL_NEED 개 이상이면 해당 능력치 +drillGain (99 상한).
// raised 는 실제로 오른 폭 — 99 에 막히면 성공해도 0
export function applyDrill(
  rng: Rng,
  s: GameState,
  kind: DrillKind,
  optionId: string,
) {
  const { attr } = DRILLS[kind]
  const made =
    optionId === 'auto' ? rng.int(3, 7) : Number(optionId.split(':')[1])
  const before = s.player.attrs[attr]
  // 노력치는 성공 여부와 무관하게 +1
  if (made >= DRILL_NEED)
    s.player.attrs[attr] = Math.min(99, before + drillGain(s.player, kind))
  addEv(s.player, attr)
  return { made, raised: s.player.attrs[attr] - before }
}

function trainingEvent(): GameEvent {
  return {
    kind: 'training',
    title: '비시즌 훈련 계획',
    body: '다음 시즌 집중적으로 키울 능력을 고르세요.',
    options: [
      ...ATTR_KEYS.map((k) => ({ id: k, label: ATTR_LABELS[k] })),
      { id: 'balance', label: '균형 훈련' },
    ],
  }
}

const RANDOM_EVENTS: (() => GameEvent)[] = [
  () => ({
    kind: 'trainer',
    title: '개인 트레이너 제안',
    body: '유명 스킬 트레이너가 비시즌 1:1 훈련을 제안했습니다.',
    options: [
      { id: 'yes', label: '함께 훈련한다', desc: '다음 시즌 성장 폭 증가' },
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
        const us = optionId.startsWith('us:')
        const u = (us ? US_COLLEGES : UNIVERSITIES).find(
          (x) => `${us ? 'us' : 'univ'}:${x.id}` === optionId,
        )!
        setStage(s, 'COLLEGE', u.id, u.name)
        return front(
          notice(
            { k: '{school} 입학', v: { school: T(u.name) } },
            us
              ? '미국 대학 무대에서 NBA 를 향한 도전을 시작합니다.'
              : '대학 무대에서 새로운 도전을 시작합니다.',
          ),
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
            [],
            ownTeamId(s, 'KBL'),
            true,
          ),
        )
      }
      return signOffer(s, 'NBA', offer(), front)
    case 'extension': {
      // 무대·소속은 그대로, 계약만 새 연봉·연차로 덮어써 다음 FA 를 건너뛴다
      const o = offer()
      if (!o) return
      s.contract = o
      return front(
        notice(
          { k: '{team} 연장 계약', v: { team: T(o.teamName) } },
          {
            k: '연봉 {money}에 {years}년 연장 계약을 맺었습니다.',
            v: { money: formatMoney(o.salary, o.currency), years: o.yearsLeft },
          },
        ),
      )
    }
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
            notice('입단 테스트 합격', {
              k: '{team}와(과) 1년 계약을 맺었습니다.',
              v: { team: T(t.name) },
            }),
          )
        }
        setStage(s, 'FREE', '', '무소속')
        return front(
          notice('입단 테스트 불합격', '아쉽게도 합격하지 못했습니다.'),
        )
      }
      setStage(s, 'FREE', '', '무소속')
      return
    case 'military':
      if (optionId === 'later') return
      if (optionId === 'active') {
        enlist(s, 'active')
        return front(notice('현역 입대', '18개월 동안 코트를 떠납니다.'))
      }
      if (ovr + rng.normal(0, 2) >= 64) {
        enlist(s, 'sangmu')
        return front(
          notice('상무 합격', '국군체육부대에서 D리그를 뛰며 복무합니다.'),
        )
      }
      if (s.age >= ENLIST_MAX_AGE) {
        enlist(s, 'active')
        return front(notice('상무 불합격', '현역으로 입대합니다.'))
      }
      return front(notice('상무 불합격', '내년에 다시 지원할 수 있습니다.'))
    case 'asianGames': {
      if (optionId === 'skip') return
      const r = playAsianGames(rng, s, s.year)
      s.honors.push({ year: s.year, name: '아시안게임 국가대표' })
      if (r.medal)
        s.honors.push({ year: s.year, name: `아시안게임 ${r.finish}` })
      const ppg = r.stats.games ? (r.stats.pts / r.stats.games).toFixed(1) : '0'
      const after: GameEvent[] = []
      if (
        r.medal === 'gold' &&
        (s.service.status === 'pending' || s.service.status === 'serving')
      ) {
        const serving = s.service.status === 'serving'
        after.push(
          notice(
            '예술체육요원 편입',
            '4주 기초군사훈련을 마친 뒤 544시간의 체육 봉사로 병역을 대신합니다.',
          ),
        )
        if (serving) after.push(...leaveService(rng, s, false))
        s.service = { status: 'exempt' }
      }
      return front(
        {
          ...notice(
            { k: '아시안게임 {finish}', v: { finish: T(r.finish) } },
            {
              k: '대한민국 {finish}. {name}의 평균 득점은 {ppg}점입니다.',
              v: { finish: T(r.finish), name: s.player.name, ppg },
            },
          ),
          data: { game: r.last },
        },
        ...after,
      )
    }
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
        return front(
          notice('캠프 성과', {
            k: '{attr} +2',
            v: { attr: T(ATTR_LABELS[k]) },
          }),
        )
      }
      s.mods.growthBonus += 0.5
      return
    case 'mentor':
      if (optionId === 'yes')
        s.player.potential = Math.min(99, s.player.potential + 1)
      return
    // 이전 저장 파일에 남은 훈련 이벤트 (이제 오프시즌 이벤트로는 생기지 않는다)
    case 'shootout':
    case 'passDrill':
    case 'dribbleDrill': {
      const kind = drillKind(ev.kind)!
      const { attr } = DRILLS[kind]
      const { made, raised } = applyDrill(rng, s, kind, optionId)
      return front(
        notice(
          { k: '{reps}개 중 {made}개 성공', v: { reps: DRILL_REPS, made } },
          drillOutcome(attr, made >= DRILL_NEED, raised),
        ),
      )
    }
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
      { k: '{team} 계약', v: { team: T(o.teamName) } },
      {
        k: '연봉 {money}에 {years}년 계약을 맺었습니다.',
        v: { money: formatMoney(o.salary, o.currency), years: o.yearsLeft },
      },
    ),
  )
}

// 입대 시 소속팀 계약 관련 이벤트는 무효
const CONTRACT_KINDS = new Set([
  'kblFA',
  'nbaFA',
  'nbaChallenge',
  'free',
  'extension',
])

function enlistEvent(s: GameState): GameEvent {
  const forced = s.age >= ENLIST_MAX_AGE
  return {
    kind: 'military',
    title: forced ? '입영 통지서' : '병역 의무',
    body: forced
      ? { k: '{age}세, 더는 입대를 미룰 수 없습니다.', v: { age: s.age } }
      : '상무에 합격하면 복무 중에도 D리그에서 뛸 수 있습니다. 아시안게임 금메달을 따면 병역특례를 받습니다.',
    options: [
      {
        id: 'sangmu',
        label: '상무 지원',
        desc: '합격 시 D리그 출전, 18개월 복무',
      },
      forced
        ? { id: 'active', label: '현역 입대', desc: '복무 중 경기 출전 불가' }
        : { id: 'later', label: '입대 연기' },
    ],
  }
}

function enlist(s: GameState, kind: 'sangmu' | 'active') {
  s.service = {
    status: 'serving',
    kind,
    returnTo: {
      stage: s.stage,
      teamId: s.teamId,
      teamName: s.teamName,
      // KBL 계약은 복무 기간 동안 멈췄다가 전역 후 이어간다
      contract: s.stage === 'KBL' ? s.contract : undefined,
    },
  }
  s.contract = undefined
  setStage(
    s,
    'MILITARY',
    kind === 'sangmu' ? 'sangmu' : 'army',
    kind === 'sangmu' ? '국군체육부대(상무)' : '현역 복무',
  )
  s.events = s.events.filter((e) => !CONTRACT_KINDS.has(e.kind))
}

// 전역(또는 금메달 조기 전역): KBL 출신은 원소속팀 복귀, 그 외는 FA
function leaveService(rng: Rng, s: GameState, late: boolean): GameEvent[] {
  const back = s.service.returnTo
  s.service = { status: 'done', kind: s.service.kind }
  s.mods.lateReturn = late
  const when = late
    ? '12월 전역 후 시즌 중반에 합류합니다.'
    : '조기 전역해 바로 시즌을 준비합니다.'
  if (back?.stage === 'KBL' && back.contract) {
    sign(s, 'KBL', {
      ...back.contract,
      yearsLeft: Math.max(1, back.contract.yearsLeft),
    })
    return [
      notice('전역', {
        k: '{team}로 복귀합니다. {when}',
        v: { team: T(back.teamName), when: T(when) },
      }),
    ]
  }
  setStage(s, 'FREE', '', '무소속')
  s.contract = undefined
  const offers = back?.stage === 'NBA' ? nbaFaOffers(rng, s) : []
  return [
    notice('전역', {
      k: '소속팀 없이 전역합니다. {when}',
      v: { when: T(when) },
    }),
    offersEvent(
      'nbaFA',
      '전역 후 진로',
      offers.length
        ? 'NBA 구단의 제안이 도착했습니다.'
        : 'KBL 구단과 계약을 알아봅니다.',
      offers,
      [{ id: 'kbl', label: 'KBL 구단과 계약' }],
      back?.teamId,
      true,
    ),
  ]
}

function retire(s: GameState) {
  s.stage = 'RETIRED'
  s.contract = undefined
  s.events = []
}

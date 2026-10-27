import { HIGH_SCHOOLS, HS_TOURNAMENTS, UNIVERSITIES } from '../data/schools'
import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import { EN_FIRST, EN_LAST, KR_GIVEN, KR_SURNAMES } from '../data/names'
import {
  D_LEAGUE_GAMES,
  KBL_GAMES,
  LEAGUES,
  NBA_GAMES,
  TWO_WAY_GAME_LIMIT,
  UNIV_LEAGUE_GAMES,
} from '../data/leagues'
import { generatePbp } from './commentary'
import { overall, POSITION_LABELS } from './player'
import { clamp, sigmoid, type Rng } from './rng'
import {
  addLine,
  emptyLine,
  gameScore,
  minutesFor,
  perGame,
  playGame,
} from './sim'
import type {
  BestPlayer,
  GameLog,
  GameState,
  Position,
  SeasonRecord,
  StatLine,
} from './types'

interface Team {
  id: string
  name: string
  rating: number
  conference?: 'East' | 'West'
}

interface Played {
  label: string
  opp: Team
  myScore: number
  oppScore: number
  box: StatLine
}

type League = keyof typeof LEAGUES

class SeasonCtx {
  stats = emptyLine()
  po = emptyLine()
  wins = 0
  losses = 0
  played: Played[] = []
  finale?: Played
  awards: string[] = []
  private readonly rng: Rng
  private readonly s: GameState
  readonly league: League
  readonly team: Team
  readonly mpg: number
  readonly gameMin: number
  private readonly missChance: number
  // 상무 전역 시즌: 정규리그 앞부분 결장 경기 수
  private lateSkip: number

  constructor(
    rng: Rng,
    s: GameState,
    league: League,
    team: Team,
    mpgScale = 1,
  ) {
    this.rng = rng
    this.s = s
    this.league = league
    this.team = team
    this.gameMin = LEAGUES[league].quarterMinutes * 4
    const ovr = overall(s.player)
    this.mpg = minutesFor(ovr, team.rating, this.gameMin) * mpgScale
    // 시즌 중 부상: 결장 경기 비율
    const injured = rng.chance(s.player.injuryProne ? 0.25 : 0.1)
    this.missChance = injured ? rng.range(0.1, 0.4) : 0
    if (injured) this.awards.push('__injured')
    const regular =
      league === 'KBL' ? KBL_GAMES : league === 'NBA' ? NBA_GAMES : 0
    this.lateSkip = s.mods.lateReturn ? Math.round(regular * 0.55) : 0
  }

  game(opp: Team, label: string, playoff = false): boolean {
    const cfg = LEAGUES[this.league]
    const late = !playoff && this.lateSkip > 0
    if (late) this.lateSkip--
    const out = late || this.rng.chance(this.missChance)
    const clutch = playoff && this.s.player.clutch ? 1.5 : 0
    const r = playGame(
      this.rng,
      this.s.player,
      cfg.level,
      out ? 0 : this.mpg,
      this.gameMin,
      this.team.rating,
      opp.rating,
      cfg.avgScore,
      clutch,
    )
    const p: Played = {
      label,
      opp,
      myScore: r.myScore,
      oppScore: r.oppScore,
      box: r.box,
    }
    this.played.push(p)
    addLine(playoff ? this.po : this.stats, r.box)
    if (!playoff) {
      if (r.win) this.wins++
      else this.losses++
    }
    this.finale = p
    return r.win
  }

  // 유저 팀이 포함된 시리즈만 경기를 시뮬레이션하고, 나머지는 전력 기반 확률로 처리
  series(a: Team, b: Team, bestOf: number, label: string): Team {
    const need = Math.ceil(bestOf / 2)
    let wa = 0
    let wb = 0
    const mine = a.id === this.team.id || b.id === this.team.id
    const opp = a.id === this.team.id ? b : a
    let n = 1
    while (wa < need && wb < need) {
      const name = bestOf > 1 ? `${label} ${n}차전` : label
      const aWin = mine
        ? this.game(opp, name, true) === (a.id === this.team.id)
        : this.rng.chance(sigmoid((a.rating - b.rating) / 6))
      if (aWin) wa++
      else wb++
      n++
    }
    return wa > wb ? a : b
  }

  featured(): GameLog[] {
    const best = this.played
      .filter((p) => p.box.games)
      .reduce<Played | undefined>(
        (m, p) => (!m || gameScore(p.box) > gameScore(m.box) ? p : m),
        undefined,
      )
    const picks = [best, this.finale].filter(
      (p, i, arr): p is Played => !!p && arr.indexOf(p) === i,
    )
    return picks.map((p) => ({
      label: p === best ? `시즌 베스트 (${p.label})` : p.label,
      opponent: p.opp.name,
      myScore: p.myScore,
      oppScore: p.oppScore,
      box: p.box,
      pbp: generatePbp(
        this.rng,
        this.s.player.name,
        this.team.name,
        p.opp.name,
        p.box,
        p.myScore,
        p.oppScore,
        LEAGUES[this.league].quarterMinutes,
      ),
    }))
  }

  share() {
    return this.stats.games
      ? this.stats.minutes / this.stats.games / this.gameMin
      : 0
  }

  winPct() {
    const g = this.wins + this.losses
    return g ? this.wins / g : 0
  }

  // 시즌 영향력: 오버롤 + 출전 비중 + 팀 성적 + 경기력. 수상 경쟁 비교에 쓴다.
  impact(): number {
    const gs = gameScoreAvg(this.stats)
    const expected = (this.share() * this.gameMin * 16) / 36
    return (
      overall(this.s.player) +
      8 * (this.share() - 0.75) +
      10 * (this.winPct() - 0.5) +
      (gs - expected) * 0.15 +
      this.rng.normal(0, 1)
    )
  }

  eligible() {
    const g = this.wins + this.losses
    return g > 0 && this.stats.games >= g * 0.7
  }

  rival(mean: number, sd = 2) {
    return this.rng.normal(mean, sd)
  }

  finalsMvp(finals: StatLine, mean: number, sd = 5): boolean {
    return finals.games > 0 && gameScoreAvg(finals) >= this.rival(mean, sd)
  }
}

function gameScoreAvg(s: StatLine) {
  return s.games ? gameScore(s) / s.games : 0
}

function standings(
  rng: Rng,
  teams: Team[],
  mine: Team,
  myWins: number,
  games: number,
): Team[] {
  const mean = teams.reduce((s, t) => s + t.rating, 0) / teams.length
  const wins = new Map<string, number>()
  for (const t of teams) {
    wins.set(
      t.id,
      t.id === mine.id
        ? myWins
        : rng.binomial(games, sigmoid((t.rating - mean) / 6)),
    )
  }
  return [...teams].sort((a, b) => wins.get(b.id)! - wins.get(a.id)!)
}

// 표준 8강 대진: 1-8, 4-5, 3-6, 2-7
function bracket8(ctx: SeasonCtx, seeds: Team[], rounds: string[]): Team {
  let alive = [0, 7, 3, 4, 2, 5, 1, 6].map((i) => seeds[i])
  let r = 0
  while (alive.length > 1) {
    const next: Team[] = []
    for (let i = 0; i < alive.length; i += 2) {
      next.push(ctx.series(alive[i], alive[i + 1], 7, rounds[r]))
    }
    alive = next
    r++
  }
  return alive[0]
}

function makeTeams(
  rng: Rng,
  list: {
    id: string
    name: string
    strength?: number
    conference?: 'East' | 'West'
  }[],
  base: number,
  sd: number,
): Team[] {
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    conference: t.conference,
    rating: (t.strength ?? base) + rng.normal(0, sd),
  }))
}

function teamOf(teams: Team[], id: string) {
  return teams.find((t) => t.id === id)!
}

const RESULT_LABEL = ['16강', '8강', '4강', '준우승', '우승']

function highSchool(rng: Rng, s: GameState, ctx: SeasonCtxFactory) {
  const teams = makeTeams(rng, HIGH_SCHOOLS, 50, 3)
  const c = ctx(teams, 'HS')
  const others = teams
    .filter((t) => t.id !== c.team.id)
    .sort((a, b) => b.rating - a.rating)
  let best = 0
  for (const name of HS_TOURNAMENTS) {
    const before = c.played.length
    let round = 0
    while (round < 4) {
      const label = `${name} ${['16강', '8강', '준결승', '결승'][round]}`
      const pool = others.slice(0, others.length - round * 4)
      if (!c.game(rng.pick(pool), label)) break
      round++
    }
    best = Math.max(best, round)
    const games = c.played.slice(before)
    const line = emptyLine()
    for (const g of games) addLine(line, g.box)
    if (round === 4) {
      c.awards.push(`${name} 우승`)
      if (line.games && overall(s.player) >= c.team.rating + 2) {
        c.awards.push(`${name} MVP`)
      }
    }
    if (line.games && perGame(line, 'pts') >= c.rival(22, 3)) {
      c.awards.push(`${name} 득점상`)
    }
  }
  return { c, result: [`대회 최고 성적 ${RESULT_LABEL[best]}`], teams }
}

function college(rng: Rng, _s: GameState, ctx: SeasonCtxFactory) {
  const teams = makeTeams(rng, UNIVERSITIES, 58, 2)
  const c = ctx(teams, 'COLLEGE')
  const others = teams.filter((t) => t.id !== c.team.id)
  for (let i = 0; i < UNIV_LEAGUE_GAMES; i++) {
    c.game(others[i % others.length], 'U-리그 정규리그')
  }
  const table = standings(rng, teams, c.team, c.wins, UNIV_LEAGUE_GAMES)
  const rank = table.indexOf(c.team) + 1
  const result = [`정규리그 ${rank}위`]
  if (rank <= 8) {
    const champ = bracket8Single(c, table.slice(0, 8))
    result.push(champ.id === c.team.id ? 'U-리그 우승' : '플레이오프 진출')
    if (champ.id === c.team.id) {
      c.awards.push('U-리그 우승')
      if (c.finalsMvp(finalsLine(c, 'U-리그 챔피언결정전'), 20))
        c.awards.push('U-리그 챔피언결정전 MVP')
    }
  }
  if (c.eligible()) {
    if (c.impact() >= c.rival(68)) c.awards.push('U-리그 MVP')
    if (perGame(c.stats, 'pts') >= c.rival(20, 2))
      c.awards.push('U-리그 득점상')
  }
  return { c, result, teams }
}

// 대학 플레이오프: 8강·4강 단판, 챔피언결정전 3전 2선승
function bracket8Single(c: SeasonCtx, seeds: Team[]): Team {
  const q = [0, 7, 3, 4, 2, 5, 1, 6].map((i) => seeds[i])
  const semi: Team[] = []
  for (let i = 0; i < 8; i += 2)
    semi.push(c.series(q[i], q[i + 1], 1, 'U-리그 8강'))
  const fin = [
    c.series(semi[0], semi[1], 1, 'U-리그 4강'),
    c.series(semi[2], semi[3], 1, 'U-리그 4강'),
  ]
  return c.series(fin[0], fin[1], 3, 'U-리그 챔피언결정전')
}

function kbl(rng: Rng, s: GameState, ctx: SeasonCtxFactory) {
  const teams = makeTeams(rng, KBL_TEAMS, 66, 3)
  const c = ctx(teams, 'KBL')
  const others = teams.filter((t) => t.id !== c.team.id)
  for (let i = 0; i < KBL_GAMES; i++) {
    c.game(others[i % others.length], 'KBL 정규리그')
  }
  const table = standings(rng, teams, c.team, c.wins, KBL_GAMES)
  const rank = table.indexOf(c.team) + 1
  const result = [`정규리그 ${rank}위`]
  if (rank <= 6) {
    // 1·2위 4강 직행, 6강·4강 5전 3선승, 챔피언결정전 7전 4선승
    const w36 = c.series(table[2], table[5], 5, '6강 플레이오프')
    const w45 = c.series(table[3], table[4], 5, '6강 플레이오프')
    const f1 = c.series(table[0], w45, 5, '4강 플레이오프')
    const f2 = c.series(table[1], w36, 5, '4강 플레이오프')
    const semis = [table[0], table[1], w36, w45]
    const champ = c.series(f1, f2, 7, '챔피언결정전')
    if (champ.id === c.team.id) {
      result.push('챔피언결정전 우승')
      c.awards.push('KBL 챔피언결정전 우승')
      if (c.finalsMvp(finalsLine(c, '챔피언결정전'), 32)) {
        c.awards.push('KBL 챔피언결정전 MVP')
      }
    } else if (f1.id === c.team.id || f2.id === c.team.id) {
      result.push('챔피언결정전 준우승')
    } else if (semis.some((t) => t.id === c.team.id)) {
      result.push('4강 플레이오프 탈락')
    } else {
      result.push('6강 플레이오프 탈락')
    }
  }
  if (c.eligible()) {
    const imp = c.impact()
    if (imp >= c.rival(82, 1.5)) c.awards.push('KBL 국내선수 MVP')
    if (imp >= c.rival(76, 1.5)) c.awards.push('KBL 베스트5')
    if (imp >= c.rival(70)) c.awards.push('KBL 올스타')
    if (isRookie(s) && imp >= c.rival(63, 2.5)) c.awards.push('KBL 신인선수상')
    if (c.share() < 0.55 && imp >= c.rival(66)) c.awards.push('KBL 식스맨상')
    if (c.share() > 0.5 && s.player.attrs.defense >= c.rival(83, 3)) {
      c.awards.push('KBL 최우수수비상')
    }
    if (perGame(c.stats, 'pts') >= c.rival(21))
      c.awards.push('KBL 국내선수 득점 1위')
    if (improvement(s) >= c.rival(4.5, 1)) c.awards.push('KBL 기량발전상')
  }
  return { c, result, teams }
}

function nba(rng: Rng, s: GameState, ctx: SeasonCtxFactory) {
  const teams = makeTeams(rng, NBA_TEAMS, 85, 3.5)
  const twoWay = !!s.contract?.twoWay
  const c = ctx(teams, 'NBA', twoWay ? 0.5 : 1)
  const others = teams.filter((t) => t.id !== c.team.id)
  for (let i = 0; i < NBA_GAMES; i++) {
    const label = 'NBA 정규시즌'
    // 투웨이 계약: NBA 출전 경기 수 제한, 나머지는 G리그에서 뛴다
    if (twoWay && i >= TWO_WAY_GAME_LIMIT) {
      const t = rng.pick(others)
      if (rng.chance(sigmoid((c.team.rating - t.rating) / 6))) c.wins++
      else c.losses++
      continue
    }
    c.game(rng.pick(others), label)
  }
  const conf = teams.filter((t) => t.conference === c.team.conference)
  const table = standings(rng, conf, c.team, c.wins, NBA_GAMES)
  const rank = table.indexOf(c.team) + 1
  const result = [`${c.team.conference === 'East' ? '동부' : '서부'} ${rank}위`]
  if (rank <= 8) {
    const rounds = ['1라운드', '컨퍼런스 세미파이널', '컨퍼런스 파이널']
    const mine = bracket8(c, table.slice(0, 8), rounds)
    const otherConf = teams.filter((t) => t.conference !== c.team.conference)
    const other = [...otherConf].sort((a, b) => b.rating - a.rating)[
      rng.int(0, 2)
    ]
    if (mine.id === c.team.id) {
      const champ = c.series(mine, other, 7, 'NBA 파이널')
      if (champ.id === c.team.id) {
        result.push('NBA 챔피언')
        c.awards.push('NBA 챔피언')
        // N(24.7, 5.8): 게임스코어 16/20/23/26/29/32 → 약 7/21/38/59/77/90%
        if (c.finalsMvp(finalsLine(c, 'NBA 파이널'), 24.7, 5.8)) {
          c.awards.push('NBA 파이널 MVP')
        }
      } else {
        result.push('NBA 파이널 준우승')
      }
    } else {
      const lastRound = c.played.at(-1)?.label ?? ''
      result.push(
        `${rounds.find((r) => lastRound.startsWith(r)) ?? '플레이오프'} 탈락`,
      )
    }
  }
  if (c.eligible()) {
    const imp = c.impact()
    if (imp >= c.rival(96, 1.8)) c.awards.push('NBA MVP')
    if (imp >= c.rival(93, 1)) c.awards.push('All-NBA 퍼스트팀')
    else if (imp >= c.rival(91.5, 1)) c.awards.push('All-NBA 세컨드팀')
    else if (imp >= c.rival(90, 1)) c.awards.push('All-NBA 서드팀')
    if (imp >= c.rival(89, 1.5)) c.awards.push('NBA 올스타')
    if (isRookie(s) && imp >= c.rival(86)) c.awards.push('NBA 올해의 신인')
    if (c.share() > 0.6 && s.player.attrs.defense >= c.rival(95)) {
      c.awards.push('NBA 올해의 수비수')
    }
    if (c.share() < 0.55 && imp >= c.rival(87, 1.5))
      c.awards.push('NBA 식스맨상')
    if (improvement(s) >= c.rival(5, 1)) c.awards.push('NBA 기량발전상')
    if (perGame(c.stats, 'pts') >= c.rival(31, 1.5)) c.awards.push('NBA 득점왕')
  }
  return { c, result, teams }
}

function finalsLine(c: SeasonCtx, prefix: string) {
  const line = emptyLine()
  for (const p of c.played) if (p.label.startsWith(prefix)) addLine(line, p.box)
  return line
}

function isRookie(s: GameState) {
  return !s.history.some((h) => h.stage === s.stage)
}

function improvement(s: GameState) {
  const prev = s.history.at(-1)
  return prev ? overall(s.player) - prev.ovr : 0
}

type SeasonCtxFactory = (
  teams: Team[],
  league: League,
  mpgScale?: number,
) => SeasonCtx

// 상무: KBL D리그 참가. 상대는 프로 구단 2군.
function military(rng: Rng, _s: GameState, ctx: SeasonCtxFactory) {
  const teams = makeTeams(
    rng,
    [
      { id: 'sangmu', name: '국군체육부대', strength: 64 },
      ...KBL_TEAMS.slice(0, 6).map((t) => ({
        id: t.id,
        name: `${t.name} D리그`,
      })),
    ],
    60,
    2,
  )
  const c = ctx(teams, 'MILITARY')
  const others = teams.filter((t) => t.id !== c.team.id)
  for (let i = 0; i < D_LEAGUE_GAMES; i++) {
    c.game(others[i % others.length], 'KBL D리그')
  }
  const table = standings(rng, teams, c.team, c.wins, D_LEAGUE_GAMES)
  const rank = table.indexOf(c.team) + 1
  if (rank === 1) c.awards.push('KBL D리그 우승')
  return { c, result: [`D리그 ${rank}위`], teams }
}

const RUNNERS = {
  HS: highSchool,
  COLLEGE: college,
  KBL: kbl,
  NBA: nba,
  MILITARY: military,
}

// 리그 베스트 팀: 포지션별 3명(퍼스트~서드)을 생성하고, 수상에 따라 유저를 끼워 넣는다.
const POSITIONS = Object.keys(POSITION_LABELS) as Position[]
// 베스트 팀 기준 오버롤 [퍼스트, 세컨드, 서드]
const TIER_OVR: Partial<Record<League, [number, number, number]>> = {
  COLLEGE: [70, 66, 63],
  KBL: [78, 74, 71],
  NBA: [94, 91, 89],
}

function myTier(league: League, awards: string[]): number {
  const has = (p: string) => awards.some((a) => a.includes(p))
  if (league === 'COLLEGE')
    return has('U-리그 MVP')
      ? 0
      : has('득점상')
        ? 1
        : has('챔피언결정전 MVP')
          ? 2
          : -1
  if (league === 'KBL')
    return has('베스트5')
      ? 0
      : has('올스타')
        ? 1
        : has('득점 1위') || has('식스맨')
          ? 2
          : -1
  if (league === 'NBA')
    return has('퍼스트팀') ? 0 : has('세컨드팀') ? 1 : has('서드팀') ? 2 : -1
  return -1
}

function bestTeams(
  rng: Rng,
  s: GameState,
  c: SeasonCtx,
  teams: Team[],
): BestPlayer[][] | undefined {
  const tiers = TIER_OVR[c.league]
  if (!tiers) return undefined
  const kr = c.league !== 'NBA'
  const name = () =>
    kr
      ? rng.pick(KR_SURNAMES) + rng.pick(KR_GIVEN)
      : `${rng.pick(EN_FIRST)} ${rng.pick(EN_LAST)}`
  const scale = LEAGUES[c.league].avgScore / 80
  const line = (pos: Position, ovr: number) => {
    const big = pos === 'C' || pos === 'PF'
    const guard = pos === 'PG'
    const k = (ovr - tiers[2]) * 0.5
    return {
      pts: +(scale * (14 + k * 1.4 + rng.normal(0, 2))).toFixed(1),
      reb: +(scale * ((big ? 8 : 4) + k * 0.4 + rng.normal(0, 1))).toFixed(1),
      ast: +(
        scale *
        ((guard ? 6 : 2.5) + k * 0.4 + rng.normal(0, 0.8))
      ).toFixed(1),
    }
  }
  const mine = myTier(c.league, c.awards)
  return tiers.map((base, t) =>
    POSITIONS.map((pos): BestPlayer => {
      if (t === mine && pos === s.player.position) {
        return {
          position: pos,
          name: s.player.name,
          team: c.team.name,
          ovr: overall(s.player),
          pts: +perGame(c.stats, 'pts').toFixed(1),
          reb: +perGame(c.stats, 'reb').toFixed(1),
          ast: +perGame(c.stats, 'ast').toFixed(1),
          me: true,
        }
      }
      const ovr = Math.round(base + rng.range(-1, 2))
      const team = rng.pick(teams.filter((x) => x.id !== c.team.id))
      return {
        position: pos,
        name: name(),
        team: team.name,
        ovr,
        ...line(pos, ovr),
      }
    }),
  )
}

export function simulateSeason(rng: Rng, s: GameState): SeasonRecord {
  const ovr = overall(s.player)
  const base: SeasonRecord = {
    year: s.year,
    age: s.age,
    stage: s.stage,
    team: s.teamName,
    ovr,
    stats: emptyLine(),
    wins: 0,
    losses: 0,
    result: [],
    awards: [],
    featured: [],
    minutesShare: 0.3,
  }
  if (s.stage === 'FREE' || s.stage === 'RETIRED') {
    return { ...base, result: ['무소속으로 개인 훈련'] }
  }
  if (s.stage === 'MILITARY' && s.service.kind === 'active') {
    return { ...base, result: ['현역 복무'], minutesShare: 0 }
  }
  const factory: SeasonCtxFactory = (teams, league, mpgScale) =>
    new SeasonCtx(rng, s, league, teamOf(teams, s.teamId), mpgScale)
  const { c, result, teams } = RUNNERS[s.stage](rng, s, factory)
  const injured = c.awards.includes('__injured')
  const extra = [
    ...(s.mods.lateReturn ? ['전역 후 시즌 중반 합류'] : []),
    ...(injured ? ['부상 결장'] : []),
  ]
  return {
    ...base,
    stats: c.stats,
    playoffStats: c.po.games ? c.po : undefined,
    wins: c.wins,
    losses: c.losses,
    result: [...result, ...extra],
    awards: c.awards.filter((a) => a !== '__injured'),
    featured: c.featured(),
    bestTeams: bestTeams(rng, s, c, teams),
    salary:
      s.contract && s.stage !== 'MILITARY'
        ? { amount: s.contract.salary, currency: s.contract.currency }
        : undefined,
    minutesShare: clamp(c.share(), 0, 1),
  }
}

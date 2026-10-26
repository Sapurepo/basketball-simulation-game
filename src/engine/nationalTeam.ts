import { LEAGUES } from '../data/leagues'
import { generatePbp } from './commentary'
import { overall } from './player'
import type { Rng } from './rng'
import { addLine, emptyLine, minutesFor, playGame } from './sim'
import type { GameLog, GameState, StatLine } from './types'

// 국가대표 전력은 게임 밸런스용 가상 수치
const STRONG = [
  { name: '중국', rating: 73 },
  { name: '일본', rating: 72 },
  { name: '이란', rating: 70 },
  { name: '필리핀', rating: 70 },
  { name: '레바논', rating: 69 },
  { name: '요르단', rating: 68 },
]
const WEAK = [
  { name: '대만', rating: 64 },
  { name: '카타르', rating: 62 },
  { name: '카자흐스탄', rating: 60 },
  { name: '인도네시아', rating: 57 },
  { name: '몽골', rating: 55 },
  { name: '바레인', rating: 54 },
]
const KOREA_RATING = 66

export type Medal = 'gold' | 'silver' | 'bronze'

export interface AsianGamesResult {
  medal?: Medal
  finish: string
  stats: StatLine
  last: GameLog
}

export const isAsianGamesYear = (year: number) =>
  year >= 2030 && (year - 2030) % 4 === 0

// 국가대표 선발: 국내 최상위권 오버롤이면 발탁
export function selectedForNational(rng: Rng, s: GameState) {
  return overall(s.player) >= 70 + rng.normal(0, 1.5)
}

export function playAsianGames(
  rng: Rng,
  s: GameState,
  year: number,
): AsianGamesResult {
  const cfg = LEAGUES.NATIONAL
  const gameMin = cfg.quarterMinutes * 4
  const ovr = overall(s.player)
  const mpg = minutesFor(ovr, cfg.level, gameMin)
  const korea = KOREA_RATING + rng.normal(0, 2)
  const stats = emptyLine()
  const strong = rng.shuffle([...STRONG])
  const weak = rng.shuffle([...WEAK])

  let last!: GameLog
  const play = (label: string, opp: { name: string; rating: number }) => {
    const r = playGame(
      rng,
      s.player,
      cfg.level,
      mpg,
      gameMin,
      korea,
      opp.rating,
      cfg.avgScore,
      s.player.clutch ? 1.5 : 0,
    )
    addLine(stats, r.box)
    last = {
      label: `${year} 아시안게임 ${label}`,
      opponent: opp.name,
      myScore: r.myScore,
      oppScore: r.oppScore,
      box: r.box,
      pbp: [],
    }
    return r.win
  }

  // 조별리그 3경기 중 2승 이상이면 8강 진출
  const group = [weak[0], weak[1], strong[3]]
  const groupWins = group.filter((o, i) =>
    play(`조별리그 ${i + 1}차전`, o),
  ).length
  let medal: Medal | undefined
  let finish = '조별리그 탈락'
  if (groupWins >= 2) {
    if (!play('8강', strong[2])) finish = '8강 탈락'
    else if (!play('4강', strong[1])) {
      // 4강에서 지면 동메달 결정전
      const bronze = play('동메달 결정전', strong[4])
      medal = bronze ? 'bronze' : undefined
      finish = bronze ? '동메달' : '4위'
    } else {
      const gold = play('결승', strong[0])
      medal = gold ? 'gold' : 'silver'
      finish = gold ? '금메달' : '은메달'
    }
  }
  last.pbp = generatePbp(
    rng,
    s.player.name,
    '대한민국',
    last.opponent,
    last.box,
    last.myScore,
    last.oppScore,
    cfg.quarterMinutes,
  )
  return { medal, finish, stats, last }
}

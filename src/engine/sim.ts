import { clamp, sigmoid, type Rng } from './rng'
import { overall } from './player'
import type { Player, StatLine } from './types'

export const emptyLine = (): StatLine => ({
  games: 0,
  minutes: 0,
  pts: 0,
  reb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  fgm: 0,
  fga: 0,
  tpm: 0,
  tpa: 0,
  ftm: 0,
  fta: 0,
})

export function addLine(a: StatLine, b: StatLine): void {
  for (const k of Object.keys(a) as (keyof StatLine)[]) a[k] += b[k]
}

export function perGame(s: StatLine, k: keyof StatLine): number {
  return s.games ? s[k] / s.games : 0
}

export function gameScore(b: StatLine): number {
  return b.pts + 0.7 * b.reb + 0.9 * b.ast + 1.2 * (b.stl + b.blk)
}

// 평균 출전시간: 팀 내 주전 기준(level) 대비 오버롤로 결정
export function minutesFor(ovr: number, level: number, gameMin: number) {
  return gameMin * clamp(0.12 + 0.75 * sigmoid((ovr - level) / 4), 0.1, 0.9)
}

export function playerBox(
  rng: Rng,
  p: Player,
  level: number,
  mpg: number,
): StatLine {
  const a = p.attrs
  const r = (v: number) => v - level
  // 비율 = 기준값 × 배율^(능력치 - 무대 기준). 약점 능력치도 0 으로 붕괴하지 않는다.
  const rate = (base: number, k: number, v: number, lo: number, hi: number) =>
    clamp(base * Math.pow(k, r(v)), lo, hi)
  const min = clamp(rng.normal(mpg, mpg * 0.12), 0, mpg * 1.3)
  const f = min / 36

  const fga = rng.poisson(
    f * rate(14, 1.025, Math.max(a.shooting, a.finishing), 5, 25),
  )
  const threeRate = clamp(0.35 + 0.012 * (a.shooting - a.finishing), 0.02, 0.65)
  const tpa = rng.binomial(fga, threeRate)
  const twoA = fga - tpa
  const tpm = rng.binomial(tpa, clamp(0.33 + 0.004 * r(a.shooting), 0.2, 0.46))
  const twoM = rng.binomial(
    twoA,
    clamp(0.48 + 0.005 * r(a.finishing), 0.36, 0.66),
  )
  const fta = rng.poisson(f * rate(3.5, 1.04, a.finishing, 0.5, 11))
  const ftm = rng.binomial(fta, clamp(0.6 + 0.004 * a.shooting, 0.45, 0.93))
  const big = p.position === 'PF' || p.position === 'C'

  return {
    games: 1,
    minutes: Math.round(min),
    pts: twoM * 2 + tpm * 3 + ftm,
    reb: rng.poisson(f * rate(8, 1.035, a.rebounding, 2, 17)),
    ast: rng.poisson(f * rate(4.5, 1.03, a.playmaking, 1, 10)),
    // ponytail: 스피드는 스틸에만 반영. 속공 득점까지 넣으려면 fga 쪽도 손봐야 한다
    stl: rng.poisson(f * rate(1.2, 1.03, (a.defense + a.speed) / 2, 0.3, 3)),
    blk: rng.poisson(f * rate(big ? 1.2 : 0.4, 1.04, a.defense, 0.1, 4)),
    fgm: twoM + tpm,
    fga,
    tpm,
    tpa,
    ftm,
    fta,
  }
}

export interface GameResult {
  box: StatLine
  myScore: number
  oppScore: number
  win: boolean
}

// 팀 전력 = 팀 기본 전력 + 유저 선수 기여. 경기력(게임스코어)이 승률에 소폭 반영된다.
export function playGame(
  rng: Rng,
  p: Player,
  level: number,
  mpg: number,
  gameMin: number,
  teamRating: number,
  oppRating: number,
  avgScore: number,
  clutchBoost = 0,
): GameResult {
  const box = mpg > 0 ? playerBox(rng, p, level, mpg) : emptyLine()
  if (mpg <= 0) box.games = 0
  const share = box.minutes / gameMin
  const impact = (overall(p) - level) * share * 0.3
  const perf = (gameScore(box) - expectedGameScore(mpg)) * 0.05
  const edge = teamRating + impact + perf + clutchBoost - oppRating
  const win = rng.chance(sigmoid(edge / 6))
  const margin = Math.max(1, Math.round(Math.abs(rng.normal(edge * 0.8, 9))))
  const loser = Math.round(rng.normal(avgScore - margin / 2, 6))
  const winner = loser + margin
  const myScore = Math.max(win ? winner : loser, box.pts)
  return {
    box,
    myScore,
    oppScore: win
      ? Math.min(loser, myScore - 1)
      : Math.max(winner, myScore + 1),
    win,
  }
}

function expectedGameScore(mpg: number) {
  return (mpg / 36) * 16
}

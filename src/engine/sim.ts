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
// 출전시간용 OVR: 운동능력(체력)이 OVR 과 차이 나는 만큼의 15% 를 얹는다
export function minutesOvr(p: Player) {
  const ovr = overall(p)
  return ovr + (p.attrs.athleticism - ovr) * 0.15
}
// 시즌 부상 확률 배율: 운동능력 50 이면 1, 90 이면 0.8, 20 이면 1.15
export const injuryScale = (p: Player) => 1.25 - p.attrs.athleticism / 200

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

  // 속공: 스피드가 공격 기회의 15%. 돌파 득점·파울 유도는 돌파 2 : 스피드 1
  const drive = (a.finishing * 2 + a.speed) / 3
  const fga = rng.poisson(
    f *
      rate(
        14,
        1.025,
        Math.max(a.shooting, a.finishing) * 0.85 + a.speed * 0.15,
        5,
        25,
      ),
  )
  const threeRate = clamp(0.35 + 0.012 * (a.shooting - a.finishing), 0.02, 0.65)
  const tpa = rng.binomial(fga, threeRate)
  const twoA = fga - tpa
  const tpm = rng.binomial(tpa, clamp(0.33 + 0.004 * r(a.shooting), 0.2, 0.46))
  const twoM = rng.binomial(twoA, clamp(0.48 + 0.005 * r(drive), 0.36, 0.66))
  const fta = rng.poisson(f * rate(3.5, 1.04, drive, 0.5, 11))
  const ftm = rng.binomial(fta, clamp(0.6 + 0.004 * a.shooting, 0.45, 0.93))
  const big = p.position === 'PF' || p.position === 'C'

  return {
    games: 1,
    minutes: Math.round(min),
    pts: twoM * 2 + tpm * 3 + ftm,
    // 운동능력: 리바운드 1/3, 블록 1/2
    reb: rng.poisson(
      f * rate(8, 1.035, (a.rebounding * 2 + a.athleticism) / 3, 2, 17),
    ),
    ast: rng.poisson(f * rate(4.5, 1.03, a.playmaking, 1, 10)),
    stl: rng.poisson(f * rate(1.2, 1.03, (a.defense + a.speed) / 2, 0.3, 3)),
    blk: rng.poisson(
      f * rate(big ? 1.2 : 0.4, 1.04, (a.defense + a.athleticism) / 2, 0.1, 4),
    ),
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

import { HIGH_SCHOOLS } from '../data/schools'
import { applyDrill, applyEvent, buildOffseason, DRILL_KINDS } from './events'
import { grow, overall } from './player'
import { Rng } from './rng'
import { simulateSeason } from './season'
import type { AttrKey, DrillKind, GameState, Player } from './types'

export const START_YEAR = 2027
export const START_AGE = 16

export function newGame(
  seed: number,
  player: Player,
  schoolId: string,
  focus?: AttrKey,
): GameState {
  const school = HIGH_SCHOOLS.find((h) => h.id === schoolId)!
  return {
    version: 1,
    rng: seed >>> 0,
    year: START_YEAR,
    age: START_AGE,
    stage: 'HS',
    teamId: school.id,
    teamName: school.name,
    stageYear: 0,
    player,
    history: [],
    events: [],
    mods: { growthBonus: 0, focus },
    earnings: { KRW: 0, USD: 0 },
    peakOvr: overall(player),
    service: { status: 'pending' },
    honors: [],
  }
}

// 순수 함수 형태: 입력 상태를 복제해 다음 상태를 돌려준다
function step(
  state: GameState,
  fn: (rng: Rng, s: GameState) => void,
): GameState {
  const s = structuredClone(state)
  const rng = new Rng(s.rng)
  fn(rng, s)
  s.rng = rng.state
  return s
}

export function advanceSeason(state: GameState): GameState {
  if (state.stage === 'RETIRED' || state.events.length) return state
  return step(state, (rng, s) => {
    const rec = simulateSeason(rng, s)
    s.history.push(rec)
    if (rec.salary) s.earnings[rec.salary.currency] += rec.salary.amount
    if (s.contract) s.contract.yearsLeft--

    const injuredPenalty = rec.result.includes('부상 결장') ? -1 : 0
    // 현역 복무: 실전 공백으로 기량 하락
    const armyPenalty =
      s.stage === 'MILITARY' && s.service.kind === 'active' ? -2.5 : 0
    grow(
      rng,
      s.player,
      s.age,
      rec.minutesShare,
      s.mods.focus,
      s.mods.growthBonus + injuredPenalty + armyPenalty,
    )
    s.peakOvr = Math.max(s.peakOvr, overall(s.player))
    s.mods = { growthBonus: 0 }
    s.age++
    s.year++
    s.stageYear++
    s.drillsDone = []
    s.events = buildOffseason(rng, s)
  })
}

export function resolveEvent(state: GameState, optionId: string): GameState {
  if (!state.events.length) return state
  return step(state, (rng, s) => {
    const ev = s.events.shift()!
    applyEvent(rng, s, ev, optionId)
  })
}

// 이번 오프시즌에 아직 하지 않은 훈련 (은퇴하면 없음)
export function availableDrills(s: GameState): DrillKind[] {
  if (s.stage === 'RETIRED') return []
  return DRILL_KINDS.filter((k) => !s.drillsDone?.includes(k))
}

// 훈련 결과 반영: optionId 는 'made:N' 또는 'auto'. 이미 한 훈련이면 그대로 돌려준다
export function playDrill(
  state: GameState,
  kind: DrillKind,
  optionId: string,
): GameState {
  if (!availableDrills(state).includes(kind)) return state
  return step(state, (rng, s) => {
    applyDrill(rng, s, kind, optionId)
    s.drillsDone = [...(s.drillsDone ?? []), kind]
  })
}

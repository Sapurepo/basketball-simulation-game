import { buffed, itemById, itemEffects } from '../data/items'
import { HIGH_SCHOOLS } from '../data/schools'
import {
  applyDrill,
  applyEvent,
  buildOffseason,
  DRILL_KINDS,
  DRILL_MAX,
} from './events'
import { USD_TO_MANWON } from './hallEntry'
import { ethicBonus, grow, overall } from './player'
import { Rng } from './rng'
import { simulateSeason } from './season'
import type { AttrKey, DrillKind, GameState, Player } from './types'

export const START_YEAR = 2027
export const START_AGE = 16
// 자금(만원): 시작 자금과 무대별 시즌 용돈·장학금. 프로는 연봉이 들어온다
export const START_CASH = 300
const ALLOWANCE: Partial<Record<GameState['stage'], number>> = {
  HS: 100,
  COLLEGE: 300,
}

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
    cash: START_CASH,
    items: [],
  }
}

// 순수 함수 형태: 입력 상태를 복제해 다음 상태를 돌려준다.
// 지난 시즌 기록은 쌓인 뒤 바뀌지 않으므로 복제하지 않고 공유한다 (커리어가 길수록 복제 비용이 커진다)
function step(
  state: GameState,
  fn: (rng: Rng, s: GameState) => void,
): GameState {
  const s: GameState = {
    ...structuredClone({ ...state, history: [] }),
    history: [...state.history],
  }
  const rng = new Rng(s.rng)
  fn(rng, s)
  s.rng = rng.state
  return s
}

export function advanceSeason(state: GameState): GameState {
  if (state.stage === 'RETIRED' || state.events.length) return state
  return step(state, (rng, s) => {
    // 치장 아이템 버프는 시즌 동안만 능력치에 얹고 성장 계산 전에 되돌린다
    const fx = itemEffects(s.items)
    const base = s.player.attrs
    s.player.attrs = buffed(base, fx.attrs)
    const rec = simulateSeason(rng, s)
    s.player.attrs = base
    s.history.push(rec)
    s.cash = (s.cash ?? START_CASH) + (ALLOWANCE[s.stage] ?? 0)
    if (rec.salary) {
      s.earnings[rec.salary.currency] += rec.salary.amount
      s.cash +=
        rec.salary.currency === 'USD'
          ? Math.round(rec.salary.amount * USD_TO_MANWON)
          : rec.salary.amount
    }
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
      s.mods.growthBonus +
        injuredPenalty +
        armyPenalty +
        fx.growth +
        ethicBonus(s.player.ethic, (s.drillsDone ?? []).length),
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

// 이번 오프시즌에 아직 할 수 있는 훈련: 은퇴했거나 DRILL_MAX 개를 마쳤으면 없음
export function availableDrills(s: GameState): DrillKind[] {
  const done = s.drillsDone ?? []
  if (s.stage === 'RETIRED' || done.length >= DRILL_MAX) return []
  return DRILL_KINDS.filter((k) => !done.includes(k))
}

// 상점 구입: 자금이 모자라거나 이미 가진 아이템이면 그대로 돌려준다. 치장은 외형에 바로 입힌다
export function buyItem(state: GameState, id: string): GameState {
  const item = itemById(id)
  const cash = state.cash ?? START_CASH
  if (!item || state.items?.includes(id) || cash < item.price) return state
  const s = structuredClone(state)
  s.cash = cash - item.price
  s.items = [...(s.items ?? []), id]
  if (item.slot) s[item.slot] = id
  if (item.acc && s.player.look && !s.player.look.acc.includes(item.acc))
    s.player.look.acc = [...s.player.look.acc, item.acc]
  return s
}

// 치장 착용·해제: 외형(look.acc)에서만 넣고 뺀다. 버프는 보유 기준이라 그대로
export function toggleAccessory(state: GameState, id: string): GameState {
  const acc = itemById(id)?.acc
  const look = state.player.look
  if (!acc || !look || !state.items?.includes(id)) return state
  const s = structuredClone(state)
  const worn = look.acc.includes(acc)
  s.player.look!.acc = worn
    ? look.acc.filter((a) => a !== acc)
    : [...look.acc, acc]
  return s
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

import { advanceSeason, newGame, resolveEvent } from './game'
import { createPlayer, overall } from './player'
import { Rng } from './rng'
import type { GameState, Position } from './types'

// 테스트·밸런스 점검용 자동 플레이어: 합리적인 선택을 고른다
export function botChoice(s: GameState): string {
  const ev = s.events[0]
  const ids = ev.options.map((o) => o.id)
  const has = (id: string) => ids.includes(id)
  switch (ev.kind) {
    case 'collegeChoice':
      if (has('nba')) return 'nba'
      return overall(s.player) >= 66 || !has('stay') ? 'kbl' : 'stay'
    case 'kblFA':
    case 'nbaChallenge':
      return has('nba') ? 'nba' : ids[0]
    case 'nbaFA':
      return ids[0]
    case 'free':
      return has('draft') ? 'draft' : 'tryout'
    case 'retire':
      return s.age >= 37 ? 'retire' : 'stay'
    case 'military':
      return 'sangmu'
    case 'asianGames':
      return 'go'
    case 'training':
      return 'balance'
    default:
      return ids[0]
  }
}

export function playCareer(seed: number, position: Position = 'SF') {
  const rng = new Rng(seed)
  const player = createPlayer(rng, '테스트', position, 'n/a')
  let s = newGame(rng.state, player, 'yongsan')
  for (let i = 0; i < 1000 && s.stage !== 'RETIRED'; i++) {
    s = s.events.length ? resolveEvent(s, botChoice(s)) : advanceSeason(s)
  }
  return s
}

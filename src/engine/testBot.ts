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
    case 'hsGraduate': {
      const us = ids.find((id) => id.startsWith('us:'))
      return us ?? ids[0]
    }
    case 'collegeChoice':
      if (has('nba')) return 'nba'
      return overall(s.player) >= 66 || !has('stay') ? 'kbl' : 'stay'
    case 'kblFA':
    case 'nbaChallenge':
      return has('nba') ? 'nba' : ids[0]
    case 'nbaFA':
      return ids[0]
    // 연장은 거절: FA 시장의 NBA 도전 경로를 그대로 타게 해 실측 기준선을 유지
    case 'extension':
      return 'expire'
    case 'free':
      return has('draft') ? 'draft' : 'tryout'
    case 'retire':
      return s.age >= 41 ? 'retire' : 'stay'
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

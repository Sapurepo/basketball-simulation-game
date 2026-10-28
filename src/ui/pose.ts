import type { GameState } from '../engine/types'

export type Pose =
  | 'idle'
  | 'shoot'
  | 'celebrate'
  | 'cheer'
  | 'sad'
  | 'injured'
  | 'salute'
  | 'wave'
  | 'guard'
  | 'trophy'

const TEAM_COLORS = [
  '#1f5fbf',
  '#d6262f',
  '#1d8a57',
  '#6b3fb5',
  '#e08a12',
  '#0f8a9c',
  '#c23b80',
  '#3b4a63',
  '#b5891f',
  '#e04f2b',
]

export interface Kit {
  jersey: string
  number: string
}

export function teamKit(teamId: string): Kit {
  let h = 0
  for (const c of teamId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { jersey: TEAM_COLORS[h % TEAM_COLORS.length], number: '#ffffff' }
}

const NATIONAL: Kit = { jersey: '#d6262f', number: '#ffffff' }
const SANGMU: Kit = { jersey: '#4b5d3a', number: '#e6d38a' }
const PLAIN: Kit = { jersey: '#8b97ab', number: '#ffffff' }

// 상황별 포즈와 유니폼 고르기
export function pickPose(s: GameState): { pose: Pose; kit: Kit } {
  const ev = s.events[0]
  const last = s.history.at(-1)
  const kit =
    s.stage === 'MILITARY'
      ? SANGMU
      : s.stage === 'FREE' || s.stage === 'RETIRED'
        ? PLAIN
        : teamKit(s.teamId)
  if (s.stage === 'RETIRED') return { pose: 'wave', kit }
  if (ev?.kind === 'military') return { pose: 'salute', kit }
  if (ev?.data?.game) {
    const medal = /금메달|은메달|동메달/.test(ev.title)
    return { pose: medal ? 'celebrate' : 'sad', kit: NATIONAL }
  }
  if (ev?.kind === 'notice') {
    if (/미지명|불합격|실패|과부하/.test(ev.title)) return { pose: 'sad', kit }
    if (s.stage === 'MILITARY') return { pose: 'salute', kit }
    return { pose: 'cheer', kit }
  }
  if (s.stage === 'MILITARY') return { pose: 'salute', kit }
  if (ev && last) {
    if (last.awards.some((a) => /우승|챔피언|MVP/.test(a))) {
      return { pose: 'celebrate', kit }
    }
    if (last.result.includes('부상 결장')) return { pose: 'injured', kit }
  }
  return { pose: 'idle', kit }
}

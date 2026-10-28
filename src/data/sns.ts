import { Rng } from '../engine/rng'
import type { SeasonRecord, Stage } from '../engine/types'
import { T, type Text } from '../i18n'

// 시즌 결과 아래 가상 팬 반응. 저장하지 않고 표시할 때 시즌 기록으로 만든다.
// 댓글은 실제 인물·구단 비방 없이 응원·아쉬움만. {name}·{team}·{pts} 치환
type Mood =
  'champ' | 'mvp' | 'injury' | 'moved' | 'military' | 'slump' | 'hot' | 'base'

export const SNS_TEXT: Record<Mood, string[]> = {
  champ: [
    '{name} 우승 축하합니다!!',
    '이 맛에 {team} 응원한다',
    '반지 하나 더 가자',
  ],
  mvp: [
    'MVP는 {name} 말고 누가 있음?',
    '{name} 시대가 왔다',
    '역사에 남을 시즌',
  ],
  injury: [
    '{name} 빨리 회복하길...',
    '건강이 최우선입니다',
    '돌아올 때까지 기다릴게요',
  ],
  moved: [
    '{team}에 온 걸 환영해요 {name}!',
    '유니폼 벌써 샀습니다',
    '새 팀에서도 잘하자',
  ],
  military: [
    '{name} 무사히 전역하길',
    '충성! 몸 건강히',
    '제대하면 바로 직관 간다',
  ],
  slump: [
    '요즘 {name} 무슨 일 있나...',
    '다음 시즌엔 반등하자',
    '그래도 응원합니다',
  ],
  hot: [
    '평균 {pts}점 실화?',
    '{name} 오늘도 미쳤다',
    '{name} 하이라이트 무한 반복 중',
  ],
  base: [
    '{name} 이번 시즌도 수고했어요',
    '{team} 화이팅!',
    '다음 시즌이 기대된다',
  ],
}

const USERS = [
  'hoopfan',
  'courtside_7',
  'buzzer_beater',
  'rimrocker',
  'dunk_daily',
  'swish99',
]

// 무대별 좋아요 기준 (KBL < NBA)
const LIKES: Record<Stage, number> = {
  HS: 30,
  COLLEGE: 400,
  KBL: 3000,
  NBA: 60000,
  MILITARY: 800,
  FREE: 50,
  RETIRED: 0,
}

export function mood(rec: SeasonRecord, prev?: SeasonRecord): Mood {
  const ppg = rec.stats.games ? rec.stats.pts / rec.stats.games : 0
  if (rec.awards.some((a) => a.endsWith(' 우승') || a === 'NBA 챔피언'))
    return 'champ'
  if (rec.awards.some((a) => a.includes('MVP'))) return 'mvp'
  if (rec.result.includes('부상 결장')) return 'injury'
  if (prev && prev.team !== rec.team) return 'moved'
  if (rec.stage === 'MILITARY') return 'military'
  if (rec.stats.games && (ppg < 5 || rec.minutesShare < 0.3)) return 'slump'
  if (ppg >= 20) return 'hot'
  return 'base'
}

// ponytail: 시즌별 고정 시드라 같은 시즌은 늘 같은 반응. 저장은 안 한다
export function fanReaction(
  name: string,
  rec: SeasonRecord,
  prev?: SeasonRecord,
) {
  const rng = new Rng(rec.year * 100 + rec.age)
  const m = mood(rec, prev)
  const v = {
    name,
    team: T(rec.team),
    pts: rec.stats.games ? (rec.stats.pts / rec.stats.games).toFixed(1) : '0',
  }
  const pool =
    m === 'base'
      ? rng.shuffle([...SNS_TEXT.base]).slice(0, 3)
      : [...rng.shuffle([...SNS_TEXT[m]]).slice(0, 2), rng.pick(SNS_TEXT.base)]
  const users = rng.shuffle([...USERS])
  const likes = Math.round(
    LIKES[rec.stage] *
      (1 + 0.6 * rec.awards.length) *
      (rec.ovr / 70) ** 4 *
      rng.range(0.8, 1.25),
  )
  return {
    likes,
    comments: pool.map((k, i) => ({ user: users[i], text: { k, v } as Text })),
  }
}

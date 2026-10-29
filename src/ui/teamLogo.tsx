import { useState } from 'react'
import { tr } from '../i18n'
import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import { flagURL } from './flagArt'
import { teamKit } from './pose'

// 프로 구단만 로고가 있다. 학교·상무 등은 팀 색 배지로 대체.
const PRO = new Map<string, string>([
  ...KBL_TEAMS.map((t): [string, string] => [t.id, `/logos/kbl/${t.id}.svg`]),
  ...NBA_TEAMS.map((t): [string, string] => [t.id, `/logos/nba/${t.id}.svg`]),
])
const BY_NAME = new Map(
  [...KBL_TEAMS, ...NBA_TEAMS].map((t) => [t.name, PRO.get(t.id)!]),
)
const NAME = new Map([...KBL_TEAMS, ...NBA_TEAMS].map((t) => [t.id, t.name]))

export function TeamLogo({
  teamId,
  name = '',
  size = 28,
}: {
  teamId?: string
  name?: string
  size?: number
}) {
  // 로고 파일을 못 불러오면 배지로 대체
  const [broken, setBroken] = useState<string>()
  const src = (teamId && PRO.get(teamId)) || BY_NAME.get(name)
  if (src && src !== broken) {
    return (
      <img
        className="logo"
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(src)}
      />
    )
  }
  // 아시안게임 국가대표는 픽셀 국기
  const flag = flagURL(name)
  if (flag)
    return (
      <img className="logo flag" src={flag} alt="" width={size} height={size} />
    )
  return (
    <span
      className="logo badge"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: teamKit(teamId ?? name).jersey,
      }}
      aria-hidden
    >
      {tr((name || (teamId && NAME.get(teamId)) || '').trim()).charAt(0)}
    </span>
  )
}

export function LeagueLogo({
  league,
  height = 20,
}: {
  league: 'kbl' | 'nba'
  height?: number
}) {
  const [broken, setBroken] = useState(false)
  if (broken) return <b>{league.toUpperCase()}</b>
  return (
    <img
      className="league"
      src={`/logos/${league}.svg`}
      alt={league.toUpperCase()}
      height={height}
      onError={() => setBroken(true)}
    />
  )
}

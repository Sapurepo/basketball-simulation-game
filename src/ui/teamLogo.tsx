import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import { teamKit } from './pose'

// 프로 구단만 로고가 있다. 학교·상무 등은 팀 색 배지로 대체.
const PRO = new Map<string, string>([
  ...KBL_TEAMS.map((t): [string, string] => [t.id, `/logos/kbl/${t.id}.svg`]),
  ...NBA_TEAMS.map((t): [string, string] => [t.id, `/logos/nba/${t.id}.svg`]),
])
const BY_NAME = new Map(
  [...KBL_TEAMS, ...NBA_TEAMS].map((t) => [t.name, PRO.get(t.id)!]),
)

export function TeamLogo({
  teamId,
  name = '',
  size = 28,
}: {
  teamId?: string
  name?: string
  size?: number
}) {
  const src = (teamId && PRO.get(teamId)) || BY_NAME.get(name)
  if (src) {
    return (
      <img
        className="logo"
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
      />
    )
  }
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
      {name.trim().charAt(0)}
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
  return (
    <img
      className="league"
      src={`/logos/${league}.svg`}
      alt={league.toUpperCase()}
      height={height}
    />
  )
}

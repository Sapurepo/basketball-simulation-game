import type { BestPlayer, Honor, SeasonRecord } from '../engine/types'
import { avg, pct, seasonLabel, STAGE_LABEL } from './format'
import { TeamLogo } from './teamLogo'

export function SeasonTable({ history }: { history: SeasonRecord[] }) {
  if (!history.length) return <p className="muted">아직 기록이 없습니다.</p>
  return (
    <div className="scroll-x">
      <table>
        <thead>
          <tr>
            <th>시즌</th>
            <th>나이</th>
            <th>무대</th>
            <th>팀</th>
            <th>OVR</th>
            <th>경기</th>
            <th>분</th>
            <th>득점</th>
            <th>리바</th>
            <th>어시</th>
            <th>FG%</th>
            <th>3P%</th>
            <th>성적</th>
          </tr>
        </thead>
        <tbody>
          {[...history].reverse().map((h) => (
            <tr key={h.year}>
              <td>{seasonLabel(h)}</td>
              <td>{h.age}</td>
              <td>{STAGE_LABEL[h.stage]}</td>
              <td>
                <span className="row nowrap">
                  <TeamLogo name={h.team} size={18} />
                  {h.team}
                </span>
              </td>
              <td>{h.ovr}</td>
              <td>{h.stats.games}</td>
              <td>{avg(h.stats, 'minutes')}</td>
              <td>{avg(h.stats, 'pts')}</td>
              <td>{avg(h.stats, 'reb')}</td>
              <td>{avg(h.stats, 'ast')}</td>
              <td>{pct(h.stats.fgm, h.stats.fga)}</td>
              <td>{pct(h.stats.tpm, h.stats.tpa)}</td>
              <td className="left">{h.result.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TrophyCase({
  history,
  honors,
}: {
  history: SeasonRecord[]
  honors: Honor[]
}) {
  const counts = new Map<string, number[]>()
  const add = (name: string, year: number) =>
    counts.set(name, [...(counts.get(name) ?? []), year])
  for (const h of history) for (const a of h.awards) add(a, h.year)
  for (const h of honors) add(h.name, h.year)
  if (!counts.size) return <p className="muted">아직 수상 기록이 없습니다.</p>
  const rank = (a: string) =>
    a.includes('파이널 MVP')
      ? 0
      : a.startsWith('NBA') || a.startsWith('All-NBA')
        ? 1
        : a.startsWith('KBL') || a.startsWith('아시안게임')
          ? 2
          : 3
  return (
    <ul className="trophies">
      {[...counts.entries()]
        .sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].length - a[1].length)
        .map(([name, years]) => (
          <li key={name} className={rank(name) === 0 ? 'gold' : undefined}>
            <b>{name}</b>
            <span className="count">×{years.length}</span>
            <small className="muted">{years.join(', ')}</small>
          </li>
        ))}
    </ul>
  )
}

const TIER_LABEL = ['퍼스트 팀', '세컨드 팀', '서드 팀']

export function BestTeams({ teams }: { teams: BestPlayer[][] }) {
  return (
    <div className="best">
      {teams.map((team, t) => (
        <div key={t}>
          <h3 className={t === 0 ? 'gold-ink' : undefined}>{TIER_LABEL[t]}</h3>
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>POS</th>
                  <th className="left">선수</th>
                  <th className="left">팀</th>
                  <th>OVR</th>
                  <th>득점</th>
                  <th>리바</th>
                  <th>어시</th>
                </tr>
              </thead>
              <tbody>
                {team.map((b) => (
                  <tr key={b.position} className={b.me ? 'me' : undefined}>
                    <td>{b.position}</td>
                    <td className="left">{b.name}</td>
                    <td className="left">
                      <span className="row nowrap">
                        <TeamLogo name={b.team} size={18} />
                        {b.team}
                      </span>
                    </td>
                    <td>{b.ovr}</td>
                    <td>{b.pts.toFixed(1)}</td>
                    <td>{b.reb.toFixed(1)}</td>
                    <td>{b.ast.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

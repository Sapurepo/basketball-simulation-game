import type { SeasonRecord } from '../engine/types'
import { avg, pct, seasonLabel, STAGE_LABEL } from './format'

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
              <td>{h.team}</td>
              <td>{h.ovr}</td>
              <td>{h.stats.games}</td>
              <td>{avg(h.stats, 'minutes')}</td>
              <td>{avg(h.stats, 'pts')}</td>
              <td>{avg(h.stats, 'reb')}</td>
              <td>{avg(h.stats, 'ast')}</td>
              <td>{pct(h.stats.fgm, h.stats.fga)}</td>
              <td>{pct(h.stats.tpm, h.stats.tpa)}</td>
              <td className="left">{h.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TrophyCase({ history }: { history: SeasonRecord[] }) {
  const counts = new Map<string, number[]>()
  for (const h of history) {
    for (const a of h.awards) counts.set(a, [...(counts.get(a) ?? []), h.year])
  }
  if (!counts.size) return <p className="muted">아직 수상 기록이 없습니다.</p>
  const rank = (a: string) =>
    a.includes('파이널 MVP')
      ? 0
      : a.startsWith('NBA') || a.startsWith('All-NBA')
        ? 1
        : a.startsWith('KBL')
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

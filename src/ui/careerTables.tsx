import { useState } from 'react'
import type { BestPlayer, Honor, SeasonRecord } from '../engine/types'
import { tr } from '../i18n'
import { avg, pct, seasonLabel, stageLabel } from './format'
import { TeamLogo } from './teamLogo'

export function SeasonTable({ history }: { history: SeasonRecord[] }) {
  if (!history.length)
    return <p className="muted">{tr('아직 기록이 없습니다.')}</p>
  return (
    <div className="scroll-x">
      <table>
        <thead>
          <tr>
            <th className="left">{tr('시즌')}</th>
            <th>{tr('나이')}</th>
            <th className="left">{tr('무대')}</th>
            <th className="left">{tr('팀')}</th>
            <th>OVR</th>
            <th>{tr('경기')}</th>
            <th>{tr('분')}</th>
            <th>{tr('득점')}</th>
            <th>{tr('리바')}</th>
            <th>{tr('어시')}</th>
            <th>FG%</th>
            <th>3P%</th>
            <th className="left">{tr('성적')}</th>
          </tr>
        </thead>
        <tbody>
          {[...history].reverse().map((h) => (
            <tr key={h.year}>
              <td className="left">{seasonLabel(h)}</td>
              <td>{h.age}</td>
              <td className="left">{stageLabel(h.stage)}</td>
              <td className="left">
                <span className="row nowrap">
                  <TeamLogo name={h.team} size={18} />
                  {tr(h.team)}
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
              <td className="left">{h.result.map((r) => tr(r)).join(', ')}</td>
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
  if (!counts.size)
    return <p className="muted">{tr('아직 수상 기록이 없습니다.')}</p>
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
            <b>{tr(name)}</b>
            <span className="count">×{years.length}</span>
            <small className="muted">{years.join(', ')}</small>
          </li>
        ))}
    </ul>
  )
}

const TIER_LABEL = ['퍼스트', '세컨드', '서드']

export function BestTeams({ teams }: { teams: BestPlayer[][] }) {
  const [tier, setTier] = useState(0)
  const team = teams[tier] ?? teams[0]
  return (
    <div className="best">
      <div className="panel-head">
        <h3>{tr('시즌 베스트 팀')}</h3>
        <div className="tabs" role="tablist">
          {teams.map((_, t) => (
            <button
              key={t}
              role="tab"
              aria-selected={t === tier}
              onClick={() => setTier(t)}
            >
              {tr(TIER_LABEL[t])}
            </button>
          ))}
        </div>
      </div>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th className="left">POS</th>
              <th className="left">{tr('선수')}</th>
              <th className="left">{tr('팀')}</th>
              <th>OVR</th>
              <th>{tr('득점')}</th>
              <th>{tr('리바')}</th>
              <th>{tr('어시')}</th>
            </tr>
          </thead>
          <tbody>
            {team.map((b) => (
              <tr key={b.position} className={b.me ? 'me' : undefined}>
                <td className="left pos">{b.position}</td>
                <td className="left">
                  <span className="row nowrap">
                    {b.name}
                    {b.me && <span className="tag">YOU</span>}
                  </span>
                </td>
                <td className="left">
                  <span className="row nowrap">
                    <TeamLogo name={b.team} size={18} />
                    {tr(b.team)}
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
  )
}

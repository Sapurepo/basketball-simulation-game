import { useState } from 'react'
import { formatMoney } from '../engine/events'
import { advanceSeason, resolveEvent } from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  overall,
  POSITION_LABELS,
  potentialGrade,
} from '../engine/player'
import type { GameState } from '../engine/types'
import { AttrBars } from './attrBars'
import { SeasonTable, TrophyCase } from './careerTables'
import { avg, pct, seasonLabel, STAGE_LABEL } from './format'
import { GameCast } from './gameCast'

type Tab = 'season' | 'cast' | 'career' | 'trophy'
const TABS: [Tab, string][] = [
  ['season', '이번 시즌'],
  ['cast', '경기 중계'],
  ['career', '커리어 기록'],
  ['trophy', '트로피'],
]

export function MainScreen({
  state,
  onChange,
}: {
  state: GameState
  onChange: (s: GameState) => void
}) {
  const [tab, setTab] = useState<Tab>('season')
  const [castIdx, setCastIdx] = useState(0)
  const p = state.player
  const last = state.history.at(-1)
  const ev = state.events[0]
  const retired = state.stage === 'RETIRED'

  const advance = () => {
    onChange(advanceSeason(state))
    setTab('season')
    setCastIdx(0)
  }

  return (
    <main className="game">
      <section className="panel card">
        <div className="row between">
          <div>
            <p className="eyebrow">
              {STAGE_LABEL[state.stage]} · {state.teamName || '무소속'}
            </p>
            <h1>{p.name}</h1>
            <p className="muted">
              {state.age}세 · {p.position} {POSITION_LABELS[p.position]} ·{' '}
              {p.style} · {p.height}cm
            </p>
          </div>
          <div className="ovr">
            <b>{overall(p)}</b>
            <small>OVR · 잠재 {potentialGrade(p.potential)}</small>
          </div>
        </div>
        {state.contract && (
          <p className="contract">
            계약: {state.contract.teamName}
            {state.contract.twoWay ? ' (투웨이)' : ''} ·{' '}
            {formatMoney(state.contract.salary, state.contract.currency)} · 잔여{' '}
            {Math.max(0, state.contract.yearsLeft)}년
          </p>
        )}
        <AttrBars attrs={p.attrs} keys={ATTR_KEYS} labels={ATTR_LABELS} />
      </section>

      <section className="panel action">
        {retired ? (
          <RetiredSummary state={state} />
        ) : ev ? (
          <div className="event">
            <p className="eyebrow">오프시즌 · {seasonLabel(state)} 시즌 준비</p>
            <h2>{ev.title}</h2>
            <p>{ev.body}</p>
            <div className="options">
              {ev.options.map((o) => (
                <button
                  key={o.id}
                  className="option"
                  onClick={() => onChange(resolveEvent(state, o.id))}
                >
                  <b>{o.label}</b>
                  {o.desc && <small>{o.desc}</small>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button className="primary big" onClick={advance}>
            {seasonLabel(state)} 시즌 진행 ▶
          </button>
        )}
      </section>

      <nav className="tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? 'tab on' : 'tab'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {tab === 'season' &&
          (last ? (
            <div>
              <p className="eyebrow">
                {seasonLabel(last)} · {last.team}
              </p>
              <h2>{last.result}</h2>
              <p className="muted">
                {last.stage === 'KBL' || last.stage === 'NBA'
                  ? '정규시즌'
                  : '전적'}{' '}
                {last.wins}승 {last.losses}패 · OVR {last.ovr}
              </p>
              <div className="stats">
                <Stat label="경기" v={String(last.stats.games)} />
                <Stat label="출전시간" v={avg(last.stats, 'minutes')} />
                <Stat label="득점" v={avg(last.stats, 'pts')} />
                <Stat label="리바운드" v={avg(last.stats, 'reb')} />
                <Stat label="어시스트" v={avg(last.stats, 'ast')} />
                <Stat label="스틸" v={avg(last.stats, 'stl')} />
                <Stat label="블록" v={avg(last.stats, 'blk')} />
                <Stat label="야투율" v={pct(last.stats.fgm, last.stats.fga)} />
                <Stat label="3점" v={pct(last.stats.tpm, last.stats.tpa)} />
              </div>
              {last.playoffStats && (
                <p className="muted">
                  플레이오프 {last.playoffStats.games}경기 · 평균{' '}
                  {avg(last.playoffStats, 'pts')}득점{' '}
                  {avg(last.playoffStats, 'reb')}리바운드{' '}
                  {avg(last.playoffStats, 'ast')}어시스트
                </p>
              )}
              {last.awards.length > 0 && (
                <ul className="awards">
                  {last.awards.map((a) => (
                    <li key={a}>🏆 {a}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="muted">시즌 진행 버튼을 눌러 첫 시즌을 시작하세요.</p>
          ))}

        {tab === 'cast' &&
          (last?.featured.length ? (
            <>
              <div className="chips">
                {last.featured.map((g, i) => (
                  <button
                    key={i}
                    className={i === castIdx ? 'chip on' : 'chip'}
                    onClick={() => setCastIdx(i)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <GameCast
                key={`${last.year}-${castIdx}`}
                game={last.featured[castIdx] ?? last.featured[0]}
              />
            </>
          ) : (
            <p className="muted">중계할 경기가 없습니다.</p>
          ))}

        {tab === 'career' && <SeasonTable history={state.history} />}
        {tab === 'trophy' && <TrophyCase history={state.history} />}
      </section>
    </main>
  )
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <b>{v}</b>
    </div>
  )
}

function RetiredSummary({ state }: { state: GameState }) {
  const all = state.history.flatMap((h) => h.awards)
  const n = (a: string) => all.filter((x) => x === a).length
  const pro = state.history.filter(
    (h) => h.stage === 'KBL' || h.stage === 'NBA',
  )
  const games = pro.reduce((s, h) => s + h.stats.games, 0)
  const pts = pro.reduce((s, h) => s + h.stats.pts, 0)
  return (
    <div className="retired">
      <p className="eyebrow">은퇴 · 커리어 요약</p>
      <h2>{state.player.name}의 농구 인생</h2>
      <div className="stats">
        <Stat label="NBA 파이널 MVP" v={String(n('NBA 파이널 MVP'))} />
        <Stat label="NBA 챔피언" v={String(n('NBA 챔피언'))} />
        <Stat label="NBA MVP" v={String(n('NBA MVP'))} />
        <Stat label="KBL 우승" v={String(n('KBL 챔피언결정전 우승'))} />
        <Stat label="KBL MVP" v={String(n('KBL 국내선수 MVP'))} />
        <Stat label="최고 OVR" v={String(state.peakOvr)} />
        <Stat label="프로 통산 경기" v={String(games)} />
        <Stat label="프로 통산 득점" v={String(pts)} />
      </div>
      <p className="muted">
        통산 수입: {formatMoney(state.earnings.KRW, 'KRW')}
        {state.earnings.USD > 0 &&
          ` + ${formatMoney(state.earnings.USD, 'USD')}`}
      </p>
    </div>
  )
}

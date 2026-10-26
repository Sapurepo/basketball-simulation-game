import { useEffect, useRef, useState } from 'react'
import { formatMoney } from '../engine/events'
import { advanceSeason, resolveEvent } from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  overall,
  POSITION_LABELS,
  potentialGrade,
} from '../engine/player'
import type { GameLog, GameState } from '../engine/types'
import { AttrBars } from './attrBars'
import { BestTeams, SeasonTable, TrophyCase } from './careerTables'
import { avg, pct, seasonLabel, serviceLabel, STAGE_LABEL } from './format'
import { GameCast } from './gameCast'
import { PixelPlayer } from './pixelPlayer'
import { pickPose } from './pose'
import { Shootout } from './shootout'
import { TeamLogo } from './teamLogo'

// 시즌 진행 로딩에 보여줄 단계 (무대별)
const STEP_MS = 800
// 하이라이트 팝업으로 보여줄 주요 경기
const KEY_GAME = /챔피언결정전|컨퍼런스 파이널|NBA 파이널/
const LOAD_STEPS: Record<GameState['stage'], string[]> = {
  HS: ['동계 훈련', '주말리그', '전국대회', '시즌 결산'],
  COLLEGE: ['동계 훈련', 'U-리그', '대학농구 플레이오프', '시즌 결산'],
  KBL: ['프리시즌', '정규리그', '플레이오프', '시상 및 결산'],
  NBA: ['트레이닝 캠프', '정규 시즌', '플레이오프', '시상 및 결산'],
  MILITARY: ['기초군사훈련', '상무 시즌', '복무 결산'],
  FREE: ['개인 훈련', '시즌 결산'],
  RETIRED: [],
}

type Tab = 'season' | 'cast' | 'best' | 'career' | 'trophy'
const TABS: [Tab, string][] = [
  ['season', '이번 시즌'],
  ['cast', '경기 중계'],
  ['best', '시즌 베스트'],
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
  const [loadStep, setLoadStep] = useState(-1)
  const [highlight, setHighlight] = useState<GameLog | null>(null)
  const playing = loadStep >= 0
  const p = state.player
  const last = state.history.at(-1)
  const ev = state.events[0]
  const retired = state.stage === 'RETIRED'

  const { pose, kit } = pickPose(state)

  // 시즌 진행: 단계 로딩을 보여준 뒤 결과 반영 (시뮬레이션 자체는 즉시 끝난다)
  const steps = LOAD_STEPS[state.stage]
  const advance = () => {
    const apply = () => {
      const next = advanceSeason(state)
      onChange(next)
      setTab('season')
      setCastIdx(0)
      setLoadStep(-1)
      const key = next.history
        .at(-1)
        ?.featured.find((g) => KEY_GAME.test(g.label))
      if (key) setHighlight(key)
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return apply()
    setLoadStep(0)
    steps.forEach((_, i) =>
      setTimeout(() => setLoadStep(i + 1), STEP_MS * (i + 1)),
    )
    setTimeout(apply, STEP_MS * steps.length + 300)
  }

  return (
    <main className="game">
      {playing && (
        <div className="overlay" role="status" aria-live="polite">
          <div className="loading">
            <PixelPlayer pose="shoot" kit={kit} look={p.look} scale={8} />
            <p className="eyebrow">{seasonLabel(state)} 시즌 진행 중</p>
            <h2>{steps[Math.min(loadStep, steps.length - 1)]}</h2>
            <div className="progress">
              <div style={{ width: `${(100 * loadStep) / steps.length}%` }} />
            </div>
            <ol className="steps">
              {steps.map((label, i) => (
                <li
                  key={label}
                  className={
                    i < loadStep ? 'done' : i === loadStep ? 'now' : undefined
                  }
                >
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {highlight && (
        <Highlight game={highlight} onClose={() => setHighlight(null)} />
      )}
      <section className="panel card">
        <div className="row between">
          <PixelPlayer
            key={playing ? 'shoot' : pose}
            pose={playing ? 'shoot' : pose}
            kit={kit}
            look={p.look}
          />
          <div className="grow">
            <p className="eyebrow row">
              {state.stage === 'RETIRED' || state.stage === 'FREE' ? (
                STAGE_LABEL[state.stage]
              ) : (
                <>
                  <TeamLogo
                    teamId={state.teamId}
                    name={state.teamName}
                    size={22}
                  />
                  {STAGE_LABEL[state.stage]} {state.teamName}
                </>
              )}
            </p>
            <h1>{p.name}</h1>
            <ul className="badges">
              <li>{state.age}세</li>
              <li>
                {p.position} {POSITION_LABELS[p.position]}
              </li>
              <li>{p.style}</li>
              <li>{p.height}cm</li>
              <li>병역 {serviceLabel(state.service)}</li>
            </ul>
          </div>
          <div className="ovr">
            <b>{overall(p)}</b>
            <small>OVR</small>
            <small>잠재력 {potentialGrade(p.potential)}</small>
          </div>
        </div>
        {state.contract && (
          <p className="contract">
            {state.contract.teamName}
            {state.contract.twoWay ? ' 투웨이' : ''} 계약, 연봉{' '}
            {formatMoney(state.contract.salary, state.contract.currency)},{' '}
            {state.contract.yearsLeft > 0
              ? `${state.contract.yearsLeft}년 남음`
              : '이번 시즌 후 만료'}
          </p>
        )}
        <AttrBars attrs={p.attrs} keys={ATTR_KEYS} labels={ATTR_LABELS} />
      </section>

      <section className="panel action">
        {retired ? (
          <RetiredSummary state={state} />
        ) : ev ? (
          <div className="event">
            <p className="eyebrow">{seasonLabel(state)} 시즌을 앞둔 오프시즌</p>
            <h2>{ev.title}</h2>
            <p>{ev.body}</p>
            {ev.data?.game ? <GameCast game={ev.data.game as GameLog} /> : null}
            {ev.kind === 'shootout' &&
              !matchMedia('(prefers-reduced-motion: reduce)').matches && (
                <Shootout
                  onDone={(n) => onChange(resolveEvent(state, `made:${n}`))}
                />
              )}
            <div className="options">
              {ev.options.map((o) => (
                <button
                  key={o.id}
                  className="option"
                  onClick={() => onChange(resolveEvent(state, o.id))}
                >
                  <b className="row">
                    {o.teamId && <TeamLogo teamId={o.teamId} size={22} />}
                    {o.label}
                  </b>
                  {o.desc && <small>{o.desc}</small>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button className="primary big" onClick={advance} disabled={playing}>
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
                {seasonLabel(last)} 시즌 {last.team}
              </p>
              <h2>
                {last.stage === 'KBL' || last.stage === 'NBA'
                  ? '정규시즌'
                  : '전적'}{' '}
                {last.wins}승 {last.losses}패
              </h2>
              <ul className="badges">
                {last.result.map((r) => (
                  <li key={r}>{r}</li>
                ))}
                <li>시즌 OVR {last.ovr}</li>
              </ul>
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
                  플레이오프 {last.playoffStats.games}경기 평균{' '}
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

        {tab === 'best' &&
          (last?.bestTeams ? (
            <BestTeams teams={last.bestTeams} />
          ) : (
            <p className="muted">
              베스트 팀은 대학·KBL·NBA 시즌이 끝나면 발표됩니다.
            </p>
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
        {tab === 'trophy' && (
          <TrophyCase history={state.history} honors={state.honors} />
        )}
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
      <p className="eyebrow">커리어 요약</p>
      <h2>{state.player.name}의 농구 인생</h2>
      <div className="stats">
        <Stat label="NBA 파이널 MVP" v={String(n('NBA 파이널 MVP'))} />
        <Stat label="NBA 챔피언" v={String(n('NBA 챔피언'))} />
        <Stat label="NBA MVP" v={String(n('NBA MVP'))} />
        <Stat label="KBL 우승" v={String(n('KBL 챔피언결정전 우승'))} />
        <Stat label="KBL MVP" v={String(n('KBL 국내선수 MVP'))} />
        <Stat
          label="아시안게임 금메달"
          v={String(
            state.honors.filter((h) => h.name === '아시안게임 금메달').length,
          )}
        />
        <Stat label="최고 OVR" v={String(state.peakOvr)} />
        <Stat label="프로 통산 경기" v={String(games)} />
        <Stat label="프로 통산 득점" v={String(pts)} />
      </div>
      <p className="muted">병역: {serviceLabel(state.service)}</p>
      <p className="muted">
        통산 수입: {formatMoney(state.earnings.KRW, 'KRW')}
        {state.earnings.USD > 0 &&
          ` + ${formatMoney(state.earnings.USD, 'USD')}`}
      </p>
    </div>
  )
}

// 주요 경기 하이라이트 팝업
function Highlight({ game, onClose }: { game: GameLog; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <p className="eyebrow">하이라이트</p>
      <GameCast game={game} />
      <button className="primary big" onClick={onClose}>
        결과 확인
      </button>
    </dialog>
  )
}

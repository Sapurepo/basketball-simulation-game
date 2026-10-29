import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { itemById } from '../data/items'
import { isUsCollege } from '../data/schools'
import { formatMoney, isDrill } from '../engine/events'
import { advanceSeason, availableDrills, resolveEvent } from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  overall,
  POSITION_LABELS,
  potentialGrade,
} from '../engine/player'
import { clamp } from '../engine/rng'
import type {
  Attributes,
  GameLog,
  GameState,
  Look,
  SeasonRecord,
} from '../engine/types'
import { T, tr, tx } from '../i18n'
import { AttrBars } from './attrBars'
import { BestTeams, SeasonTable, TrophyCase } from './careerTables'
import { attrDelta, fmtDelta, statDelta } from './delta'
import { avg, pct, seasonLabel, serviceLabel, stageLabel } from './format'
import { type CastPlayer, GameCast } from './gameCast'
import { HallSubmit } from './hallSubmit'
import { DrillGame } from './drillGame'
import { PixelPlayer } from './pixelPlayer'
import { type Kit, pickPose } from './pose'
import { Decor, ShopDialog, TrophyShelf } from './shop'
import { fanReaction } from '../data/sns'
import { DEFAULT_LOOK, iconURL, type IconName } from './sprite'
import { TeamLogo } from './teamLogo'
import { TrainingPanel } from './trainingPanel'
import { WinLoss } from './winLoss'

// 시즌 진행 로딩에 보여줄 단계 (무대별)
const STEP_MS = 800
// 하이라이트 팝업으로 보여줄 주요 경기
const KEY_GAME = /챔피언결정전|컨퍼런스 파이널|NBA 파이널|NCAA 토너먼트 결승/
const LOAD_STEPS: Record<GameState['stage'] | 'NCAA', string[]> = {
  HS: ['동계 훈련', '주말리그', '전국대회', '시즌 결산'],
  COLLEGE: ['동계 훈련', 'U-리그', '대학농구 플레이오프', '시즌 결산'],
  NCAA: ['동계 훈련', 'NCAA 정규시즌', 'NCAA 토너먼트', '시즌 결산'],
  KBL: ['프리시즌', '정규리그', '플레이오프', '시상 및 결산'],
  NBA: ['트레이닝 캠프', '정규 시즌', '플레이오프', '시상 및 결산'],
  MILITARY: ['기초군사훈련', '상무 시즌', '복무 결산'],
  FREE: ['개인 훈련', '시즌 결산'],
  RETIRED: [],
}

type Tab = 'season' | 'cast' | 'best' | 'career' | 'trophy'
// 기록실 커맨드가 여는 탭 묶음
const RECORDS: [Tab, string][] = [
  ['season', '이번 시즌'],
  ['career', '커리어'],
  ['trophy', '트로피'],
]

// 무대에 적용한 벽지·바닥타일을 CSS 변수로
function stageStyle(s: GameState) {
  const bg = (id?: string) => (id ? itemById(id)?.bg : undefined)
  return {
    '--wall': bg(s.wall),
    '--floor': bg(s.floor),
  } as CSSProperties
}

// 상태 바 왼쪽: 무대와 학년·연차. stageYear 는 재계약 때마다 0이 되므로 기록으로 센다
function stageText(s: GameState) {
  const n = s.history.filter((h) => h.stage === s.stage).length + 1
  if (s.stage === 'HS' || s.stage === 'COLLEGE')
    return tr('{stage} {n}학년', { stage: stageLabel(s.stage), n })
  if (s.stage === 'KBL' || s.stage === 'NBA' || s.stage === 'MILITARY')
    return tr('{stage} {n}년차', { stage: stageLabel(s.stage), n })
  return stageLabel(s.stage)
}

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
  // 파이널 MVP 축하 오버레이(NBA 파엠·KBL 챔결 MVP). 닫으면 보류해 둔 하이라이트(key)를 이어서 띄운다
  const [fmvp, setFmvp] = useState<{
    key: GameLog | null
    award: keyof typeof MVP_SHOW
  } | null>(null)
  // 방금 진행한 시즌의 능력치 증감. 다음 진행 때 교체되고 새로고침하면 사라진다
  const [delta, setDelta] = useState<Attributes | null>(null)
  const [leaving, setLeaving] = useState(false)
  const playing = loadStep >= 0
  const p = state.player
  const last = state.history.at(-1)
  // 시즌 결과 칸의 경기당 평균 증감은 직전 시즌과 비교한다
  const prev = state.history.at(-2)
  const sd = (k: 'minutes' | 'pts' | 'reb' | 'ast' | 'stl' | 'blk') =>
    prev && last ? statDelta(prev.stats, last.stats, k) : undefined
  const ev = state.events[0]
  const retired = state.stage === 'RETIRED'

  const { pose, kit } = pickPose(state)
  const drillsLeft = availableDrills(state).length
  const [training, setTraining] = useState(false)
  const [shop, setShop] = useState(false)
  const [editNum, setEditNum] = useState(false)
  const look = p.look ?? DEFAULT_LOOK
  const castMe = { name: p.name, position: p.position, look, kit }
  const recordsRef = useRef<HTMLElement>(null)
  // 커맨드로 기록 패널을 바꾸면 패널이 화면에 보이도록 스크롤
  const show = (t: Tab) => {
    setTab(t)
    recordsRef.current?.scrollIntoView({ block: 'start' })
  }
  const alertText = retired
    ? tr('커리어 종료')
    : ev
      ? tr('오프시즌 결정 대기')
      : state.contract
        ? state.contract.yearsLeft > 0
          ? tr('계약 {n}년 남음', { n: state.contract.yearsLeft })
          : tr('계약 마지막 시즌')
        : tr('{season} 시즌 대기', { season: seasonLabel(state) })

  // 시즌 진행: 단계 로딩을 보여준 뒤 결과 반영 (시뮬레이션 자체는 즉시 끝난다)
  const steps =
    LOAD_STEPS[
      state.stage === 'COLLEGE' && isUsCollege(state.teamId)
        ? 'NCAA'
        : state.stage
    ]
  const advance = () => {
    const apply = () => {
      const next = advanceSeason(state)
      setDelta(attrDelta(state.player.attrs, next.player.attrs))
      onChange(next)
      setTab('season')
      setCastIdx(0)
      setTraining(false)
      const season = next.history.at(-1)
      const key = season?.featured.find((g) => KEY_GAME.test(g.label)) ?? null
      const won = (Object.keys(MVP_SHOW) as (keyof typeof MVP_SHOW)[]).find(
        (a) => season?.awards.includes(a),
      )
      // 결과를 먼저 반영하고 오버레이는 페이드아웃(150ms) 뒤 내린다
      setLeaving(true)
      setTimeout(() => {
        setLoadStep(-1)
        setLeaving(false)
        if (won) setFmvp({ key, award: won })
        else if (key) setHighlight(key)
      }, 150)
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
        <div
          className={leaving ? 'overlay leaving' : 'overlay'}
          role="status"
          aria-live="polite"
        >
          <div className="loading">
            <PixelPlayer pose="shoot" kit={kit} look={p.look} scale={4} />
            <p className="eyebrow">
              {tr('{season} 시즌 진행 중', { season: seasonLabel(state) })}
            </p>
            <h2>{tr(steps[Math.min(loadStep, steps.length - 1)])}</h2>
            <div className="progress">
              <div
                style={{ transform: `scaleX(${loadStep / steps.length})` }}
              />
            </div>
            <ol className="steps">
              {steps.map((label, i) => (
                <li
                  key={label}
                  className={
                    i < loadStep ? 'done' : i === loadStep ? 'now' : undefined
                  }
                >
                  {tr(label)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {fmvp && (
        <FmvpCelebration
          kit={kit}
          look={p.look}
          award={fmvp.award}
          onClose={() => {
            setHighlight(fmvp.key)
            setFmvp(null)
          }}
        />
      )}
      {highlight && (
        <Highlight
          game={highlight}
          me={castMe}
          onClose={() => setHighlight(null)}
        />
      )}
      {shop && (
        <ShopDialog
          state={state}
          kit={kit}
          onChange={onChange}
          onClose={() => setShop(false)}
        />
      )}
      {editNum && (
        <NumberDialog
          num={look.num}
          onSave={(num) =>
            onChange({ ...state, player: { ...p, look: { ...look, num } } })
          }
          onClose={() => setEditNum(false)}
        />
      )}
      <section className="panel hero">
        <div className="status">
          <span className="row">
            <span className="tag gold">
              S{String(state.history.length + 1).padStart(2, '0')}
            </span>
            {stageText(state)}
          </span>
          <span className="alert">{alertText}</span>
        </div>
        <div className="stage" style={stageStyle(state)}>
          <div className="pennant">
            {state.stage === 'RETIRED' || state.stage === 'FREE' ? (
              stageLabel(state.stage)
            ) : (
              <>
                <TeamLogo
                  teamId={state.teamId}
                  name={state.teamName}
                  size={18}
                />
                <span className="pennant-name" title={tr(state.teamName)}>
                  {tr(state.teamName)}
                </span>
              </>
            )}
          </div>
          <Decor items={state.items} layout={state.layout} />
          <TrophyShelf state={state} />
          <div className="ovr-shield">
            <div>
              <small>OVR</small>
              <strong>{overall(p)}</strong>
            </div>
          </div>
          <div className="sprite">
            <PixelPlayer
              pose={playing ? 'shoot' : pose}
              kit={kit}
              look={p.look}
              scale={4}
            />
          </div>
        </div>
        <div className="hero-body">
          <div className="name-row">
            <h1>{p.name}</h1>
            <span
              className="pos-tag"
              style={{ '--team': kit.jersey } as CSSProperties}
              title={POSITION_LABELS[p.position]}
            >
              {p.position}
            </span>
          </div>
          <div className="plates">
            <Plate label={tr('나이')} v={`${state.age}`} />
            <Plate label={tr('신장')} v={`${p.height}`} />
            <Plate label={tr('체중')} v={`${p.weight}`} />
            <Plate
              label={tr('등번호')}
              v={`#${look.num}`}
              onClick={() => setEditNum(true)}
            />
            <Plate label={tr('스타일')} v={tr(p.style)} />
            <Plate label={tr('잠재력')} v={potentialGrade(p.potential)} />
            <Plate label={tr('병역')} v={serviceLabel(state.service)} />
          </div>
          {state.contract && (
            <p className="contract">
              {tr(
                state.contract.twoWay
                  ? '{team} 투웨이 계약, 연봉 {money}'
                  : '{team} 계약, 연봉 {money}',
                {
                  team: T(state.contract.teamName),
                  money: formatMoney(
                    state.contract.salary,
                    state.contract.currency,
                  ),
                },
              )}
            </p>
          )}
          <AttrBars
            attrs={p.attrs}
            keys={ATTR_KEYS}
            labels={ATTR_LABELS}
            delta={delta ?? undefined}
          />
          <div className="cmds">
            {/* 남은 훈련이 있으면 대각선으로 나눠 오른쪽에 훈련하기 */}
            <div className={drillsLeft ? 'split-cmd' : 'split-cmd solo'}>
              <Command
                icon="ball"
                label={tr('시즌 진행')}
                sub={
                  retired
                    ? tr('커리어 종료')
                    : ev
                      ? tr('비시즌')
                      : tr('{season} 시즌', { season: seasonLabel(state) })
                }
                primary
                disabled={retired || !!ev || playing}
                onClick={advance}
              />
              {drillsLeft > 0 && (
                <button
                  className="btn-cmd train"
                  aria-pressed={training}
                  disabled={playing}
                  onClick={() => setTraining(true)}
                >
                  <span>
                    <span className="label">{tr('훈련하기')}</span>
                    <span className="sub">
                      {tr('남은 훈련 {n}', { n: drillsLeft })}
                    </span>
                  </span>
                </button>
              )}
            </div>
            <Command
              icon="hoop"
              label={tr('경기 중계')}
              sub={
                last?.featured.length
                  ? tr('주요 경기 {n}', { n: last.featured.length })
                  : tr('중계 없음')
              }
              pressed={tab === 'cast'}
              onClick={() => show('cast')}
            />
            <Command
              icon="star"
              label={tr('시즌 베스트')}
              sub={
                last?.bestTeams
                  ? tr('{stage} 베스트 팀', { stage: stageLabel(last.stage) })
                  : tr('발표 전')
              }
              pressed={tab === 'best'}
              onClick={() => show('best')}
            />
            <Command
              icon="trophy"
              label={tr('기록실')}
              sub={tr('커리어 · 트로피')}
              pressed={RECORDS.some(([id]) => id === tab)}
              onClick={() => show('career')}
            />
            <Command
              icon="bag"
              label={tr('상점')}
              sub={formatMoney(state.cash ?? 0, 'KRW')}
              pressed={shop}
              disabled={playing}
              onClick={() => setShop(true)}
            />
          </div>
          {last && last.featured.length > 0 && (
            <div className="recent">
              <p>{tr('최근 경기')}</p>
              {last.featured.map((g, i) => (
                <div key={i} className="recent-row">
                  <WinLoss win={g.myScore > g.oppScore} />
                  <span>vs {tr(g.opponent)}</span>
                  <span className="muted">
                    {g.myScore}–{g.oppScore} ·{' '}
                    {tr('{pts}점 {ast}어시', {
                      pts: g.box.pts,
                      ast: g.box.ast,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {training && !retired && (
        <TrainingPanel
          state={state}
          kit={kit}
          onChange={onChange}
          onClose={() => setTraining(false)}
        />
      )}

      {retired ? (
        <section className="panel">
          <RetiredSummary
            state={state}
            onPosted={() => onChange({ ...state, hallPosted: true })}
          />
        </section>
      ) : ev ? (
        <section className="panel event">
          <p className="eyebrow">
            {tr('{season} 시즌을 앞둔 오프시즌', {
              season: seasonLabel(state),
            })}
          </p>
          <h2>{tx(ev.title)}</h2>
          <p>{tx(ev.body)}</p>
          {ev.data?.game ? (
            <GameCast game={ev.data.game as GameLog} me={castMe} />
          ) : null}
          {isDrill(ev.kind) &&
            !matchMedia('(prefers-reduced-motion: reduce)').matches && (
              <DrillGame
                kind={ev.kind}
                kit={kit}
                look={p.look}
                attrs={p.attrs}
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
                  {tx(o.label)}
                </b>
                {o.desc && <small>{tx(o.desc)}</small>}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section ref={recordsRef} className="panel records">
        {RECORDS.some(([id]) => id === tab) && (
          <div className="panel-head">
            <h3>{tr('기록실')}</h3>
            <div className="tabs" role="tablist">
              {RECORDS.map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                >
                  {tr(label)}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'season' &&
          (last ? (
            <div>
              <p className="eyebrow">
                {tr('{season} 시즌 {team}', {
                  season: seasonLabel(last),
                  team: T(last.team),
                })}
              </p>
              <h2>
                {last.stage === 'KBL' || last.stage === 'NBA'
                  ? tr('정규시즌')
                  : tr('전적')}{' '}
                {tr('{w}승 {l}패', { w: last.wins, l: last.losses })}
              </h2>
              <ul className="badges">
                {last.result.map((r) => (
                  <li key={r}>{tr(r)}</li>
                ))}
                <li>{tr('시즌 OVR {ovr}', { ovr: last.ovr })}</li>
              </ul>
              <div className="stats">
                <Stat label={tr('경기')} v={String(last.stats.games)} />
                <Stat
                  label={tr('출전시간')}
                  v={avg(last.stats, 'minutes')}
                  d={sd('minutes')}
                />
                <Stat
                  label={tr('득점')}
                  v={avg(last.stats, 'pts')}
                  d={sd('pts')}
                />
                <Stat
                  label={tr('리바운드')}
                  v={avg(last.stats, 'reb')}
                  d={sd('reb')}
                />
                <Stat
                  label={tr('어시스트')}
                  v={avg(last.stats, 'ast')}
                  d={sd('ast')}
                />
                <Stat
                  label={tr('스틸')}
                  v={avg(last.stats, 'stl')}
                  d={sd('stl')}
                />
                <Stat
                  label={tr('블록')}
                  v={avg(last.stats, 'blk')}
                  d={sd('blk')}
                />
                <Stat
                  label={tr('야투율')}
                  v={pct(last.stats.fgm, last.stats.fga)}
                />
                <Stat
                  label={tr('3점')}
                  v={pct(last.stats.tpm, last.stats.tpa)}
                />
              </div>
              {last.playoffStats && (
                <p className="muted">
                  {tr(
                    '플레이오프 {g}경기 평균 {pts}득점 {reb}리바운드 {ast}어시스트',
                    {
                      g: last.playoffStats.games,
                      pts: avg(last.playoffStats, 'pts'),
                      reb: avg(last.playoffStats, 'reb'),
                      ast: avg(last.playoffStats, 'ast'),
                    },
                  )}
                </p>
              )}
              {last.awards.length > 0 && (
                <ul className="awards">
                  {last.awards.map((a) => (
                    <li key={a}>
                      <img className="px" src={iconURL('trophy')} alt="" />
                      {tr(a)}
                    </li>
                  ))}
                </ul>
              )}
              <FanReaction name={p.name} rec={last} prev={prev} />
            </div>
          ) : (
            <p className="muted">
              {tr('시즌 진행 버튼을 눌러 첫 시즌을 시작하세요.')}
            </p>
          ))}

        {tab === 'best' &&
          (last?.bestTeams ? (
            <BestTeams key={last.year} teams={last.bestTeams} />
          ) : (
            <>
              <h3>{tr('시즌 베스트 팀')}</h3>
              <p className="muted">
                {tr('베스트 팀은 대학·KBL·NBA 시즌이 끝나면 발표됩니다.')}
              </p>
            </>
          ))}

        {tab === 'cast' &&
          (last?.featured.length ? (
            <>
              <div className="panel-head">
                <h3>{tr('경기 중계')}</h3>
                <div className="tabs" role="tablist">
                  {last.featured.map((g, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={i === castIdx}
                      onClick={() => setCastIdx(i)}
                    >
                      {tr(g.label)}
                    </button>
                  ))}
                </div>
              </div>
              <GameCast
                key={`${last.year}-${castIdx}`}
                game={last.featured[castIdx] ?? last.featured[0]}
                me={castMe}
              />
            </>
          ) : (
            <>
              <h3>{tr('경기 중계')}</h3>
              <p className="muted">{tr('중계할 경기가 없습니다.')}</p>
            </>
          ))}

        {tab === 'career' && <SeasonTable history={state.history} />}
        {tab === 'trophy' && (
          <TrophyCase history={state.history} honors={state.honors} />
        )}
      </section>
    </main>
  )
}

// onClick 을 주면 누를 수 있는 플레이트(등번호 수정)
function Plate({
  label,
  v,
  onClick,
}: {
  label: string
  v: string
  onClick?: () => void
}) {
  const body = (
    <>
      <b>{label}</b>
      <span>{v}</span>
    </>
  )
  return onClick ? (
    <button
      className="plate"
      onClick={onClick}
      title={tr('{label} 수정', { label })}
    >
      {body}
    </button>
  ) : (
    <span className="plate">{body}</span>
  )
}

// 등번호 수정 팝업 (0~99)
function NumberDialog({
  num,
  onSave,
  onClose,
}: {
  num: number
  onSave: (num: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(num)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal num-dialog"
      onClose={() => setTimeout(onClose, 150)}
    >
      <p className="eyebrow">{tr('등번호')}</p>
      <label className="field">
        <span>{tr('0~99 사이 숫자')}</span>
        <input
          type="number"
          min={0}
          max={99}
          value={value}
          autoFocus
          onChange={(e) => {
            const n = clamp(Math.round(+e.target.value) || 0, 0, 99)
            // "07"처럼 숫자로는 같은 값이면 React 가 화면을 고치지 않아 앞자리 0이 남는다
            e.target.value = String(n)
            setValue(n)
          }}
        />
      </label>
      <div className="row">
        <button className="ghost" onClick={() => ref.current?.close()}>
          {tr('취소')}
        </button>
        <button
          className="primary grow"
          onClick={() => {
            onSave(value)
            ref.current?.close()
          }}
        >
          {tr('저장')}
        </button>
      </div>
    </dialog>
  )
}

function Command({
  icon,
  label,
  sub,
  primary,
  pressed,
  disabled,
  onClick,
}: {
  icon: IconName
  label: string
  sub: string
  primary?: boolean
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={primary ? 'btn-cmd primary' : 'btn-cmd'}
      aria-pressed={primary ? undefined : pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <img className="px icon" src={iconURL(icon)} alt="" />
      <span>
        <span className="label">{label}</span>
        <span className="sub">{sub}</span>
      </span>
    </button>
  )
}

// d 가 있으면 값 옆에 직전 시즌 대비 증감 (+ 초록, − 회색)
function Stat({ label, v, d }: { label: string; v: string; d?: number }) {
  const txt = d === undefined ? '' : fmtDelta(d)
  return (
    <div className="stat">
      <small>{label}</small>
      <b>
        {v}
        {txt && <em className={d! > 0 ? 'delta up' : 'delta down'}>{txt}</em>}
      </b>
    </div>
  )
}

// 색종이 40장: 위치·색·박자를 인덱스에서 결정적으로 뽑는다 (렌더마다 같다)
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  '--x': `${(i * 37) % 100}%`,
  '--y': `${(i * 53) % 90}%`,
  '--d': `${((i * 7) % 20) / 10}s`,
  '--t': `${2.2 + ((i * 11) % 10) / 10}s`,
  '--c': ['#f2c14e', '#f07a2b', '#1d8a57', '#cc3049', '#3b7dd8'][i % 5],
})) as CSSProperties[]

// 축하 연출을 띄우는 수상과 문구 (수상명은 엔진 식별자라 그대로 쓴다)
const MVP_SHOW = {
  'NBA 파이널 MVP': { eyebrow: 'NBA 파이널', title: '파이널 MVP!' },
  'KBL 챔피언결정전 MVP': { eyebrow: 'KBL 챔피언결정전', title: '챔프전 MVP!' },
} as const

// 파이널 MVP 축하: 코트 위에서 트로피를 들고, 색종이·폭죽이 흩날린다
function FmvpCelebration({
  kit,
  look,
  award,
  onClose,
}: {
  kit: Kit
  look?: Look
  award: keyof typeof MVP_SHOW
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal fmvp"
      aria-label={award}
      onClose={() => setTimeout(onClose, 150)}
    >
      <div className="court">
        <i className="burst" />
        <i className="burst two" />
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((style, i) => (
            <i key={i} style={style} />
          ))}
        </div>
        <div className="sprite">
          <PixelPlayer pose="trophy" kit={kit} look={look} scale={4} />
        </div>
      </div>
      <p className="eyebrow">{tr(MVP_SHOW[award].eyebrow)}</p>
      <h2>{tr(MVP_SHOW[award].title)}</h2>
      <button className="primary big" onClick={() => ref.current?.close()}>
        {tr('계속')}
      </button>
    </dialog>
  )
}

function RetiredSummary({
  state,
  onPosted,
}: {
  state: GameState
  onPosted: () => void
}) {
  const all = state.history.flatMap((h) => h.awards)
  const n = (a: string) => all.filter((x) => x === a).length
  const pro = state.history.filter(
    (h) => h.stage === 'KBL' || h.stage === 'NBA',
  )
  const games = pro.reduce((s, h) => s + h.stats.games, 0)
  const pts = pro.reduce((s, h) => s + h.stats.pts, 0)
  return (
    <div className="retired">
      <p className="eyebrow">{tr('커리어 요약')}</p>
      <h2>{tr('{name}의 농구 인생', { name: state.player.name })}</h2>
      <div className="stats">
        <Stat label={tr('NBA 파이널 MVP')} v={String(n('NBA 파이널 MVP'))} />
        <Stat label={tr('NBA 챔피언')} v={String(n('NBA 챔피언'))} />
        <Stat label="NBA MVP" v={String(n('NBA MVP'))} />
        <Stat label={tr('KBL 우승')} v={String(n('KBL 챔피언결정전 우승'))} />
        <Stat label="KBL MVP" v={String(n('KBL 국내선수 MVP'))} />
        <Stat
          label={tr('아시안게임 금메달')}
          v={String(
            state.honors.filter((h) => h.name === '아시안게임 금메달').length,
          )}
        />
        <Stat label={tr('최고 OVR')} v={String(state.peakOvr)} />
        <Stat label={tr('프로 통산 경기')} v={String(games)} />
        <Stat label={tr('프로 통산 득점')} v={String(pts)} />
      </div>
      <p className="muted">
        {tr('병역:')} {serviceLabel(state.service)}
      </p>
      <p className="muted">
        {tr('통산 수입:')} {formatMoney(state.earnings.KRW, 'KRW')}
        {state.earnings.USD > 0 &&
          ` + ${formatMoney(state.earnings.USD, 'USD')}`}
      </p>
      <HallSubmit state={state} onPosted={onPosted} />
    </div>
  )
}

// 주요 경기 하이라이트 팝업
function Highlight({
  game,
  me,
  onClose,
}: {
  game: GameLog
  me: CastPlayer
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    // 닫힘 전환(150ms)이 끝난 뒤 언마운트
    <dialog
      ref={ref}
      className="modal highlight"
      onClose={() => setTimeout(onClose, 150)}
    >
      <p className="eyebrow">{tr('하이라이트')}</p>
      <GameCast game={game} me={me} />
      <button className="primary big" onClick={() => ref.current?.close()}>
        {tr('결과 확인')}
      </button>
    </dialog>
  )
}

// 시즌 결과 아래 가상 팬 반응 카드 (저장하지 않고 시즌 기록으로 만든다)
function FanReaction(props: {
  name: string
  rec: SeasonRecord
  prev?: SeasonRecord
}) {
  const { likes, comments } = fanReaction(props.name, props.rec, props.prev)
  return (
    <section className="sns" aria-label={tr('팬 반응')}>
      <p className="eyebrow">
        {tr('팬 반응')} · ♥ {tr('좋아요 {n}', { n: likes.toLocaleString() })}
      </p>
      <ul>
        {comments.map((c) => (
          <li key={c.user}>
            <b>@{c.user}</b> {tx(c.text)}
          </li>
        ))}
      </ul>
    </section>
  )
}

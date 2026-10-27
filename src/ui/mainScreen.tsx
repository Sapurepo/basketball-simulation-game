import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { itemById } from '../data/items'
import { formatMoney, isDrill } from '../engine/events'
import {
  advanceSeason,
  availableDrills,
  buyItem,
  resolveEvent,
} from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  overall,
  POSITION_LABELS,
  potentialGrade,
} from '../engine/player'
import { clamp } from '../engine/rng'
import type { GameLog, GameState } from '../engine/types'
import { AttrBars } from './attrBars'
import { BestTeams, SeasonTable, TrophyCase } from './careerTables'
import { avg, pct, seasonLabel, serviceLabel, STAGE_LABEL } from './format'
import { GameCast } from './gameCast'
import { DrillGame } from './drillGame'
import { PixelPlayer } from './pixelPlayer'
import { pickPose } from './pose'
import { Decor, ShopDialog, TrophyShelf } from './shop'
import { DEFAULT_LOOK, iconURL, type IconName } from './sprite'
import { TeamLogo } from './teamLogo'
import { TrainingPanel } from './trainingPanel'
import { WinLoss } from './winLoss'

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
    return `${STAGE_LABEL[s.stage]} ${n}학년`
  if (s.stage === 'KBL' || s.stage === 'NBA' || s.stage === 'MILITARY')
    return `${STAGE_LABEL[s.stage]} ${n}년차`
  return STAGE_LABEL[s.stage]
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
  const [leaving, setLeaving] = useState(false)
  const playing = loadStep >= 0
  const p = state.player
  const last = state.history.at(-1)
  const ev = state.events[0]
  const retired = state.stage === 'RETIRED'

  const { pose, kit } = pickPose(state)
  const drillsLeft = availableDrills(state).length
  const [training, setTraining] = useState(false)
  const [shop, setShop] = useState(false)
  const [editNum, setEditNum] = useState(false)
  const look = p.look ?? DEFAULT_LOOK
  const recordsRef = useRef<HTMLElement>(null)
  // 커맨드로 기록 패널을 바꾸면 패널이 화면에 보이도록 스크롤
  const show = (t: Tab) => {
    setTab(t)
    recordsRef.current?.scrollIntoView({ block: 'start' })
  }
  const alertText = retired
    ? '커리어 종료'
    : ev
      ? '오프시즌 결정 대기'
      : state.contract
        ? state.contract.yearsLeft > 0
          ? `계약 ${state.contract.yearsLeft}년 남음`
          : '계약 마지막 시즌'
        : `${seasonLabel(state)} 시즌 대기`

  // 시즌 진행: 단계 로딩을 보여준 뒤 결과 반영 (시뮬레이션 자체는 즉시 끝난다)
  const steps = LOAD_STEPS[state.stage]
  const advance = () => {
    const apply = () => {
      const next = advanceSeason(state)
      onChange(next)
      setTab('season')
      setCastIdx(0)
      setTraining(false)
      const key = next.history
        .at(-1)
        ?.featured.find((g) => KEY_GAME.test(g.label))
      // 결과를 먼저 반영하고 오버레이는 페이드아웃(150ms) 뒤 내린다
      setLeaving(true)
      setTimeout(() => {
        setLoadStep(-1)
        setLeaving(false)
        if (key) setHighlight(key)
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
            <p className="eyebrow">{seasonLabel(state)} 시즌 진행 중</p>
            <h2>{steps[Math.min(loadStep, steps.length - 1)]}</h2>
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
      {shop && (
        <ShopDialog
          cash={state.cash ?? 0}
          items={state.items}
          applied={[state.wall, state.floor]}
          onBuy={(id) => onChange(buyItem(state, id))}
          onApply={(it) => it.slot && onChange({ ...state, [it.slot]: it.id })}
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
              STAGE_LABEL[state.stage]
            ) : (
              <>
                <TeamLogo
                  teamId={state.teamId}
                  name={state.teamName}
                  size={18}
                />
                {state.teamName}
              </>
            )}
          </div>
          <Decor items={state.items} />
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
            <Plate label="나이" v={`${state.age}`} />
            <Plate label="신장" v={`${p.height}`} />
            <Plate label="체중" v={`${p.weight}`} />
            <Plate
              label="등번호"
              v={`#${look.num}`}
              onClick={() => setEditNum(true)}
            />
            <Plate label="스타일" v={p.style} />
            <Plate label="잠재력" v={potentialGrade(p.potential)} />
            <Plate label="병역" v={serviceLabel(state.service)} />
          </div>
          {state.contract && (
            <p className="contract">
              {state.contract.teamName}
              {state.contract.twoWay ? ' 투웨이' : ''} 계약, 연봉{' '}
              {formatMoney(state.contract.salary, state.contract.currency)}
            </p>
          )}
          <AttrBars attrs={p.attrs} keys={ATTR_KEYS} labels={ATTR_LABELS} />
          <div className="cmds">
            {/* 남은 훈련이 있으면 대각선으로 나눠 오른쪽에 훈련하기 */}
            <div className={drillsLeft ? 'split-cmd' : 'split-cmd solo'}>
              <Command
                icon="ball"
                label="시즌 진행"
                sub={
                  retired
                    ? '커리어 종료'
                    : ev
                      ? '비시즌'
                      : `${seasonLabel(state)} 시즌`
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
                    <span className="label">훈련하기</span>
                    <span className="sub">남은 훈련 {drillsLeft}</span>
                  </span>
                </button>
              )}
            </div>
            <Command
              icon="hoop"
              label="경기 중계"
              sub={
                last?.featured.length
                  ? `주요 경기 ${last.featured.length}`
                  : '중계 없음'
              }
              pressed={tab === 'cast'}
              onClick={() => show('cast')}
            />
            <Command
              icon="star"
              label="시즌 베스트"
              sub={
                last?.bestTeams
                  ? `${STAGE_LABEL[last.stage]} 베스트 팀`
                  : '발표 전'
              }
              pressed={tab === 'best'}
              onClick={() => show('best')}
            />
            <Command
              icon="trophy"
              label="기록실"
              sub="커리어 · 트로피"
              pressed={RECORDS.some(([id]) => id === tab)}
              onClick={() => show('career')}
            />
            <Command
              icon="bag"
              label="상점"
              sub={formatMoney(state.cash ?? 0, 'KRW')}
              pressed={shop}
              disabled={playing}
              onClick={() => setShop(true)}
            />
          </div>
          {last && last.featured.length > 0 && (
            <div className="recent">
              <p>최근 경기</p>
              {last.featured.map((g, i) => (
                <div key={i} className="recent-row">
                  <WinLoss win={g.myScore > g.oppScore} />
                  <span>vs {g.opponent}</span>
                  <span className="muted">
                    {g.myScore}–{g.oppScore} · {g.box.pts}점 {g.box.ast}어시
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
          <RetiredSummary state={state} />
        </section>
      ) : ev ? (
        <section className="panel event">
          <p className="eyebrow">{seasonLabel(state)} 시즌을 앞둔 오프시즌</p>
          <h2>{ev.title}</h2>
          <p>{ev.body}</p>
          {ev.data?.game ? <GameCast game={ev.data.game as GameLog} /> : null}
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
                  {o.label}
                </b>
                {o.desc && <small>{o.desc}</small>}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section ref={recordsRef} className="panel records">
        {RECORDS.some(([id]) => id === tab) && (
          <div className="panel-head">
            <h3>기록실</h3>
            <div className="tabs" role="tablist">
              {RECORDS.map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
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
                    <li key={a}>
                      <img className="px" src={iconURL('trophy')} alt="" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="muted">시즌 진행 버튼을 눌러 첫 시즌을 시작하세요.</p>
          ))}

        {tab === 'best' &&
          (last?.bestTeams ? (
            <BestTeams key={last.year} teams={last.bestTeams} />
          ) : (
            <>
              <h3>시즌 베스트 팀</h3>
              <p className="muted">
                베스트 팀은 대학·KBL·NBA 시즌이 끝나면 발표됩니다.
              </p>
            </>
          ))}

        {tab === 'cast' &&
          (last?.featured.length ? (
            <>
              <div className="panel-head">
                <h3>경기 중계</h3>
                <div className="tabs" role="tablist">
                  {last.featured.map((g, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={i === castIdx}
                      onClick={() => setCastIdx(i)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <GameCast
                key={`${last.year}-${castIdx}`}
                game={last.featured[castIdx] ?? last.featured[0]}
              />
            </>
          ) : (
            <>
              <h3>경기 중계</h3>
              <p className="muted">중계할 경기가 없습니다.</p>
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
    <button className="plate" onClick={onClick} title={`${label} 수정`}>
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
      <p className="eyebrow">등번호</p>
      <label className="field">
        <span>0~99 사이 숫자</span>
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
          취소
        </button>
        <button
          className="primary grow"
          onClick={() => {
            onSave(value)
            ref.current?.close()
          }}
        >
          저장
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
    // 닫힘 전환(150ms)이 끝난 뒤 언마운트
    <dialog
      ref={ref}
      className="modal"
      onClose={() => setTimeout(onClose, 150)}
    >
      <p className="eyebrow">하이라이트</p>
      <GameCast game={game} />
      <button className="primary big" onClick={() => ref.current?.close()}>
        결과 확인
      </button>
    </dialog>
  )
}

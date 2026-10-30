import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DRILL_REPS, DRILLS, type DrillCtl } from '../engine/events'
import type { DrillKind, Look } from '../engine/types'
import { tr } from '../i18n'
import {
  DrillEngine,
  type Fig,
  initialState,
  type MateFig,
  MB,
  type RunState,
  SHOOT_K,
  SX,
  X,
} from './drillEngine'
import { PixelPlayer } from './pixelPlayer'
import type { Kit } from './pose'
import {
  DEFAULT_LOOK,
  type DrawnPose,
  iconURL,
  ROSTER,
  spriteURL,
  W,
} from './sprite'
import { benchURL, hoopURL, type LiftKit, squatURL } from './trainArt'

// 키보드 안내
const KB_HINT: Record<DrillCtl, string> = {
  hold: '스페이스바를 누르고 있어도 돼요',
  tap: '스페이스바나 화면을 눌러도 돼요',
  lr: '키보드 ← → 로도 돼요',
  team: '키보드 ← → 나 동료를 직접 눌러도 돼요',
  fake: '키보드 ← → 돌파 · A D 페이크',
  lamp: '등을 직접 누르거나 방향키 ↑ ← → ↓',
  mash: '스페이스바 연타도 돼요',
}
const OPP: Kit = { jersey: '#cc3049', number: '#ffffff' }
const OPP_LOOK = ROSTER[7].look
const MATE_LOOKS = [ROSTER[2].look, ROSTER[4].look]
// 무대 논리 폭. 더 좁은 화면에는 zoom 으로 줄인다
const STAGE_W = 486

// 선수 한 명. shoot0/1 은 슛 두 프레임을 고정으로, 나머지는 PixelPlayer 의 공용 박자로
function Figure({
  fig,
  kit,
  look = DEFAULT_LOOK,
  scale,
}: {
  fig: Fig | MateFig
  kit: Kit
  look?: Look
  scale: number
}) {
  if (fig === 'shoot0' || fig === 'shoot1') {
    const spec = {
      ...look,
      jersey: kit.jersey,
      trim: kit.number === '#ffffff' ? '#f7f3ea' : kit.number,
      noBall: fig === 'shoot1',
    }
    return (
      <img
        className="px"
        src={spriteURL(spec, 'shoot', fig === 'shoot1' ? 1 : 0)}
        width={W * scale}
        alt=""
      />
    )
  }
  const pose: DrawnPose = fig === 'stand' ? 'guard' : fig
  return <PixelPlayer pose={pose} kit={kit} look={look} scale={scale} />
}

const noMenu = (e: { preventDefault(): void }) => e.preventDefault()

// 훈련 한 종류를 끝까지 진행하고 성공 수를 넘긴다. 엔진이 타이머·연출을 들고, 여기서는 장면과 조작만 그린다
export function DrillPlay({
  kind,
  skill,
  kit,
  look,
  onDone,
}: {
  kind: DrillKind
  skill: number
  kit: Kit
  look?: Look
  onDone: (made: number) => void
}) {
  const d = DRILLS[kind]
  const [st, setSt] = useState<RunState>(() => initialState(kind))
  // 엔진은 한 번만 만든다 (종류가 바뀌면 부모가 key 로 다시 마운트한다). 완료 콜백은 최신 것으로
  const E = useMemo(() => new DrillEngine(kind, skill, setSt), [kind, skill])
  useLayoutEffect(() => {
    E.setFinish((res) => onDone(res.filter(Boolean).length))
  })
  useEffect(() => {
    E.start()
    addEventListener('keydown', E.key)
    addEventListener('keyup', E.key)
    return () => {
      removeEventListener('keydown', E.key)
      removeEventListener('keyup', E.key)
      E.destroy()
    }
  }, [E])
  const rf = (k: string) => (el: HTMLElement | null) => {
    E.r[k] = el
  }

  // 무대는 480px 고정 좌표로 그리고, 칸이 더 좁으면 통째로 줄인다
  const fitRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fit = () => {
      if (fitRef.current && zoomRef.current)
        zoomRef.current.style.zoom = String(
          Math.min(1, fitRef.current.clientWidth / STAGE_W),
        )
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (fitRef.current) ro.observe(fitRef.current)
    return () => ro.disconnect()
  }, [])

  const cur = Math.min(st.res.length + 1, DRILL_REPS)
  const k = SHOOT_K[kind] ?? 0
  const scene =
    kind === 'drib' || kind === 'foot'
      ? 'front'
      : kind === 'bench' || kind === 'squat'
        ? 'lift'
        : SHOOT_K[kind] !== undefined
          ? 'shoot'
          : kind
  const side = kind === 'react'
  const lift: LiftKit = {
    ...(look ?? DEFAULT_LOOK),
    jersey: kit.jersey,
    trim: '#f7f3ea',
  }
  const [lo, hi] = st.zone
  const me = (scale: number, extra?: CSSProperties, key = 'p') => (
    <div
      ref={rf(key)}
      className={`tr-fig s${scale}`}
      style={extra}
      aria-hidden={key !== 'p'}
    >
      <Figure fig={st.me} kit={kit} look={look} scale={scale} />
    </div>
  )
  const opp = (extra: CSSProperties) => (
    <div ref={rf('o')} className="tr-fig s2" style={extra}>
      <Figure fig={st.o} kit={OPP} look={OPP_LOOK} scale={2} />
    </div>
  )
  const lamp = (i: number, arrow: string, x: number, y: number) => (
    <button
      type="button"
      className={`tr-lamp l${st.lamps[i]}`}
      style={{ left: x, top: y }}
      onPointerDown={(e) => {
        e.preventDefault()
        E.lampHit(i)
      }}
      aria-label={tr('반응 등 {n}', { n: i + 1 })}
    >
      {arrow}
    </button>
  )
  const btnText =
    d.ctl === 'mash' && st.lphase === 'lower'
      ? tr('바를 내리는 중…')
      : d.btn
        ? `${tr(d.btn)} (${cur}/${DRILL_REPS})`
        : ''
  const big = (
    label: string,
    handlers: Record<string, (e: PointerEvent) => void>,
    cls = 'primary big tr-btn',
  ) => (
    <button type="button" className={cls} onContextMenu={noMenu} {...handlers}>
      {label}
    </button>
  )
  const down = (fn: () => void) => (e: PointerEvent) => {
    e.preventDefault()
    fn()
  }

  return (
    <div className="drill">
      <div className="tr-head">
        <p className="muted tr-body">{tr(d.body)}</p>
        <span className="tr-rep">
          {cur} / {DRILL_REPS}
        </span>
      </div>

      <div ref={fitRef} className="tr-fit">
        <div ref={zoomRef} className="tr-zoom">
          <div
            className={`tr-stage ${scene}`}
            onPointerDown={d.ctl === 'tap' ? down(E.tap) : undefined}
          >
            {scene === 'shoot' && (
              <>
                <div className="tr-key" />
                <img
                  ref={rf('hoop')}
                  className="px tr-hoop"
                  src={hoopURL(st.swish)}
                  alt=""
                />
                <div className="tr-spot" style={{ left: SX[k] + 46 }} />
                <span className="tr-spot-label" style={{ left: SX[k] + 30 }}>
                  {tr(['자유투 라인', '엘보', '3점 라인'][k])}
                </span>
                {me(2, { left: SX[k], top: 128 })}
              </>
            )}
            {scene === 'pass' && (
              <>
                <div
                  className="tr-floor-zone"
                  style={{
                    left: Math.round(X(lo)),
                    width: Math.round(400 * (hi - lo)),
                  }}
                />
                {me(2, { left: 6, top: 128 })}
                <div
                  ref={rf('o')}
                  className="tr-fig s2"
                  style={{ left: Math.round(X(st.dist) - 30), top: 128 }}
                >
                  <Figure fig={st.o} kit={kit} look={MATE_LOOKS[1]} scale={2} />
                </div>
              </>
            )}
            {scene === 'team' && (
              <>
                <div className="tr-lane" />
                {([0, 1] as const).map((i) => (
                  <div
                    key={i}
                    className="tr-fig s2 tr-mate"
                    style={{ left: MB[i][0] - 42, top: 40 }}
                    onPointerDown={down(() => E.pick(i))}
                  >
                    <Figure
                      fig={st.mates[i]}
                      kit={kit}
                      look={MATE_LOOKS[i]}
                      scale={2}
                    />
                    {st.open === i && (
                      <span className="tr-bubble gold">{tr('여기!')}</span>
                    )}
                  </div>
                ))}
                {me(3, { left: 195, top: 104 })}
                <div className="tr-catch" />
              </>
            )}
            {scene === 'reb' && (
              <>
                <div className="tr-key" />
                <img
                  ref={rf('hoop')}
                  className="px tr-hoop"
                  src={hoopURL(st.swish)}
                  alt=""
                />
                <div className="tr-reb-box" />
                {me(2, { left: 310, top: 128 })}
              </>
            )}
            {scene === 'front' && (
              <>
                <div className="tr-lane" />
                {opp({ left: 210, top: 56 })}
                {st.dMsg === 'bit' && (
                  <span className="tr-bubble gold tr-dmsg">
                    {tr('속았다!')}
                  </span>
                )}
                {st.dMsg === 'read' && (
                  <span className="tr-bubble ink tr-dmsg">{tr('안 속네')}</span>
                )}
                {me(3, { left: 195, top: 104 }, 'g1')}
                {me(3, { left: 195, top: 104 }, 'g2')}
                {me(3, { left: 195, top: 104 })}
              </>
            )}
            {scene === 'react' && (
              <>
                <div className="tr-rt">
                  <span>{tr('반응 시간')}</span>
                  <b>{st.rt == null ? '-.---' : (st.rt / 1000).toFixed(3)}</b>
                  <span>
                    {tr('{s}초 안에 누르기', { s: (st.lim / 1000).toFixed(2) })}
                  </span>
                </div>
                {st.best != null && (
                  <span className="tr-best">
                    {tr('최고 {s}초', { s: (st.best / 1000).toFixed(3) })}
                  </span>
                )}
                {me(2, { left: 210, top: 84 })}
                {lamp(0, '↑', 208, 8)}
                {lamp(1, '←', 92, 104)}
                {lamp(2, '→', 324, 104)}
                {lamp(3, '↓', 208, 200)}
              </>
            )}
            {scene === 'lift' && (
              <>
                <div className="tr-rack" />
                <div className="tr-counter">
                  <span>REP</span>
                  <b>{cur}</b>
                  <span>/ {DRILL_REPS}</span>
                </div>
                <div className="tr-time">
                  <span>{tr('남은 시간')}</span>
                  <div>
                    <div ref={rf('tb')} />
                  </div>
                </div>
                <span className="tr-top-label">{tr('끝까지')}</span>
                <div className="tr-bar">
                  <div className="tr-bar-stick" />
                  <div ref={rf('lp')} className="tr-bar-fill" />
                  <div className="tr-bar-cap" />
                </div>
                {st.stick && <span className="tr-stick">{tr('고비!')}</span>}
                <img
                  ref={rf('p')}
                  className={`px tr-lifter ${kind}`}
                  src={
                    kind === 'bench'
                      ? benchURL(lift, st.lift)
                      : squatURL(lift, st.lift)
                  }
                  alt=""
                />
              </>
            )}
            <img
              ref={rf('ball')}
              className="px tr-ball"
              src={iconURL('ball')}
              alt=""
            />
            {st.call && (
              <p
                className={`tr-call ${st.good ? 'good' : ''} ${side ? 'side' : ''}`}
              >
                {tr(st.call)}
              </p>
            )}
          </div>
          {(scene === 'shoot' || scene === 'pass') && (
            <div className={`tr-gauge-wrap ${scene}`}>
              <div className="tr-gauge-labels">
                <span>{tr(scene === 'pass' ? '가까이' : '약하게')}</span>
                <span>{tr(scene === 'pass' ? '멀리' : '세게')}</span>
              </div>
              <div className="tr-gauge">
                <div ref={rf('fill')} className="tr-gauge-fill" />
                <div
                  className="tr-gauge-zone"
                  style={{
                    left: `${(lo * 100).toFixed(1)}%`,
                    width: `${((hi - lo) * 100).toFixed(1)}%`,
                  }}
                />
              </div>
            </div>
          )}
          <DrillDots results={st.res} cur />
        </div>
      </div>

      {d.ctl === 'hold' &&
        big(btnText, {
          onPointerDown: down(E.press),
          onPointerUp: () => E.release(),
          onPointerLeave: () => E.release(),
          onPointerCancel: () => E.release(),
        })}
      {d.ctl === 'tap' && big(btnText, { onPointerDown: down(E.tap) })}
      {d.ctl === 'mash' && big(btnText, { onPointerDown: down(E.mash) })}
      {d.ctl === 'lr' && (
        <div className="tr-keys">
          {big(`← ${tr('왼쪽')}`, { onPointerDown: down(() => E.choose(-1)) })}
          {big(`${tr('오른쪽')} →`, { onPointerDown: down(() => E.choose(1)) })}
        </div>
      )}
      {d.ctl === 'team' && (
        <div className="tr-keys">
          {big(`← ${tr('왼쪽 동료')}`, {
            onPointerDown: down(() => E.pick(0)),
          })}
          {big(`${tr('오른쪽 동료')} →`, {
            onPointerDown: down(() => E.pick(1)),
          })}
        </div>
      )}
      {d.ctl === 'fake' && (
        <div className="tr-keys">
          {big(
            `← ${tr('페이크')}`,
            { onPointerDown: down(() => E.fake(-1)) },
            'ghost big tr-btn',
          )}
          {big(
            `${tr('페이크')} →`,
            { onPointerDown: down(() => E.fake(1)) },
            'ghost big tr-btn',
          )}
          {big(`← ${tr('돌파')}`, { onPointerDown: down(() => E.choose(-1)) })}
          {big(`${tr('돌파')} →`, { onPointerDown: down(() => E.choose(1)) })}
        </div>
      )}
      <p className="muted drill-hint">{tr(KB_HINT[d.ctl])}</p>
    </div>
  )
}

// 회차 결과 점 10개. cur 면 지금 회차를 노랗게
export function DrillDots({
  results,
  cur = false,
}: {
  results: boolean[]
  cur?: boolean
}) {
  return (
    <ol className="shots" aria-label={tr('훈련 결과')}>
      {Array.from({ length: DRILL_REPS }, (_, i) => (
        <li
          key={i}
          className={
            i < results.length
              ? results[i]
                ? 'in'
                : 'out'
              : cur && i === results.length
                ? 'cur'
                : undefined
          }
        />
      ))}
    </ol>
  )
}

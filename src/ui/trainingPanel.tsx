import { useEffect, useRef, useState } from 'react'
import {
  DRILL_CATS,
  DRILL_KINDS,
  DRILL_MAX,
  DRILL_NEED,
  drillGain,
  DRILL_REPS,
  type DrillCat,
  DRILLS,
} from '../engine/events'
import { availableDrills, playDrill } from '../engine/game'
import { ATTR_LABELS, EV_MAX } from '../engine/player'
import type { DrillKind, GameState } from '../engine/types'
import { T, tr } from '../i18n'
import { CTL_LABEL } from './drillEngine'
import { DrillDots, DrillPlay } from './drillPlay'
import type { Kit } from './pose'

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

type View =
  | { at: 'list' }
  | { at: 'play'; kind: DrillKind }
  | {
      at: 'result'
      kind: DrillKind
      made: number
      before: number
      after: number
    }

// 코치에게 맡기기: 성공 수 3~7개 균등 (엔진의 'auto' 와 같은 분포)
const coachMade = () => 3 + Math.floor(Math.random() * 5)

// 시즌 진행 전 훈련: 6종목 10가지 중 오프시즌마다 최대 DRILL_MAX 개, 종류별로 한 번.
// 목록(종목 탭 + 카드) → 플레이 → 결과. 모션 줄이기면 시작도 코치에게 맡긴다
export function TrainingPanel({
  state,
  kit,
  onChange,
  onClose,
}: {
  state: GameState
  kit: Kit
  onChange: (s: GameState) => void
  onClose: () => void
}) {
  const [view, setView] = useState<View>({ at: 'list' })
  const [cat, setCat] = useState<DrillCat>('shoot')
  // 이번 패널에서 마친 훈련의 성공 수 (저장하지 않는다. 저장에는 종류만 남는다)
  const [made, setMade] = useState<Partial<Record<DrillKind, number>>>({})
  const left = availableDrills(state)
  const done = state.drillsDone ?? []
  const full = done.length >= DRILL_MAX
  // 히어로 카드 아래에 열리므로 열리면 패널로 스크롤
  // (스크롤 메서드가 Promise 를 반환하는 브라우저가 있어 effect 에서 값을 돌려주지 않는다)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'start' })
  }, [])

  const finish = (kind: DrillKind, n: number) => {
    const { attr } = DRILLS[kind]
    const before = state.player.attrs[attr]
    const next = playDrill(state, kind, `made:${n}`)
    setMade((m) => ({ ...m, [kind]: n }))
    setView({
      at: 'result',
      kind,
      made: n,
      before,
      after: next.player.attrs[attr],
    })
    onChange(next)
  }
  const start = (kind: DrillKind) =>
    reducedMotion() ? finish(kind, coachMade()) : setView({ at: 'play', kind })
  const back = () => setView({ at: 'list' })
  // 결과 화면의 "다음": 지금 종류 뒤부터 돌며 아직 할 수 있는 첫 훈련
  const nextOf = (kind: DrillKind) => {
    const i = DRILL_KINDS.indexOf(kind)
    for (let j = 1; j < DRILL_KINDS.length; j++) {
      const x = DRILL_KINDS[(i + j) % DRILL_KINDS.length]
      if (left.includes(x)) return x
    }
    return null
  }

  const title =
    view.at === 'play'
      ? tr(DRILLS[view.kind].title)
      : view.at === 'result'
        ? tr('훈련 결과')
        : tr('훈련하기')

  return (
    <section ref={ref} className="panel training">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{tr('시즌 진행 전 훈련')}</p>
          <h2>{title}</h2>
        </div>
        <div className="row nowrap">
          <span className="tr-progress">
            {tr('완료 {n} / {max}', { n: done.length, max: DRILL_MAX })}
          </span>
          <button
            className="ghost"
            onClick={() => (view.at === 'list' ? onClose() : back())}
          >
            {view.at === 'list' ? tr('닫기') : tr('◀ 목록으로')}
          </button>
        </div>
      </div>

      {view.at === 'play' && (
        <DrillPlay
          key={view.kind}
          kind={view.kind}
          skill={state.player.attrs[DRILLS[view.kind].attr]}
          kit={kit}
          look={state.player.look}
          onDone={(n) => finish(view.kind, n)}
        />
      )}

      {view.at === 'result' && (
        <ResultView view={view} next={nextOf(view.kind)} onNext={start} />
      )}

      {view.at === 'list' && (
        <>
          <div className="tr-tabs" role="tablist" aria-label={tr('훈련 종목')}>
            {DRILL_CATS.map(([c, label]) => {
              const ids = DRILL_KINDS.filter((k) => DRILLS[k].cat === c)
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  onClick={() => setCat(c)}
                >
                  <span>{tr(label)}</span>
                  <small>
                    {ids.filter((k) => done.includes(k)).length}/{ids.length}
                  </small>
                </button>
              )
            })}
          </div>
          <p className="muted">
            {tr(
              '훈련마다 오프시즌에 한 번, {reps}개 중 {need}개 이상 성공하면 능력치가 올라요. 이번 오프시즌에는 최대 {max}개까지 할 수 있어요.',
              { reps: DRILL_REPS, need: DRILL_NEED, max: DRILL_MAX },
            )}
          </p>
          <div className="tr-cards">
            {DRILL_KINDS.filter((k) => DRILLS[k].cat === cat).map((k) => {
              const d = DRILLS[k]
              const isDone = done.includes(k)
              const open = left.includes(k)
              return (
                <div key={k} className={open ? 'tr-card' : 'tr-card off'}>
                  <div className="tr-card-info">
                    <b>{tr(d.title)}</b>
                    <span>{tr(d.desc)}</span>
                    <span className="tr-chips">
                      <span className="tr-chip ink">
                        {tr(CTL_LABEL[d.ctl])}
                      </span>
                      <span className="tr-chip ink">
                        {tr('성공 시 +{n}', { n: drillGain(state.player, k) })}
                      </span>
                      <span className="tr-chip">
                        {tr(ATTR_LABELS[d.attr])}{' '}
                        {Math.round(state.player.attrs[d.attr])}
                      </span>
                      <span className="tr-chip">
                        {tr('노력치 {n}/{max}', {
                          n: state.player.ev[d.attr] ?? 0,
                          max: EV_MAX,
                        })}
                      </span>
                    </span>
                  </div>
                  {isDone ? (
                    <span className="tr-done">
                      {made[k] !== undefined
                        ? tr('완료 {made}/{reps}', {
                            made: made[k],
                            reps: DRILL_REPS,
                          })
                        : tr('이번 오프시즌 완료')}
                    </span>
                  ) : !open ? (
                    <span className="tr-done off">
                      {tr('이번 오프시즌 한도')}
                    </span>
                  ) : (
                    <div className="tr-card-actions">
                      <button className="primary" onClick={() => start(k)}>
                        {tr('시작 ▶')}
                      </button>
                      <button
                        className="ghost"
                        onClick={() => finish(k, coachMade())}
                      >
                        {tr('코치에게 맡기기')}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {full && (
            <p className="muted drill-hint">
              {tr(
                '이번 오프시즌 훈련을 모두 마쳤어요. 시즌을 진행하면 다시 열려요.',
              )}
            </p>
          )}
        </>
      )}
    </section>
  )
}

function ResultView({
  view,
  next,
  onNext,
}: {
  view: Extract<View, { at: 'result' }>
  next: DrillKind | null
  onNext: (k: DrillKind) => void
}) {
  const d = DRILLS[view.kind]
  const pass = view.made >= DRILL_NEED
  // 능력치는 소수로 쌓이므로 화면(AttrBars)처럼 반올림해 보여 준다
  const before = Math.round(view.before)
  const after = Math.round(view.after)
  const attr = T(ATTR_LABELS[d.attr])
  const attrLabel = tr(ATTR_LABELS[d.attr])
  const msg = !pass
    ? tr('{need}개 이상 성공해야 능력치가 올라요. 감각은 익혔어요.', {
        need: DRILL_NEED,
      })
    : after > before
      ? tr('{attr} 능력치가 {n} 올랐어요. 다음 시즌 경기에 바로 반영돼요.', {
          attr,
          n: after - before,
        })
      : tr('{attr} 이미 최고치예요', { attr })
  const results = Array.from({ length: DRILL_REPS }, (_, i) => i < view.made)
  return (
    <div className="tr-result">
      <p className="tr-eyebrow">
        {tr(DRILL_CATS.find(([k]) => k === d.cat)![1])} · {tr('훈련 결과')}
      </p>
      <h3>{tr(d.title)}</h3>
      <div className="tr-score">
        <span>{tr('{n}개 중', { n: DRILL_REPS })}</span>
        <b>{view.made}</b>
        <span>{tr('개 성공')}</span>
      </div>
      <DrillDots results={results} />
      <div className="tr-attr">
        <span>{attrLabel}</span>
        <b>{before}</b>
        {after > before && (
          <>
            <span>→</span>
            <b className="up">{after}</b>
          </>
        )}
      </div>
      <p className="muted tr-msg">{msg}</p>
      {/* 목록으로는 머리글 버튼 하나만 둔다 */}
      {next && (
        <div className="row tr-result-btns">
          <button className="primary" onClick={() => onNext(next)}>
            {tr('다음 · {name} ▶', { name: T(DRILLS[next].title) })}
          </button>
        </div>
      )}
    </div>
  )
}

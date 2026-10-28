import { useEffect, useRef, useState } from 'react'
import { DRILL_KINDS, DRILL_REPS, drillOutcome, DRILLS } from '../engine/events'
import { T, type Text, tr, tx } from '../i18n'
import { availableDrills, playDrill } from '../engine/game'
import { ATTR_LABELS } from '../engine/player'
import type { DrillKind, GameState } from '../engine/types'
import { DrillGame } from './drillGame'
import type { Kit } from './pose'

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

// 시즌 진행 전 훈련: 종류별로 오프시즌마다 한 번. 6개 이상 성공하면 능력치 +1
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
  const [playing, setPlaying] = useState<DrillKind | null>(null)
  // 결과는 문장 조각으로 두고 그릴 때 번역한다 (언어를 바꿔도 따라가게)
  const [result, setResult] = useState<Text[]>([])
  const left = availableDrills(state)
  // 히어로 카드 아래에 열리므로 열리면 패널로 스크롤
  const ref = useRef<HTMLElement>(null)
  // (스크롤 메서드가 Promise 를 반환하는 브라우저가 있어 effect 에서 값을 돌려주지 않는다)
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'start' })
  }, [])

  // optionId: 'made:N' 또는 'auto' (모션 줄이기: 코치에게 맡기기)
  const finish = (kind: DrillKind, optionId: string) => {
    const { attr, title } = DRILLS[kind]
    const before = state.player.attrs[attr]
    const next = playDrill(state, kind, optionId)
    const raised = next.player.attrs[attr] > before
    const made = optionId.startsWith('made:') ? Number(optionId.slice(5)) : null
    // 코치에게 맡기면 성공 수를 모르니, 최고치에서 못 오른 경우만 성공으로 본다
    const success = made === null ? raised || before >= 99 : made >= 6
    setResult([
      title,
      ...(made === null
        ? []
        : [{ k: '{reps}개 중 {made}개 성공', v: { reps: DRILL_REPS, made } }]),
      drillOutcome(attr, success, raised),
    ])
    setPlaying(null)
    onChange(next)
  }

  return (
    <section ref={ref} className="panel training">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{tr('시즌 진행 전 훈련')}</p>
          <h2>{playing ? tr(DRILLS[playing].title) : tr('훈련하기')}</h2>
        </div>
        <button
          className="ghost"
          onClick={() => (playing ? setPlaying(null) : onClose())}
        >
          {playing ? tr('목록으로') : tr('닫기')}
        </button>
      </div>
      {playing ? (
        <>
          <p>{tr(DRILLS[playing].body, { reps: DRILL_REPS })}</p>
          <DrillGame
            kind={playing}
            kit={kit}
            look={state.player.look}
            attrs={state.player.attrs}
            onDone={(n) => finish(playing, `made:${n}`)}
          />
        </>
      ) : (
        <>
          {result.length > 0 && (
            <p className="train-result">
              {tx(result[0])}: {result.slice(1).map(tx).join(' · ')}
            </p>
          )}
          <p className="muted">
            {tr(
              '종류마다 오프시즌에 한 번, {reps}개 중 6개 이상 성공하면 능력치 +1.',
              { reps: DRILL_REPS },
            )}
          </p>
          <div className="options">
            {DRILL_KINDS.map((k) => {
              const done = !left.includes(k)
              const { title, attr } = DRILLS[k]
              return (
                <button
                  key={k}
                  className="option"
                  disabled={done}
                  onClick={() =>
                    reducedMotion() ? finish(k, 'auto') : setPlaying(k)
                  }
                >
                  <b>{tr(title)}</b>
                  <small>
                    {done
                      ? tr('이번 오프시즌 완료')
                      : reducedMotion()
                        ? tr('코치에게 맡기기 · {attr}', {
                            attr: T(ATTR_LABELS[attr]),
                          })
                        : tr('{attr} 능력치', { attr: T(ATTR_LABELS[attr]) })}
                  </small>
                </button>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { tr } from '../i18n'
import { DRILL_REPS } from '../engine/events'
import type { Look } from '../engine/types'
import { beatDefender, reactionMs, type Side } from './drill'
import { useDrillRun } from './drillHooks'
import { DrillDots } from './drillParts'
import { PixelPlayer } from './pixelPlayer'
import type { Kit } from './pose'
import { ROSTER } from './sprite'

const DEFENDER: Kit = { jersey: '#cc3049', number: '#ffffff' }
const DEFENDER_LOOK = ROSTER[7].look

type Phase =
  | { at: 'wait' }
  | { at: 'lean'; lean: Side }
  | {
      at: 'result'
      lean: Side | null
      go: Side | null
      ok: boolean
      call: string
    }

// 드리블 훈련: 수비가 한쪽으로 기울면 제한 시간 안에 반대쪽으로 돌파
export function DribbleDrill({
  kit,
  look,
  onDone,
}: {
  kit: Kit
  look?: Look
  onDone: (made: number) => void
}) {
  const run = useDrillRun(onDone)
  const { later, push } = run
  const [phase, setPhase] = useState<Phase>({ at: 'wait' })
  const round = run.results.length
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  // 대기 → 수비 기울기 → (반응 시간 초과면 실패)
  useEffect(() => {
    if (run.done || phase.at !== 'wait') return
    const lean: Side = Math.random() < 0.5 ? 'left' : 'right'
    const id = setTimeout(
      () => {
        setPhase({ at: 'lean', lean })
        timeout.current = setTimeout(
          () =>
            setPhase({
              at: 'result',
              lean,
              go: null,
              ok: false,
              call: tr('늦었어요'),
            }),
          reactionMs(round),
        )
      },
      600 + Math.random() * 700,
    )
    return () => clearTimeout(id)
  }, [phase.at, round, run.done])
  useEffect(() => () => clearTimeout(timeout.current), [])

  // 결과를 보여준 뒤 다음 회차로
  useEffect(() => {
    if (phase.at !== 'result') return
    const ok = phase.ok
    later(() => {
      push(ok)
      setPhase({ at: 'wait' })
    }, 800)
  }, [phase, later, push])

  const choose = (go: Side) => {
    if (run.done || phase.at === 'result') return
    clearTimeout(timeout.current)
    if (phase.at === 'wait') {
      setPhase({
        at: 'result',
        lean: null,
        go,
        ok: false,
        call: tr('너무 빨라요'),
      })
      return
    }
    const ok = beatDefender(go, phase.lean)
    setPhase({
      at: 'result',
      lean: phase.lean,
      go,
      ok,
      call: ok ? tr('돌파 성공!') : tr('막혔어요'),
    })
  }

  // 방향키로도 고른다 (choose 가 바뀌면 다시 구독)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') choose('left')
      if (e.key === 'ArrowRight') choose('right')
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const lean = phase.at === 'wait' ? null : phase.lean
  const go = phase.at === 'result' ? phase.go : null
  return (
    <div className="drill">
      <div className="court dribble">
        <div className={lean ? `defender lean-${lean}` : 'defender'}>
          <PixelPlayer
            pose={phase.at === 'result' && phase.ok ? 'sad' : 'guard'}
            kit={DEFENDER}
            look={DEFENDER_LOOK}
            scale={2}
          />
        </div>
        <div className={go ? `dribbler go-${go}` : 'dribbler'}>
          <PixelPlayer pose="idle" kit={kit} look={look} scale={2} />
        </div>
        {phase.at === 'result' && (
          <p className={phase.ok ? 'call good' : 'call'}>{phase.call}</p>
        )}
      </div>
      <DrillDots results={run.results} />
      <div className="dribble-keys">
        <button
          className="primary big"
          disabled={run.done}
          onClick={() => choose('left')}
        >
          ← {tr('왼쪽')}
        </button>
        <button
          className="primary big"
          disabled={run.done}
          onClick={() => choose('right')}
        >
          {tr('오른쪽')} →
        </button>
      </div>
      <p className="muted drill-hint">
        {run.done
          ? tr('{n}개 성공!', { n: run.made })
          : tr('수비가 기우는 반대쪽으로! ({i}/{n})', {
              i: round + 1,
              n: DRILL_REPS,
            })}
      </p>
      {!run.done && (
        <p className="muted drill-hint">
          {tr('키보드 ← → 방향키로도 할 수 있어요')}
        </p>
      )}
    </div>
  )
}

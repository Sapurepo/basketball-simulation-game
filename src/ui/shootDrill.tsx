import { useState } from 'react'
import { DRILL_REPS } from '../engine/events'
import { judge, SHOT_ZONE, type Verdict } from './drill'
import { useDrillRun, useHoldGauge } from './drillHooks'
import { DrillDots, Gauge } from './drillParts'
import { iconURL } from './sprite'

const CALL: Record<Verdict, string> = {
  good: '골인!',
  short: '짧아요',
  long: '길어요',
}

// 슈팅 훈련: 공은 화면 가운데, 골대는 앞(위). 게이지를 초록 구간에서 떼면 골인
export function ShootDrill({ onDone }: { onDone: (made: number) => void }) {
  const run = useDrillRun(onDone)
  const [flight, setFlight] = useState<Verdict | null>(null)
  const gauge = useHoldGauge(!!flight || run.done, (v) => {
    const verdict = judge(v, SHOT_ZONE)
    setFlight(verdict)
    run.later(() => {
      run.push(verdict === 'good')
      setFlight(null)
    }, 900)
  })

  return (
    <div className="drill">
      <div className="drill-stage">
        <div className="court shoot">
          <img className="px hoop" src={iconURL('hoop')} alt="골대" />
          <img
            key={run.results.length}
            className={flight ? `px ball fly-${flight}` : 'px ball'}
            src={iconURL('ball')}
            alt=""
          />
          {flight && (
            <p className={flight === 'good' ? 'call good' : 'call'}>
              {CALL[flight]}
            </p>
          )}
        </div>
        <Gauge zone={SHOT_ZONE} fillRef={gauge.fillRef} />
      </div>
      <DrillDots results={run.results} />
      <button
        className={gauge.holding ? 'primary big holding' : 'primary big'}
        disabled={run.done || !!flight}
        {...gauge.bind}
      >
        {run.done
          ? `${run.made}개 성공!`
          : `누르고 있다가 떼서 슛 (${run.results.length + 1}/${DRILL_REPS})`}
      </button>
    </div>
  )
}

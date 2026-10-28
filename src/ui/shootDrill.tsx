import { tr } from '../i18n'
import { useState } from 'react'
import { DRILL_REPS } from '../engine/events'
import { judge, shotZone, type Verdict } from './drill'
import { useDrillRun, useHoldGauge } from './drillHooks'
import { DrillDots, Gauge } from './drillParts'
import { iconURL } from './sprite'

const CALL: Record<Verdict, string> = {
  good: '골인!',
  short: '짧아요',
  long: '길어요',
  late: '너무 오래 잡았어요',
}

// 슈팅 훈련: 공은 화면 가운데, 골대는 앞(위). 게이지를 초록 구간에서 떼면 골인.
// 구간 폭은 슈팅 능력치(skill)에 비례
export function ShootDrill({
  skill,
  onDone,
}: {
  skill: number
  onDone: (made: number) => void
}) {
  const run = useDrillRun(onDone)
  const zone = shotZone(skill)
  const [flight, setFlight] = useState<Verdict | null>(null)
  const gauge = useHoldGauge(!!flight || run.done, (v, late) => {
    const verdict = late ? 'late' : judge(v, zone)
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
          <img className="px hoop" src={iconURL('hoop')} alt={tr('골대')} />
          <img
            key={run.results.length}
            className={flight ? `px ball fly-${flight}` : 'px ball'}
            src={iconURL('ball')}
            alt=""
          />
          {flight && (
            <p className={flight === 'good' ? 'call good' : 'call'}>
              {tr(CALL[flight])}
            </p>
          )}
        </div>
        <Gauge zone={zone} fillRef={gauge.fillRef} />
      </div>
      <DrillDots results={run.results} />
      <button
        className={gauge.holding ? 'primary big holding' : 'primary big'}
        disabled={run.done || !!flight}
        {...gauge.bind}
      >
        {run.done
          ? tr('{n}개 성공!', { n: run.made })
          : tr('누르고 있다가 떼서 슛 ({i}/{n})', {
              i: run.results.length + 1,
              n: DRILL_REPS,
            })}
      </button>
    </div>
  )
}

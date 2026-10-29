import { tr } from '../i18n'
import { type CSSProperties, useState } from 'react'
import { DRILL_REPS } from '../engine/events'
import type { Look } from '../engine/types'
import { judge, passDistance, passZone, type Verdict } from './drill'
import { useDrillRun, useHoldGauge } from './drillHooks'
import { DrillDots, Gauge } from './drillParts'
import { PixelPlayer } from './pixelPlayer'
import type { Kit } from './pose'
import { iconURL, ROSTER } from './sprite'

const CALL: Record<Verdict, string> = {
  good: '나이스 패스!',
  short: '짧아요',
  long: '너무 세요',
  late: '너무 오래 잡았어요',
}

// 패스 훈련: 동료가 매번 다른 거리에 선다. 게이지 높이 = 공이 가는 거리.
// 구간 폭은 패스 능력치(skill)에 비례
export function PassDrill({
  kit,
  skill,
  onDone,
}: {
  kit: Kit
  skill: number
  onDone: (made: number) => void
}) {
  const run = useDrillRun(onDone)
  const [dist, setDist] = useState(() => passDistance())
  const [flight, setFlight] = useState<{ v: number; verdict: Verdict } | null>(
    null,
  )
  const zone = passZone(dist, skill)
  const gauge = useHoldGauge(!!flight || run.done, (v, late) => {
    const verdict = late ? 'late' : judge(v, zone)
    setFlight({ v, verdict })
    run.later(() => {
      run.push(verdict === 'good')
      setFlight(null)
      setDist(passDistance())
    }, 1000)
  })
  const mate: Look = ROSTER[(run.results.length * 5 + 2) % ROSTER.length].look

  return (
    <div className="drill">
      <div className="drill-stage">
        <div className="court pass" style={{ '--d': dist } as CSSProperties}>
          <div className="mate">
            <PixelPlayer
              pose={flight?.verdict === 'good' ? 'cheer' : 'guard'}
              kit={kit}
              look={mate}
              scale={2}
            />
          </div>
          <img
            key={run.results.length}
            className={flight ? 'px ball flying' : 'px ball'}
            style={flight ? ({ '--to': flight.v } as CSSProperties) : undefined}
            src={iconURL('ball')}
            alt=""
          />
          {flight && (
            <p className={flight.verdict === 'good' ? 'call good' : 'call'}>
              {tr(CALL[flight.verdict])}
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
          : tr('누르고 있다가 떼서 패스 ({i}/{n})', {
              i: run.results.length + 1,
              n: DRILL_REPS,
            })}
      </button>
      {!run.done && (
        <p className="muted drill-hint">
          {tr('키보드 스페이스·엔터 키로도 할 수 있어요')}
        </p>
      )}
    </div>
  )
}

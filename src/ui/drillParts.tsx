import type { RefObject } from 'react'
import { DRILL_REPS } from '../engine/events'
import type { Zone } from './drill'

// 세로 게이지: 0(아래)~1(위), 초록 구간 표시. 채움은 useHoldGauge 가 ref 로 그린다
export function Gauge({
  zone,
  fillRef,
}: {
  zone: Zone
  fillRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="gauge" aria-hidden>
      <div
        className="gauge-zone"
        style={{
          bottom: `${zone[0] * 100}%`,
          height: `${(zone[1] - zone[0]) * 100}%`,
        }}
      />
      <div ref={fillRef} className="gauge-fill" />
    </div>
  )
}

export function DrillDots({ results }: { results: boolean[] }) {
  return (
    <ol className="shots" aria-label="훈련 결과">
      {Array.from({ length: DRILL_REPS }, (_, i) => (
        <li
          key={i}
          className={
            i < results.length ? (results[i] ? 'in' : 'out') : undefined
          }
        />
      ))}
    </ol>
  )
}

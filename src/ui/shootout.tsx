import { useEffect, useRef, useState } from 'react'
import { SHOOTOUT_SHOTS } from '../engine/events'

// 타이밍 바: 마커가 좌우로 왕복하고, 가운데 구간에서 멈추면 성공
const ZONE: [number, number] = [0.4, 0.6]
const PERIOD = 900

export function Shootout({ onDone }: { onDone: (made: number) => void }) {
  const [results, setResults] = useState<boolean[]>([])
  const [pos, setPos] = useState(0)
  const start = useRef(0)
  const done = results.length >= SHOOTOUT_SHOTS

  useEffect(() => {
    if (done) {
      const id = setTimeout(() => onDone(results.filter(Boolean).length), 700)
      return () => clearTimeout(id)
    }
    if (!start.current) start.current = performance.now()
    let raf = 0
    const tick = (t: number) => {
      setPos((1 - Math.cos(((t - start.current) / PERIOD) * Math.PI)) / 2)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [done, results, onDone])

  const shoot = () => {
    if (done) return
    setResults([...results, pos >= ZONE[0] && pos <= ZONE[1]])
    start.current = performance.now() - Math.random() * PERIOD
  }

  return (
    <div className="shootout">
      <div className="timing" aria-hidden>
        <div
          className="zone"
          style={{
            left: `${ZONE[0] * 100}%`,
            width: `${(ZONE[1] - ZONE[0]) * 100}%`,
          }}
        />
        <div className="marker" style={{ left: `${pos * 100}%` }} />
      </div>
      <ol className="shots" aria-label="슛 결과">
        {Array.from({ length: SHOOTOUT_SHOTS }, (_, i) => (
          <li
            key={i}
            className={
              i < results.length ? (results[i] ? 'in' : 'out') : undefined
            }
          />
        ))}
      </ol>
      <button className="primary big" onClick={shoot} disabled={done}>
        {done
          ? `${results.filter(Boolean).length}개 성공!`
          : `슛! (${results.length + 1}/${SHOOTOUT_SHOTS})`}
      </button>
    </div>
  )
}

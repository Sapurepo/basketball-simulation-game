import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { DRILL_REPS } from '../engine/events'
import { gaugeAt, OVERFILL } from './drill'

const paint = (el: HTMLDivElement | null, v: number) => {
  if (el) el.style.transform = `scaleY(${Math.min(v, 1)})`
}
const isKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter'

// 누르고 있는 동안 게이지가 차고, 떼는 순간 값을 넘긴다 (포인터·스페이스·엔터)
// 값은 매 프레임 바뀌므로 리렌더 없이 ref 로 transform 만 갱신한다.
// 다시 쓸 수 있게 되면(disabled 해제) 게이지를 비운다.
export function useHoldGauge(
  disabled: boolean,
  onRelease: (v: number) => void,
) {
  const fillRef = useRef<HTMLDivElement>(null)
  const start = useRef(0)
  const raf = useRef(0)
  const [holding, setHolding] = useState(false)
  const holdingRef = useRef(false)
  const releaseRef = useRef(onRelease)
  useLayoutEffect(() => {
    releaseRef.current = onRelease
  })
  useEffect(() => {
    if (!disabled) paint(fillRef.current, 0)
  }, [disabled])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const release = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    cancelAnimationFrame(raf.current)
    const v = gaugeAt(performance.now() - start.current)
    paint(fillRef.current, v)
    releaseRef.current(Math.min(v, OVERFILL))
  }, [])
  const press = () => {
    if (disabled || holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    start.current = performance.now()
    const tick = () => {
      const v = gaugeAt(performance.now() - start.current)
      paint(fillRef.current, v)
      if (v >= OVERFILL) release()
      else raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  return {
    fillRef,
    holding,
    bind: {
      onPointerDown: press,
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
      onKeyDown: (e: KeyboardEvent) => {
        if (!isKey(e)) return
        e.preventDefault()
        if (!e.repeat) press()
      },
      onKeyUp: (e: KeyboardEvent) => {
        if (isKey(e)) release()
      },
    },
  }
}

// 회차 결과를 쌓고, 다 채우면 잠시 뒤 성공 수를 한 번만 넘긴다. 타이머는 언마운트 때 정리
export function useDrillRun(onDone: (made: number) => void) {
  const [results, setResults] = useState<boolean[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const doneRef = useRef(onDone)
  useLayoutEffect(() => {
    doneRef.current = onDone
  })
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])
  const push = useCallback((ok: boolean) => setResults((r) => [...r, ok]), [])
  const done = results.length >= DRILL_REPS
  const made = results.filter(Boolean).length
  useEffect(() => {
    if (done) later(() => doneRef.current(made), 700)
  }, [done, made, later])
  useEffect(() => {
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])
  return { results, done, made, later, push }
}

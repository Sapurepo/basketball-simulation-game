import {
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { DRILL_REPS } from '../engine/events'
import { gaugeAt, MAX_HOLD_MS } from './drill'

const paint = (el: HTMLDivElement | null, v: number) => {
  if (el) el.style.transform = `scaleY(${Math.min(v, 1)})`
}
const isKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter'

// 누르고 있는 동안 게이지가 오르내리고, 떼는 순간 값을 넘긴다 (포인터·스페이스·엔터)
// 너무 오래 잡고 있으면(MAX_HOLD_MS) late=true 로 자동으로 놓는다.
// 값은 매 프레임 바뀌므로 리렌더 없이 ref 로 transform 만 갱신한다.
// 다시 쓸 수 있게 되면(disabled 해제) 게이지를 비운다.
export function useHoldGauge(
  disabled: boolean,
  onRelease: (v: number, late: boolean) => void,
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

  const release = useCallback((late = false) => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    cancelAnimationFrame(raf.current)
    const v = gaugeAt(performance.now() - start.current)
    paint(fillRef.current, v)
    releaseRef.current(v, late)
  }, [])
  const press = () => {
    if (disabled || holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    start.current = performance.now()
    const tick = () => {
      const held = performance.now() - start.current
      if (held >= MAX_HOLD_MS) return release(true)
      paint(fillRef.current, gaugeAt(held))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const letGo = () => release()

  // 스페이스·엔터는 화면 전체에서 받는다. 버튼에 묶으면 비활성화될 때 포커스를 잃어 다음 회차부터 안 먹는다
  useEffect(() => {
    if (disabled) return
    const down = (e: KeyboardEvent) => {
      if (!isKey(e)) return
      e.preventDefault()
      if (!e.repeat) press()
    }
    const up = (e: KeyboardEvent) => {
      if (isKey(e)) letGo()
    }
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
    }
  })

  return {
    fillRef,
    holding,
    bind: {
      onPointerDown: press,
      onPointerUp: letGo,
      onPointerLeave: letGo,
      onPointerCancel: letGo,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
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

import { useSyncExternalStore } from 'react'

// 화면의 모든 선수·시계가 한 타이머로 같은 박자(380ms)에 프레임을 넘긴다
let tick = 0
let timer: ReturnType<typeof setInterval> | undefined
const subs = new Set<() => void>()
function subscribe(cb: () => void) {
  subs.add(cb)
  const reduced =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!timer && !reduced) {
    timer = setInterval(() => {
      tick++
      subs.forEach((f) => f())
    }, 380)
  }
  return () => {
    subs.delete(cb)
    if (!subs.size) {
      clearInterval(timer)
      timer = undefined
    }
  }
}
export const useFrame = () => useSyncExternalStore(subscribe, () => tick % 2)

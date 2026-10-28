import { useSyncExternalStore } from 'react'
import type { Look } from '../engine/types'
import type { Kit, Pose } from './pose'
import { DEFAULT_LOOK, type DrawnPose, H, spriteURL, W } from './sprite'

// v2 에 없는 포즈는 가장 가까운 포즈로 그린다
const DRAWN: Record<Pose, DrawnPose> = {
  idle: 'idle',
  shoot: 'shoot',
  cheer: 'cheer',
  sad: 'sad',
  celebrate: 'cheer',
  injured: 'sad',
  salute: 'cheer',
  wave: 'cheer',
  guard: 'guard',
  trophy: 'trophy',
}

// 화면의 모든 선수가 한 타이머로 같은 박자(380ms)에 프레임을 넘긴다
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
const useFrame = () => useSyncExternalStore(subscribe, () => tick % 2)

export function PixelPlayer({
  pose,
  kit,
  look = DEFAULT_LOOK,
  scale = 3,
}: {
  pose: Pose
  kit: Kit
  look?: Look
  scale?: number
}) {
  const frame = useFrame()
  const spec = {
    ...look,
    jersey: kit.jersey,
    // 흰 트림은 시안의 오프화이트로 (신발 포인트 색 규칙이 이 값을 본다)
    trim: kit.number === '#ffffff' ? '#f7f3ea' : kit.number,
  }
  return (
    <img
      className="px"
      src={spriteURL(spec, DRAWN[pose], frame)}
      width={W * scale}
      height={H * scale}
      alt="선수 캐릭터"
    />
  )
}

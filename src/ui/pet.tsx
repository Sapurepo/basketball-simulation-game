import { T, tr } from '../i18n'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import type { Item } from '../data/items'
import { clamp } from '../engine/rng'
import { type IconName, iconSize, iconURL } from './sprite'

const SCALE = 3
// 바닥 영역 안에서의 이동 범위: x 는 무대 폭 %, y 는 바닥에서 px
const X_MAX = 92
const Y_MAX = 36

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

const rand = (n: number) => Math.floor(Math.random() * n)

// 무대 바닥을 몇 픽셀씩 돌아다니는 펫. 누르면 머리 위로 하트가 떠오른다
export function Pet({ it, start }: { it: Item; start: number }) {
  const [pos, setPos] = useState({
    x: start,
    y: (start * 7) % Y_MAX,
    flip: false,
  })
  const [hearts, setHearts] = useState<{ id: number; dx: number }[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    if (reducedMotion()) return
    const id = setInterval(
      () =>
        setPos((p) => {
          // 한 번에 상하좌우 중 한 방향으로 조금씩. 아트가 왼쪽을 보므로 오른쪽으로 가면 뒤집는다
          const d = rand(5) - 2
          if (rand(2))
            return {
              ...p,
              x: clamp(p.x + d, 0, X_MAX),
              flip: d ? d > 0 : p.flip,
            }
          return { ...p, y: clamp(p.y + d * 3, 0, Y_MAX) }
        }),
      1000 + rand(1200),
    )
    return () => clearInterval(id)
  }, [])

  const pat = () =>
    setHearts((h) => [
      ...h,
      ...Array.from({ length: 1 + rand(3) }, () => ({
        id: nextId.current++,
        dx: rand(17) - 8,
      })),
    ])

  const name = it.id as IconName
  const [w, h] = iconSize(name)
  return (
    <button
      className="pet"
      style={{ left: `${pos.x}%`, bottom: pos.y, zIndex: 40 - pos.y }}
      aria-label={tr('{name} 쓰다듬기', { name: T(it.name) })}
      onClick={pat}
    >
      <img
        className={pos.flip ? 'px flip' : 'px'}
        src={iconURL(name)}
        width={w * SCALE}
        height={h * SCALE}
        alt=""
      />
      {hearts.map((ht, i) => (
        <img
          key={ht.id}
          className="px heart"
          src={iconURL('heart')}
          width={18}
          height={16}
          alt=""
          style={
            {
              '--dx': `${ht.dx}px`,
              animationDelay: `${(i % 3) * 120}ms`,
            } as CSSProperties
          }
          onAnimationEnd={() =>
            setHearts((hs) => hs.filter((x) => x.id !== ht.id))
          }
        />
      ))}
    </button>
  )
}

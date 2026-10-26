import { useEffect, useState } from 'react'
import type { Look } from '../engine/types'
import { DEFAULT_LOOK, HAIRS, SKINS, type Kit, type Pose } from './pose'

// 16×22 픽셀 치비 캐릭터. 아트는 문자 격자로 그리고, 문자를 팔레트 색으로 칠한다.
// x: 0~15, y: 0(머리 꼭대기)~20(신발). 팔을 들거나 점프하면 y 가 음수가 된다.
type Px = [number, number, string]

const BODY = [
  '.....HHHHHH.....',
  '...HHHHHHHHHH...',
  '..HHHHHHHHHHHH..',
  '..HHSSSSSSSSHH..',
  '..HSSSSSSSSSSH..',
  '..SSSESSSSESSS..',
  '..SSSESSSSESSS..',
  '..SRSSSSSSSSRS..',
  '...SSSSMMSSSS...',
  '....SSSSSSSS....',
  '......SSSS......',
  '....JJJJJJJJ....',
  '...JJJJNNJJJJ...',
  '...JJJJNNJJJJ...',
  '...JJJJJJJJJJ...',
  '...JJJJJJJJJJ...',
  '...PPPPPPPPPP...',
  '...PPPP..PPPP...',
  '....SS....SS....',
  '....SS....SS....',
  '...KKK....KKK...',
]

const BALL = ['.BB.', 'BLBB', 'BBLB', '.BB.']
const TROPHY = ['GGGGGG', 'GgGGgG', '.GGGG.', '..GG..', '..GG..', '.gggg.']

const art = (rows: string[], dx = 0, dy = 0): Px[] =>
  rows.flatMap((row, y) =>
    [...row].flatMap((c, x): Px[] => (c === '.' ? [] : [[x + dx, y + dy, c]])),
  )
const mirror = (px: Px[]): Px[] => px.map(([x, y, c]) => [15 - x, y, c])
const shift = (px: Px[], dy: number): Px[] =>
  px.map(([x, y, c]) => [x, y + dy, c])

const ARM_DOWN_L: Px[] = [11, 12, 13, 14, 15].flatMap((y): Px[] => [
  [1, y, y <= 12 ? 'J' : 'S'],
  [2, y, y <= 12 ? 'J' : 'S'],
])
const ARM_DOWN_R = mirror(ARM_DOWN_L)
// 머리 위로 둥글게 올린 팔 (양손이 머리 위에서 모인다)
const ARM_UP_L: Px[] = [
  [1, 11, 'J'],
  [1, 10, 'J'],
  [0, 9, 'S'],
  [0, 8, 'S'],
  [0, 7, 'S'],
  [0, 6, 'S'],
  [0, 5, 'S'],
  [1, 4, 'S'],
  [1, 3, 'S'],
  [1, 2, 'S'],
  [2, 1, 'S'],
  [3, 0, 'S'],
  [4, -1, 'S'],
  [4, -2, 'S'],
  [5, -2, 'S'],
]
const ARM_UP_R = mirror(ARM_UP_L)
// 한 팔 번쩍 (주먹)
const FIST_R: Px[] = [
  [13, 11, 'J'],
  [14, 11, 'J'],
  [14, 10, 'J'],
  ...[9, 8, 7, 6, 5, 4, 3].map((y): Px => [15, y, 'S']),
  [14, 2, 'S'],
  [15, 2, 'S'],
]
// 거수경례: 오른손이 이마로
const SALUTE_R: Px[] = [
  [13, 11, 'J'],
  [14, 11, 'J'],
  [14, 10, 'J'],
  [14, 9, 'S'],
  [14, 8, 'S'],
  [14, 7, 'S'],
  [14, 6, 'S'],
  [13, 5, 'S'],
  [13, 4, 'S'],
  [13, 3, 'S'],
]
const WAVE_A: Px[] = [
  [13, 11, 'J'],
  [14, 11, 'J'],
  [14, 10, 'J'],
  ...[9, 8, 7, 6, 5].map((y): Px => [15, y, 'S']),
  [14, 4, 'S'],
  [15, 4, 'S'],
]
const WAVE_B: Px[] = [
  [13, 11, 'J'],
  [14, 11, 'J'],
  [14, 10, 'J'],
  ...[9, 8, 7, 6].map((y): Px => [14, y, 'S']),
  [13, 5, 'S'],
  [14, 5, 'S'],
]
const DRIBBLE_R: Px[] = [...ARM_DOWN_R, [13, 16, 'S'], [14, 16, 'S']]
// 눈 감고 입꼬리 내림
const SAD_FACE: Px[] = [
  [5, 5, 'S'],
  [10, 5, 'S'],
  [4, 6, 'D'],
  [5, 6, 'D'],
  [10, 6, 'D'],
  [11, 6, 'D'],
  [6, 8, 'D'],
  [9, 8, 'D'],
]
const BANDAGE: Px[] = [...Array(12)].map((_, i): Px => [i + 2, 2, 'W'])
const STRIPE: Px[] = [...Array(10)].map((_, i): Px => [i + 3, 14, 'N'])

const body = art(BODY)

const POSES: Record<Pose, { frames: Px[][]; ms: number }> = {
  idle: {
    ms: 280,
    frames: [
      [...body, ...ARM_DOWN_L, ...DRIBBLE_R, ...art(BALL, 12, 15)],
      [...body, ...ARM_DOWN_L, ...DRIBBLE_R, ...art(BALL, 12, 17)],
    ],
  },
  shoot: {
    ms: 220,
    frames: [
      shift([...body, ...ARM_DOWN_L, ...ARM_DOWN_R, ...art(BALL, 6, 11)], 1),
      shift([...body, ...ARM_UP_L, ...ARM_UP_R, ...art(BALL, 6, -5)], -2),
      shift([...body, ...ARM_UP_L, ...ARM_UP_R], -1),
    ],
  },
  celebrate: {
    ms: 260,
    frames: [
      [...body, ...ARM_UP_L, ...ARM_UP_R, ...art(TROPHY, 5, -7)],
      shift([...body, ...ARM_UP_L, ...ARM_UP_R, ...art(TROPHY, 5, -7)], -2),
    ],
  },
  cheer: {
    ms: 300,
    frames: [
      [...body, ...ARM_DOWN_L, ...FIST_R],
      shift([...body, ...ARM_DOWN_L, ...FIST_R], -1),
    ],
  },
  sad: {
    ms: 500,
    frames: [
      [...body, ...SAD_FACE, ...ARM_DOWN_L, ...ARM_DOWN_R, [4, 7, 'T']],
      [...body, ...SAD_FACE, ...ARM_DOWN_L, ...ARM_DOWN_R, [4, 8, 'T']],
    ],
  },
  injured: {
    ms: 500,
    frames: [
      [...body, ...SAD_FACE, ...BANDAGE, ...ARM_DOWN_L, ...ARM_DOWN_R],
      shift(
        [...body, ...SAD_FACE, ...BANDAGE, ...ARM_DOWN_L, ...ARM_DOWN_R],
        1,
      ),
    ],
  },
  salute: {
    ms: 600,
    frames: [
      [...body, ...STRIPE, ...ARM_DOWN_L, ...SALUTE_R],
      shift([...body, ...STRIPE, ...ARM_DOWN_L, ...SALUTE_R], -1),
    ],
  },
  wave: {
    ms: 320,
    frames: [
      [...body, ...ARM_DOWN_L, ...WAVE_A],
      [...body, ...ARM_DOWN_L, ...WAVE_B],
    ],
  },
}

const shade = (hex: string, k: number) =>
  '#' +
  [1, 3, 5]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

export function PixelPlayer({
  pose,
  kit,
  look = DEFAULT_LOOK,
  scale = 6,
}: {
  pose: Pose
  kit: Kit
  look?: Look
  scale?: number
}) {
  const [tick, setTick] = useState(0)
  const { frames, ms } = POSES[pose]

  useEffect(() => {
    if (reducedMotion()) return
    const id = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])

  const palette: Record<string, string> = {
    H: kit.cap ?? HAIRS[look.hair],
    S: SKINS[look.skin],
    E: '#2a2320',
    D: '#2a2320',
    R: '#f2a0a0',
    M: '#c4545b',
    J: kit.jersey,
    N: kit.number,
    P: shade(kit.jersey, 0.75),
    K: '#3a3a44',
    B: '#ef7a2a',
    L: '#8a3a10',
    G: '#f2c14e',
    g: '#c99628',
    W: '#ffffff',
    T: '#5aaef0',
  }
  const frame = frames[tick % frames.length]
  return (
    <svg
      className="pixel"
      viewBox="0 -8 16 30"
      width={16 * scale}
      height={30 * scale}
      shapeRendering="crispEdges"
      role="img"
      aria-label="선수 캐릭터"
    >
      <ellipse cx="8" cy="21.4" rx="5.5" ry="0.8" fill="#00000018" />
      {frame.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill={palette[c]} />
      ))}
    </svg>
  )
}

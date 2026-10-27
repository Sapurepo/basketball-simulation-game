import type { Look } from '../engine/types'

// 픽셀 스프라이트 엔진 v2: 90년대 스포츠 만화 비율(약 4.5등신), 팀 유니폼, 등번호.
// 파츠를 키 격자에 그림 → 셀 셰이딩(좌상단 광원) → 1px 잉크 외곽선 → PNG 데이터 URL.
// 원본: redesign/pixel-roster.js
export const W = 30
export const H = 54
const OX = 1
const OY = 6
const OUT = '#16130f'

// 시안에 없는 포즈 — trophy: 슛 포즈의 두 팔로 머리 위 우승컵을 든다 (파비콘)
// guard: 공 없이 두 팔을 내리고 선다 (훈련의 수비수·패스 받는 동료)
export type DrawnPose = 'idle' | 'shoot' | 'cheer' | 'sad' | 'trophy' | 'guard'
export const DRAWN_POSES: DrawnPose[] = [
  'idle',
  'shoot',
  'cheer',
  'sad',
  'trophy',
  'guard',
]

export interface Spec extends Look {
  jersey: string
  trim: string
  shorts?: string
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const hex = (a: number[]) =>
  '#' +
  a
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
const adj = (h: string, k: number) =>
  hex(rgb(h).map((v) => (k > 1 ? v + (255 - v) * (k - 1) : v * k)))
const mix = (a: string, b: string, t: number) =>
  hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t))

export const SKINS = [
  '#ffe0c4',
  '#f6c9a0',
  '#e3aa7a',
  '#bd7f52',
  '#8f5a37',
  '#5f3b25',
]

type Art = [rows: string[], x: number, y: number]
const HAIR: Record<Look['hairStyle'], Art> = {
  crew: [
    [
      '...HHHHHH...',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HH........HH',
      'H..........H',
    ],
    8,
    0,
  ],
  flatTop: [
    [
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'Hu........uH',
      'u..........u',
    ],
    8,
    -3,
  ],
  spiky: [
    [
      '..H...H..H..',
      '.HH..HH.HH.H',
      '.HHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHH.HH..H.HH',
      'H..........H',
    ],
    8,
    -3,
  ],
  bangs: [
    [
      '...HHHHHH...',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HH.HHH.HHHHH',
      'H..HH...HHHH',
      'H...H....HHH',
      'H.........HH',
      'H..........H',
    ],
    8,
    0,
  ],
  slick: [
    [
      '...HHHHHHH..',
      '.HHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      'H.HHHHHHHHHH',
      'H........HHH',
      'H..........H',
    ],
    8,
    -1,
  ],
  buzz: [['..uuuuuu..', '.uuuuuuuu.', 'uuuuuuuuuu', 'uu......uu'], 9, 2],
  curtains: [
    [
      '...HHHHHH...',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHHH',
      'HHHHH..HHHHH',
      'HHHH....HHHH',
      'HHH......HHH',
      'HH........HH',
      'HH........HH',
      'H..........H',
    ],
    8,
    0,
  ],
  afro: [
    [
      '...HHHHHHHH...',
      '.HHHHHHHHHHHH.',
      'HHHHHHHHHHHHHH',
      'HHHHHHHHHHHHHH',
      'HHHHHHHHHHHHHH',
      'HHHHHHHHHHHHHH',
      '.HHH......HHH.',
      '.HH........HH.',
      '..u........u..',
    ],
    7,
    -2,
  ],
  messy: [
    [
      '....H..H.H....',
      '..HHH.HHHHH.H.',
      '.HHHHHHHHHHHHH',
      'HHHHHHHHHHHHHH',
      'HHHHHHHHHHHHHH',
      'HHHHHHHHHHHHHH',
      '.HHHHHHHHHHHH.',
      '.HH.HH.HHH.HH.',
      '.H..H...H...H.',
      '.H..........H.',
      '............H.',
    ],
    7,
    -2,
  ],
}

const DIGITS: string[][] = [
  ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  ['XXX', '..X', '.XX', '..X', 'XXX'],
  ['X.X', 'X.X', 'XXX', '..X', '..X'],
  ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  ['XXX', 'X..', 'XXX', 'X.X', 'XXX'],
  ['XXX', '..X', '.X.', '.X.', '.X.'],
  ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  ['XXX', 'X.X', 'XXX', '..X', 'XXX'],
]
// 우승컵 (x 9~18): 손잡이가 아래로 손에 닿고, 받침은 머리 위에 걸친다
const TROPHY = [
  'GGGGGGGGGG',
  'G.GGGGGG.G',
  'G.GGGGGG.G',
  '..GGGGGG..',
  '...GGGG...',
  '....GG....',
  '..gggggg..',
]
const BALL = [
  '..AaA..',
  '.AAaAA.',
  'aAAaAAa',
  'aaaaaaa',
  'aAAaAAa',
  '.AAaAA.',
  '..AaA..',
]

function palette(s: Spec): Record<string, string> {
  const skin = SKINS[s.skin] ?? SKINS[0]
  const shorts = s.shorts ?? s.jersey
  return {
    S: skin,
    s: adj(skin, 0.8),
    m: adj(skin, 0.6),
    E: '#1e1a1a',
    I: '#3a2a22',
    W: '#fbf7ee',
    H: s.hair,
    u: mix(s.hair, skin, 0.45),
    J: s.jersey,
    N: s.trim,
    P: shorts,
    p: adj(shorts, 0.82),
    O: '#f4f0e6',
    B: '#f4f0e6',
    b: s.trim === '#f7f3ea' ? s.jersey : s.trim,
    o: '#d9d3c4',
    A: '#e8792e',
    a: '#5a2a12',
    X: s.accent ?? '#f4f0e6',
    Q: '#1e1a1a',
    T: '#8fd0f5',
    D: '#f1d7a8',
    K: '#1e1a1a',
    Z: '#c4545b',
    G: '#f2c14e',
    g: '#8a5a34',
    C: '#d6262f',
  }
}

const SHADE = new Set('SHuJPBAXOGC')

// 색 격자(null = 투명). 순수 함수라 테스트에서 그대로 검증한다.
export function build(
  s: Spec,
  pose: DrawnPose,
  frame: number,
): (string | null)[][] {
  const g: (string | null)[][] = [...Array(H)].map(() => Array(W).fill(null))
  const put = (x: number, y: number, k: string) => {
    x += OX
    y += OY
    if (x < 0 || y < 0 || x >= W || y >= H) return
    g[y][x] = k
  }
  const draw = (lines: string[], ox: number, oy: number, sub?: string) =>
    lines.forEach((r, j) =>
      [...r].forEach((ch, i) => {
        if (ch !== '.') put(ox + i, oy + j, sub ?? ch)
      }),
    )
  const rect = (x0: number, y0: number, x1: number, y1: number, k: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, k)
  }
  const acc = new Set(s.acc)

  let dy = 0
  let L = 0
  if (pose === 'idle') dy = frame
  if (pose === 'shoot') {
    dy = frame ? 0 : 1
    L = frame ? -3 : 0
  }
  if (pose === 'cheer') L = frame ? -1 : 0
  if (pose === 'sad' || pose === 'trophy' || pose === 'guard') dy = frame
  const U = dy + L

  for (let x = 5; x <= 22; x++) put(x, 46, '~')
  for (let x = 8; x <= 19; x++) put(x, 47, '~')

  const hair = HAIR[s.hairStyle] ?? HAIR.crew

  // 다리, 양말, 하이탑
  rect(9, 35 + L, 11, 41 + L, 'S')
  rect(16, 35 + L, 18, 41 + L, 'S')
  put(11, 38 + L, 's')
  put(18, 38 + L, 's')
  if (acc.has('tights')) {
    rect(9, 35 + L, 11, 39 + L, 'K')
    rect(16, 35 + L, 18, 39 + L, 'K')
  }
  if (acc.has('knee')) {
    rect(9, 36 + L, 11, 37 + L, 'K')
    rect(16, 36 + L, 18, 37 + L, 'K')
  }
  rect(9, 40 + L, 11, 41 + L, 'O')
  rect(16, 40 + L, 18, 41 + L, 'O')
  // 시그니처 농구화는 금색
  const sh = acc.has('goldShoes') ? 'G' : 'B'
  const shoe = (rows: string[]) => rows.map((r) => r.replaceAll('B', sh))
  draw(shoe(['.BBBB.', 'BBBBBB', 'BbbBBB', 'oooooo']), 7, 42 + L)
  draw(shoe(['.BBBB.', 'BBBBBB', 'BBBbbB', 'oooooo']), 15, 42 + L)

  // 헐렁한 반바지
  rect(7, 28 + U, 20, 34 + U, 'P')
  rect(13, 32 + U, 14, 34 + U, '_')
  rect(7, 28 + U, 20, 28 + U, 'p')
  rect(7, 29 + U, 7, 34 + U, 'N')
  rect(20, 29 + U, 20, 34 + U, 'N')

  // 민소매 + 등번호
  rect(8, 16 + U, 19, 27 + U, 'J')
  rect(8, 16 + U, 8, 19 + U, 'S')
  rect(19, 16 + U, 19, 19 + U, 'S')
  rect(9, 17 + U, 9, 19 + U, 'N')
  rect(18, 17 + U, 18, 19 + U, 'N')
  rect(12, 16 + U, 15, 16 + U, 'S')
  rect(13, 17 + U, 14, 17 + U, 'S')
  for (const [x, y] of [
    [11, 16],
    [16, 16],
    [12, 17],
    [15, 17],
    [13, 18],
    [14, 18],
  ])
    put(x, y + U, 'N')
  const n = String(s.num)
  if (n.length === 1) draw(DIGITS[+n], 12, 20 + U, 'N')
  else {
    draw(DIGITS[+n[0]], 10, 20 + U, 'N')
    draw(DIGITS[+n[1]], 15, 20 + U, 'N')
  }
  rect(8, 27 + U, 19, 27 + U, 'N')
  // 컴프레션 상의: 어깨·목선이 검게 보인다
  const shirt = acc.has('undershirt')
  if (shirt) {
    rect(8, 16 + U, 8, 19 + U, 'K')
    rect(19, 16 + U, 19, 19 + U, 'K')
    rect(12, 16 + U, 15, 16 + U, 'K')
    rect(13, 17 + U, 14, 17 + U, 'K')
  }

  // 목
  rect(12, 14 + U, 15, 15 + U, 'S')
  put(15, 14 + U, 's')
  put(15, 15 + U, 's')
  if (acc.has('chain')) {
    put(11, 17 + U, 'G')
    put(16, 17 + U, 'G')
    put(12, 18 + U, 'G')
    put(15, 18 + U, 'G')
    rect(13, 19 + U, 14, 19 + U, 'G')
  }

  // 팔 (암슬리브는 왼팔, 컴프레션 상의는 양팔)
  const sleeveL = acc.has('sleeve') || shirt
  const armsDown = (side: 'L' | 'R') => {
    if (side === 'L') {
      rect(6, 16 + U, 7, 22 + U, 'S')
      rect(5, 23 + U, 6, 27 + U, 'S')
      rect(5, 28 + U, 6, 29 + U, 'S')
      if (acc.has('wrist')) rect(5, 26 + U, 6, 27 + U, 'X')
      if (sleeveL) {
        rect(6, 18 + U, 7, 22 + U, 'K')
        rect(5, 23 + U, 6, 25 + U, 'K')
      }
    } else {
      rect(20, 16 + U, 21, 22 + U, 'S')
      rect(21, 23 + U, 22, 27 + U, 'S')
      rect(21, 28 + U, 22, 29 + U, 'S')
      if (acc.has('wrist')) rect(21, 26 + U, 22, 27 + U, 'X')
      if (shirt) {
        rect(20, 18 + U, 21, 22 + U, 'K')
        rect(21, 23 + U, 22, 25 + U, 'K')
      }
    }
  }
  const dribbleR = () => {
    rect(20, 16 + U, 21, 22 + U, 'S')
    rect(21, 23 + U, 22, 26 + U, 'S')
    rect(22, 27 + U, 23, 28 + U, 'S')
    if (acc.has('wrist')) rect(21, 25 + U, 22, 26 + U, 'X')
    if (shirt) {
      rect(20, 18 + U, 21, 22 + U, 'K')
      rect(21, 23 + U, 22, 24 + U, 'K')
    }
  }
  const upL = () => {
    rect(7, 16 + U, 8, 18 + U, 'S')
    rect(6, 8 + U, 7, 15 + U, 'S')
    rect(7, 1 + U, 8, 7 + U, 'S')
    rect(8, -2 + U, 9, 0 + U, 'S')
    if (acc.has('wrist')) rect(7, 1 + U, 8, 2 + U, 'X')
    if (sleeveL) rect(6, 8 + U, 7, 14 + U, 'K')
  }
  const upR = () => {
    rect(19, 16 + U, 20, 18 + U, 'S')
    rect(20, 8 + U, 21, 15 + U, 'S')
    rect(19, 1 + U, 20, 7 + U, 'S')
    rect(18, -2 + U, 19, 0 + U, 'S')
    if (acc.has('wrist')) rect(19, 1 + U, 20, 2 + U, 'X')
    if (shirt) rect(20, 8 + U, 21, 14 + U, 'K')
  }
  const fistR = () => {
    rect(19, 16 + U, 20, 18 + U, 'S')
    rect(20, 6 + U, 21, 15 + U, 'S')
    rect(20, 3 + U, 22, 5 + U, 'S')
    put(22, 5 + U, 's')
    if (acc.has('wrist')) rect(20, 6 + U, 21, 7 + U, 'X')
    if (shirt) rect(20, 8 + U, 21, 14 + U, 'K')
  }

  const up = pose === 'shoot' || pose === 'trophy'
  if (!up) {
    armsDown('L')
    if (pose === 'idle') dribbleR()
    else if (pose === 'sad' || pose === 'guard') armsDown('R')
  }

  // 머리
  draw(
    [
      '..SSSSSS..',
      '.SSSSSSSS.',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      'SSSSSSSSSS',
      '.SSSSSSSS.',
      '..SSSSSS..',
      '...SSSS...',
    ],
    9,
    2 + U,
  )
  rect(8, 7 + U, 8, 8 + U, 'S')
  rect(19, 7 + U, 19, 8 + U, 's')

  // 얼굴
  const face =
    pose === 'sad'
      ? 'sad'
      : pose === 'cheer' || pose === 'trophy'
        ? 'shout'
        : s.face
  const y = U
  if (face === 'calm') {
    rect(10, 6 + y, 12, 6 + y, 'H')
    rect(15, 6 + y, 17, 6 + y, 'H')
    rect(10, 8 + y, 12, 8 + y, 'E')
    put(11, 9 + y, 'I')
    rect(15, 8 + y, 17, 8 + y, 'E')
    put(16, 9 + y, 'I')
  } else if (face === 'sad') {
    put(10, 7 + y, 'H')
    put(11, 6 + y, 'H')
    put(12, 6 + y, 'H')
    put(17, 7 + y, 'H')
    put(16, 6 + y, 'H')
    put(15, 6 + y, 'H')
    rect(10, 9 + y, 12, 9 + y, 'E')
    rect(15, 9 + y, 17, 9 + y, 'E')
  } else {
    const by = face === 'grin' ? 5 : 6
    put(10, by + y, 'H')
    put(11, by + y, 'H')
    put(12, by + 1 + y, 'H')
    put(17, by + y, 'H')
    put(16, by + y, 'H')
    put(15, by + 1 + y, 'H')
    rect(10, 8 + y, 12, 8 + y, 'E')
    put(10, 9 + y, 'W')
    put(11, 9 + y, 'I')
    put(12, 9 + y, 'E')
    rect(15, 8 + y, 17, 8 + y, 'E')
    put(15, 9 + y, 'E')
    put(16, 9 + y, 'I')
    put(17, 9 + y, 'W')
  }
  put(14, 10 + y, 's')
  if (face === 'grin') {
    put(12, 11 + y, 'm')
    rect(13, 12 + y, 14, 12 + y, 'm')
    put(15, 11 + y, 'm')
  } else if (face === 'shout') {
    rect(12, 11 + y, 15, 11 + y, 'E')
    rect(13, 12 + y, 14, 12 + y, 'Z')
  } else if (face === 'sad') {
    rect(13, 12 + y, 14, 12 + y, 'm')
    put(12, 13 + y, 'm')
    put(15, 13 + y, 'm')
  } else rect(12, 12 + y, 14, 12 + y, 'm')
  if (acc.has('bandaid')) rect(16, 10 + y, 17, 10 + y, 'D')
  if (acc.has('glasses'))
    draw(['QQQQ.QQQQ', 'Q..QQQ..Q', 'QQQQ.QQQQ'], 9, 7 + y)
  if (acc.has('shades')) draw(['QQQQQQQQQ', '.QQQ.QQQ.'], 9, 8 + y)
  if (pose === 'sad' || (pose === 'shoot' && !frame)) {
    put(20, 4 + y + frame, 'T')
    put(20, 5 + y + frame, 'T')
  }

  // 앞머리 + 헤드밴드
  draw(hair[0], hair[1], hair[2] + U)
  if (acc.has('headband')) rect(8, 4 + U, 19, 4 + U, 'X')
  // 머리 위 치장: 모자·헤드폰·이어폰
  if (acc.has('cap')) {
    rect(8, -1 + U, 19, 3 + U, 'C')
    rect(6, 4 + U, 20, 4 + U, 'C')
  }
  if (acc.has('headphones')) {
    rect(10, 1 + U, 17, 1 + U, 'K')
    rect(8, 7 + U, 9, 9 + U, 'K')
    rect(18, 7 + U, 19, 9 + U, 'K')
  }
  if (acc.has('earbuds')) {
    rect(8, 8 + U, 8, 9 + U, 'W')
    rect(19, 8 + U, 19, 9 + U, 'W')
  }

  if (up) {
    upL()
    upR()
  }
  if (pose === 'cheer') fistR()

  // 공
  if (pose === 'idle') draw(BALL, 21, frame ? 37 : 29)
  if (pose === 'shoot') draw(BALL, 10, frame ? -9 + L : -6 + U)
  if (pose === 'trophy') draw(TROPHY, 9, -5 + U)

  // 셰이딩
  const empty = (x: number, y: number) =>
    x < 0 ||
    y < 0 ||
    x >= W ||
    y >= H ||
    !g[y][x] ||
    g[y][x] === '~' ||
    g[y][x] === '_'
  const pal = palette(s)
  const out: (string | null)[][] = [...Array(H)].map(() => Array(W).fill(null))
  for (let yy = 0; yy < H; yy++)
    for (let x = 0; x < W; x++) {
      const k = g[yy][x]
      if (!k || k === '_') continue
      if (k === '~') {
        out[yy][x] = 'rgba(0,0,0,.32)'
        continue
      }
      let c = pal[k] ?? k
      if (SHADE.has(k)) {
        const above = yy > 0 ? g[yy - 1][x] : null
        const below = yy + 1 < H ? g[yy + 1][x] : null
        if (empty(x + 1, yy)) c = adj(c, 0.76)
        else if (empty(x, yy - 1) && 'HuAG'.includes(k)) c = adj(c, 1.25)
        if ((k === 'H' || k === 'u') && below === 'S') c = adj(pal[k], 0.72)
        if (k === 'S' && (above === 'H' || above === 'u' || above === 'X'))
          c = pal.s
        if (k === 'J' && above === 'S' && x >= 12 && x <= 15)
          c = adj(pal.J, 0.8)
      }
      out[yy][x] = c
    }
  // 외곽선
  for (let yy = 0; yy < H; yy++)
    for (let x = 0; x < W; x++) {
      if (!empty(x, yy)) continue
      if (
        !empty(x - 1, yy) ||
        !empty(x + 1, yy) ||
        !empty(x, yy - 1) ||
        !empty(x, yy + 1)
      )
        out[yy][x] = OUT
    }
  return out
}

function paint(px: (string | null)[][], w: number, h: number) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')!
  px.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c) {
        ctx.fillStyle = c
        ctx.fillRect(x, y, 1, 1)
      }
    }),
  )
  return cv.toDataURL()
}

// 같은 외형·포즈·프레임은 한 번만 그린다
const cache = new Map<string, string>()
export function spriteURL(s: Spec, pose: DrawnPose, frame: number) {
  const key = JSON.stringify([s, pose, frame])
  let url = cache.get(key)
  if (!url) cache.set(key, (url = paint(build(s, pose, frame), W, H)))
  return url
}

// 11×11 커맨드 아이콘. 같은 셰이딩·외곽선 규칙, 화면에는 ×3 (33px)
const ICONS = {
  ball: [
    '...AaA...',
    '.AAAaAAA.',
    '.aAAaAAa.',
    'AAaAaAaAA',
    'aaaaaaaaa',
    'AAaAaAaAA',
    '.aAAaAAa.',
    '.AAAaAAA.',
    '...AaA...',
  ],
  hoop: [
    'WWWWWWWWW',
    'W.......W',
    'W..RRR..W',
    'W..R.R..W',
    'WWWWWWWWW',
    '.OOOOOOO.',
    '..N.N.N..',
    '..NNNNN..',
    '...N.N...',
  ],
  // 시안의 휴식(달) 대신 시즌 베스트용 별. 같은 팔레트·규칙으로 추가
  star: [
    '....Y....',
    '...YYY...',
    '...YYY...',
    'YYYYYYYYY',
    '.YYYYYYY.',
    '..YYYYY..',
    '..YYYYY..',
    '.YYY.YYY.',
    'YY.....YY',
  ],
  trophy: [
    'YYYYYYYYY',
    'Y.YYYYY.Y',
    'Y.YYYYY.Y',
    '.YYYYYYY.',
    '..YYYYY..',
    '...YYY...',
    '....Y....',
    '..BBBBB..',
    '..BBBBB..',
  ],
  bag: [
    '...BBB...',
    '..B...B..',
    '.YYYYYYY.',
    '.YYYYYYY.',
    '.YYBBBYY.',
    '.YYYYYYY.',
    '.YYYYYYY.',
    '.YYYYYYY.',
    '.........',
  ],
  // 상점 장식 아이템: 무대(히어로 카드)에 놓인다. 크기는 자유
  rug: [
    'RRRRRRRRRRRRRRRRRRRR',
    'RYYYYYYYYYYYYYYYYYYR',
    'RYRRRRRRRRRRRRRRRRYR',
    'RYYYYYYYYYYYYYYYYYYR',
    'RRRRRRRRRRRRRRRRRRRR',
  ],
  frame: [
    'BBBBBBBBB',
    'BTTTTTTTB',
    'BTTTYTTTB',
    'BTTTTTTTB',
    'BgggggggB',
    'BgggggggB',
    'BBBBBBBBB',
  ],
  dog: [
    '..DD......',
    '.DDDD....D',
    '.DEDDDDDDD',
    '..DDDDDDD.',
    '...DDDDD..',
    '...D...D..',
    '...D...D..',
  ],
  sofa: [
    'LL..............LL',
    'LLLLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLLLL',
    'LL.LLLLLLLLLLLL.LL',
    '.B..............B.',
  ],
  barbell: [
    'GG..........GG',
    'GG..........GG',
    'KKKKKKKKKKKKKK',
    'GG..........GG',
    'GG..........GG',
  ],
  car: [
    '.......CCCCCCCCC........',
    '......CTTTCTTTTCC.......',
    '.....CTTTTCTTTTTCC......',
    'CCCCCCCCCCCCCCCCCCCCCCC.',
    'CCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCKKCCCCCCCCCCCCCKKCCCC',
    '..KGGK..........KGGK....',
    '..KGGK..........KGGK....',
    '...KK............KK.....',
  ],
}
export type IconName = keyof typeof ICONS
const ICON_PAL: Record<string, string> = {
  A: '#e8792e',
  a: '#5a2a12',
  W: '#fbf7ee',
  R: '#d8433a',
  O: '#ef7a2b',
  N: '#fbf7ee',
  Y: '#f2c14e',
  B: '#8a5a34',
  T: '#8fd0f5',
  g: '#3f9a4a',
  D: '#a8743a',
  E: '#1e1a1a',
  L: '#4f7ad6',
  K: '#2b2a2a',
  G: '#9a9a9a',
  C: '#d6262f',
}

// 아이콘 격자 크기(외곽선 1px 여백 포함). 화면에서 width/height 로 배율을 정한다
export function iconSize(name: IconName): [w: number, h: number] {
  const art = ICONS[name]
  return [Math.max(...art.map((r) => r.length)) + 2, art.length + 2]
}

export function iconURL(name: IconName) {
  const key = `icon:${name}`
  let url = cache.get(key)
  if (url) return url
  const [w, h] = iconSize(name)
  const g: (string | null)[][] = [...Array(h)].map(() => Array(w).fill(null))
  ICONS[name].forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch !== '.') g[y + 1][x + 1] = ch
    }),
  )
  const empty = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h || !g[y][x]
  const px = g.map((row, y) =>
    row.map((k, x) => {
      if (k) {
        let c = ICON_PAL[k]
        if (k !== 'a') {
          if (empty(x + 1, y) || (empty(x, y + 1) && 'AY'.includes(k)))
            c = adj(c, 0.75)
          else if (empty(x, y - 1) || empty(x - 1, y)) c = adj(c, 1.3)
        }
        return c
      }
      return !empty(x - 1, y) ||
        !empty(x + 1, y) ||
        !empty(x, y - 1) ||
        !empty(x, y + 1)
        ? OUT
        : null
    }),
  )
  cache.set(key, (url = paint(px, w, h)))
  return url
}

// 선수 생성의 외형 로스터 24종 (모두 오리지널 캐릭터)
const R = (
  name: string,
  num: number,
  skin: number,
  hair: string,
  hairStyle: Look['hairStyle'],
  face: Look['face'],
  acc: Look['acc'],
  accent?: string,
) => ({
  name,
  look: { skin, hair, hairStyle, face, acc, num, ...(accent && { accent }) },
})
export const ROSTER: { name: string; look: Look }[] = [
  R('김도윤', 7, 1, '#2a2324', 'spiky', 'fierce', ['wrist']),
  R('강태오', 15, 2, '#2a2324', 'flatTop', 'calm', ['knee']),
  R('류시안', 11, 0, '#1e2238', 'bangs', 'calm', ['wrist']),
  R('백승호', 4, 1, '#3a2a20', 'buzz', 'fierce', ['bandaid']),
  R('하준', 14, 1, '#6b4428', 'curtains', 'grin', []),
  R('문지호', 6, 0, '#2a2324', 'slick', 'calm', ['glasses']),
  R('차민규', 10, 2, '#e0b04a', 'messy', 'fierce', ['headband']),
  R('나도현', 55, 4, '#1a1715', 'afro', 'fierce', ['knee', 'sleeve']),
  R('송이안', 3, 1, '#2a2324', 'crew', 'grin', ['headband'], '#f2c14e'),
  R('고건', 23, 3, '#2a2324', 'buzz', 'calm', ['wrist']),
  R('유한결', 8, 0, '#3a2a20', 'messy', 'fierce', ['wrist'], '#5a3fa0'),
  R('서동재', 21, 1, '#6b4428', 'curtains', 'grin', []),
  R('장우성', 33, 3, '#2a2324', 'flatTop', 'fierce', ['headband']),
  R('오세찬', 9, 2, '#a8743a', 'crew', 'calm', ['headband'], '#f4f0e6'),
  R('진하람', 13, 1, '#b9bfcc', 'slick', 'fierce', []),
  R('표재민', 32, 0, '#2a2324', 'spiky', 'grin', ['bandaid']),
  R('권오석', 50, 5, '#1a1715', 'crew', 'calm', ['knee']),
  R('이루', 1, 1, '#2a2324', 'bangs', 'fierce', ['sleeve']),
  R('남궁현', 5, 2, '#6b4428', 'crew', 'calm', ['glasses']),
  R('탁윤', 24, 4, '#1a1715', 'afro', 'grin', ['headband']),
  R('도현수', 12, 1, '#2a2324', 'flatTop', 'fierce', ['knee']),
  R('구본찬', 41, 2, '#2a2324', 'buzz', 'fierce', ['bandaid', 'wrist']),
  R('민서진', 2, 0, '#a0552e', 'messy', 'calm', []),
  R('석태양', 17, 3, '#e0b04a', 'spiky', 'fierce', ['wrist']),
]

export const DEFAULT_LOOK = ROSTER[0].look

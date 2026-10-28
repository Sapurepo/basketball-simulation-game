import type { Look } from '../engine/types'

// 픽셀 스프라이트 엔진 v2: 90년대 스포츠 만화 비율(약 4.5등신), 팀 유니폼, 등번호.
// 파츠를 키 격자에 그림 → 셀 셰이딩(좌상단 광원) → 1px 잉크 외곽선 → PNG 데이터 URL.
// 원본: redesign/pixel-roster.js
export const W = 30
export const H = 54
const OX = 1
const OY = 6
export const OUT = '#16130f'

// 시안에 없는 포즈 — trophy: 슛 포즈의 두 팔로 머리 위 우승컵을 든다 (파비콘)
// guard: 공 없이 두 팔을 내리고 선다 (훈련의 수비수·패스 받는 동료)
// bench: 어깨에 수건을 걸치고 벤치에 앉아 있다 (랜딩 첫 장면)
export type DrawnPose =
  'idle' | 'shoot' | 'cheer' | 'sad' | 'trophy' | 'guard' | 'bench'
export const DRAWN_POSES: DrawnPose[] = [
  'idle',
  'shoot',
  'cheer',
  'sad',
  'trophy',
  'guard',
  'bench',
]

export interface Spec extends Look {
  jersey: string
  trim: string
  shorts?: string
  // 스냅백 색 (기본 빨강)
  capColor?: string
  // 슛 포즈에서 손의 공을 지운다 (공을 따로 날릴 때)
  noBall?: boolean
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
export const adj = (h: string, k: number) =>
  hex(rgb(h).map((v) => (k > 1 ? v + (255 - v) * (k - 1) : v * k)))
export const mix = (a: string, b: string, t: number) =>
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
  // 시그니처 농구화: 금색 몸체에 빨간 포인트
  const gold = s.acc.includes('goldShoes')
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
    B: gold ? '#f2c14e' : '#f4f0e6',
    b: gold ? '#d8433a' : s.trim === '#f7f3ea' ? s.jersey : s.trim,
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
    // 상점 치장: 스냅백(C·c), 목걸이 펜던트(j), 선글라스(V·v), 헤드폰(Y·y), 컴프레션(M), 이어폰(L)
    C: s.capColor ?? '#d8433a',
    c: s.capColor ? adj(s.capColor, 0.7) : '#9e2a24',
    j: '#c99a25',
    V: '#1e1a1a',
    v: '#8fd0f5',
    Y: '#2b2a2a',
    y: '#d8433a',
    M: '#2a2c33',
    L: '#fbf7ee',
  }
}

const SHADE = new Set('SHuJPBAXOGCMy')

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
  // 앉으면 상체가 내려온다
  if (pose === 'bench') dy = 6 + frame
  const U = dy + L

  for (let x = 5; x <= 22; x++) put(x, 46, '~')
  for (let x = 8; x <= 19; x++) put(x, 47, '~')

  const hair = HAIR[s.hairStyle] ?? HAIR.crew

  // 다리, 양말, 하이탑
  rect(9, 35 + L, 11, 41 + L, 'S')
  rect(16, 35 + L, 18, 41 + L, 'S')
  put(11, 38 + L, 's')
  put(18, 38 + L, 's')
  if (acc.has('knee')) {
    rect(9, 36 + L, 11, 37 + L, 'K')
    rect(16, 36 + L, 18, 37 + L, 'K')
  }
  rect(9, 40 + L, 11, 41 + L, 'O')
  rect(16, 40 + L, 18, 41 + L, 'O')
  draw(['.BBBB.', 'BBBBBB', 'BbbBBB', 'oooooo'], 7, 42 + L)
  draw(['.BBBB.', 'BBBBBB', 'BBBbbB', 'oooooo'], 15, 42 + L)

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

  // 목
  rect(12, 14 + U, 15, 15 + U, 'S')
  put(15, 14 + U, 's')
  put(15, 15 + U, 's')
  // 금목걸이: 쇄골에서 가슴까지 늘어진 체인과 펜던트
  if (acc.has('chain')) {
    for (const [x, y0] of [
      [11, 16],
      [16, 16],
      [11, 17],
      [16, 17],
      [12, 18],
      [15, 18],
      [12, 19],
      [15, 19],
      [13, 20],
      [14, 20],
    ])
      put(x, y0 + U, 'G')
    rect(13, 21 + U, 14, 22 + U, 'j')
  }

  // 팔 (암슬리브는 왼팔. 컴프레션 상의는 마지막에 피부를 덮는다)
  const sleeveL = acc.has('sleeve')
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
    }
  }
  const dribbleR = () => {
    rect(20, 16 + U, 21, 22 + U, 'S')
    rect(21, 23 + U, 22, 26 + U, 'S')
    rect(22, 27 + U, 23, 28 + U, 'S')
    if (acc.has('wrist')) rect(21, 25 + U, 22, 26 + U, 'X')
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
  }
  const fistR = () => {
    rect(19, 16 + U, 20, 18 + U, 'S')
    rect(20, 6 + U, 21, 15 + U, 'S')
    rect(20, 3 + U, 22, 5 + U, 'S')
    put(22, 5 + U, 's')
    if (acc.has('wrist')) rect(20, 6 + U, 21, 7 + U, 'X')
  }

  const up = pose === 'shoot' || pose === 'trophy'
  if (!up) {
    armsDown('L')
    if (pose === 'idle') dribbleR()
    else if (pose === 'sad' || pose === 'guard' || pose === 'bench')
      armsDown('R')
  }
  if (pose === 'bench') {
    rect(8, 15 + U, 19, 16 + U, 'W')
    rect(8, 17 + U, 10, 23 + U, 'W')
    put(10, 24 + U, 'W')
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
    pose === 'sad' || pose === 'bench'
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
  if (acc.has('shades')) draw(['VVVV.VVVV', 'VvVVVVvVV', '.VV...VV.'], 9, 7 + y)
  if (pose === 'sad' || (pose === 'shoot' && !frame)) {
    put(20, 4 + y + frame, 'T')
    put(20, 5 + y + frame, 'T')
  }

  // 앞머리 + 헤드밴드
  draw(hair[0], hair[1], hair[2] + U)
  if (acc.has('headband')) rect(8, 4 + U, 19, 4 + U, 'X')
  // 머리 위 치장: 모자·헤드폰·이어폰
  if (acc.has('cap')) {
    // 모자 위로 삐져나온 머리카락은 지운다
    for (let yy = -6; yy < 0; yy++)
      for (let x = 5; x <= 22; x++) {
        const Y0 = yy + U + OY
        if (Y0 >= 0 && Y0 < H) g[Y0][x + OX] = null
      }
    draw(['..CCCCCCCC..', '.CCCCCCCCCC.', 'CCCCCGGCCCCC', 'CCCCCGGCCCCC'], 8, U)
    rect(7, 4 + U, 20, 4 + U, 'c')
  }
  if (acc.has('headphones')) {
    rect(10, -2 + U, 17, -2 + U, 'Y')
    put(9, -1 + U, 'Y')
    put(18, -1 + U, 'Y')
    rect(8, U, 8, 5 + U, 'Y')
    rect(19, U, 19, 5 + U, 'Y')
    rect(6, 6 + U, 8, 10 + U, 'y')
    rect(19, 6 + U, 21, 10 + U, 'y')
    rect(6, 6 + U, 6, 10 + U, 'Y')
    rect(21, 6 + U, 21, 10 + U, 'Y')
  } else if (acc.has('earbuds')) {
    rect(7, 8 + U, 8, 8 + U, 'L')
    rect(19, 8 + U, 20, 8 + U, 'L')
  }

  if (up) {
    upL()
    upR()
  }
  if (pose === 'cheer') fistR()

  // 공
  if (pose === 'idle') draw(BALL, 21, frame ? 37 : 29)
  if (pose === 'shoot' && !s.noBall) draw(BALL, 10, frame ? -9 + L : -6 + U)
  if (pose === 'trophy') draw(TROPHY, 9, -5 + U)

  // 컴프레션 상의(몸통·팔)와 하의(다리): 그 줄의 피부를 덮는다
  const recolor = (y0: number, y1: number) => {
    for (let yy = Math.max(0, y0 + OY); yy <= Math.min(H - 1, y1 + OY); yy++)
      for (let x = 0; x < W; x++)
        if (g[yy][x] === 'S' || g[yy][x] === 's') g[yy][x] = 'M'
  }
  if (acc.has('undershirt')) recolor(16 + U, 25 + U)
  if (acc.has('tights')) recolor(35 + L, 39 + L)

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

export function paint(px: (string | null)[][], w: number, h: number) {
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
  heart: ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
  // 펫 10종 (왼쪽을 바라본다)
  pomeranian: [
    '.o.o.......',
    'ooooo...oo.',
    'oEoooo.ooo.',
    'Eoooooooo..',
    '.ooooooooo.',
    '..oooooooo.',
    '..o.o..o.o.',
  ],
  beagle: [
    '.DD........',
    'DDDD.....D.',
    'DEDDKKKKKD.',
    'EwwKKKKKK..',
    '..wDDDDDw..',
    '..w.w..w.w.',
    '..w.w..w.w.',
  ],
  poodle: [
    '..ccc......',
    '.ccccc...cc',
    '.cEccc...cc',
    'Eccc.....c.',
    '..cccccccc.',
    '..c.c..c.c.',
    '.cc.cc.cccc',
  ],
  maltese: [
    '.ww........',
    'wwww......w',
    'wEwwwwwwwww',
    'Ewwwwwwwww.',
    '.wwwwwwwww.',
    '.wwwwwwwww.',
    '.w.w...w.w.',
  ],
  bulldog: [
    'bb..bb......',
    'bbbbbb......',
    'bEbbEb......',
    'bwEEwbbbbbb.',
    'bwwwwbbbbbbb',
    '.bbbbbbbbbbb',
    '.bb.bb..bb.b',
  ],
  siamese: [
    'k..k.......',
    'kkkk.....k.',
    'kTkTk....k.',
    'kkpkk....k.',
    '.sssssssss.',
    '.sssssssss.',
    '.k.k...k.k.',
  ],
  russianBlue: [
    'r..r.......',
    'rrrr.....r.',
    'rgrgr....r.',
    'rrprr....r.',
    '.rrrrrrrr..',
    '.rrrrrrrrr.',
    '.r.r...r.r.',
  ],
  koreanShorthair: [
    'o..o.......',
    'oooo.....o.',
    'oEoEo....D.',
    'oopoo....o.',
    '.oDoDoDoo..',
    '.ooooooooo.',
    '.o.o...o.o.',
  ],
  persian: [
    'f...f......',
    'fffff...ff.',
    'fEfEf..fff.',
    'ffpff.fff..',
    'fffffffff..',
    'fffffffffff',
    '.ff.f..f.ff',
  ],
  scottishFold: [
    '...........',
    '.GGGG....G.',
    'GEGEG....G.',
    'GGpGG....G.',
    '.GwwGGGGG..',
    '.GGGGGGGGG.',
    '.G.G...G.G.',
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
  K: '#2b2a2a',
  G: '#9a9a9a',
  o: '#e8963a',
  w: '#f6f2ea',
  c: '#d9a26b',
  b: '#c4935e',
  s: '#efe2c6',
  k: '#5a3e2e',
  r: '#7f90a6',
  f: '#efe4d4',
  p: '#e58a9a',
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

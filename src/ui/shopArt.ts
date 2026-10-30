import { adj, OUT, paint } from './sprite'

// 상점 아이템 픽셀 아트 (무대 크기). 키 격자 → 가장자리 셰이딩(빛은 왼쪽 위) → 1px 외곽선.
// 크기는 논리 픽셀이고 화면에서 width/height 로 배율을 정한다
const PAL: Record<string, string> = {
  K: '#2b2a2a',
  E: '#1e1a1a',
  W: '#fbf7ee',
  w: '#e6dfcf',
  R: '#d8433a',
  r: '#9e2a24',
  Y: '#f2c14e',
  y: '#c99a25',
  h: '#ffe08a',
  B: '#8a5a34',
  b: '#5e3b20',
  d: '#b07a48',
  T: '#8fd0f5',
  t: '#5aa8d8',
  L: '#4f7ad6',
  l: '#3457a8',
  G: '#9a9a9a',
  g: '#6b6b6b',
  s: '#cfd3d8',
  C: '#d6262f',
  c: '#8e1a20',
  N: '#23306b',
  n: '#18204a',
  O: '#f07a2b',
  o: '#c05a12',
  M: '#2a2c33',
  m: '#454852',
  P: '#f6c79f',
  V: '#2f7a4a',
  v: '#1d5a34',
  S: '#9ed8a8',
}
// 셰이딩 없이 그대로 칠하는 키
const FLAT = new Set('KEh')

type Grid = (string | null)[][]
export interface Canvas {
  w: number
  h: number
  g: Grid
  put(x: number, y: number, k: string): Canvas
  clear(x: number, y: number): Canvas
  rect(x0: number, y0: number, x1: number, y1: number, k: string): Canvas
  rows(lines: string[], ox?: number, oy?: number): Canvas
  line(x0: number, y0: number, x1: number, y1: number, k: string): Canvas
  flip(): Canvas
}

export function canvas(w: number, h: number): Canvas {
  const g: Grid = [...Array(h)].map(() => Array(w).fill(null))
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h
  const o: Canvas = {
    w,
    h,
    g,
    put(x, y, k) {
      if (inside(x, y)) g[y][x] = k
      return o
    },
    clear(x, y) {
      if (inside(x, y)) g[y][x] = null
      return o
    },
    rect(x0, y0, x1, y1, k) {
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) o.put(x, y, k)
      return o
    },
    rows(lines, ox = 0, oy = 0) {
      lines.forEach((r, j) =>
        [...r].forEach((ch, i) => {
          if (ch !== '.') o.put(ox + i, oy + j, ch)
        }),
      )
      return o
    },
    line(x0, y0, x1, y1, k) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
      for (let i = 0; i <= n; i++)
        o.put(
          Math.round(x0 + ((x1 - x0) * i) / n),
          Math.round(y0 + ((y1 - y0) * i) / n),
          k,
        )
      return o
    },
    flip() {
      g.forEach((r) => r.reverse())
      return o
    },
  }
  return o
}
export const fromRows = (lines: string[]) =>
  canvas(Math.max(...lines.map((r) => r.length)), lines.length).rows(lines)

const WHEEL = [
  '..KKKKK..',
  '.KKsssKK.',
  'KKsKKKsKK',
  'KsKKYKKsK',
  'KsKYYYKsK',
  'KsKKYKKsK',
  'KKsKKKsKK',
  '.KKsssKK.',
  '..KKKKK..',
]

const ART = {
  // 자금 표시용 지폐
  bill: () =>
    fromRows([
      'VVVVVVVVVVVVVVVVV',
      'VSSSSSSSSSSSSSSSV',
      'VSvSSSSSvvvSSSSvV',
      'VSSSSSSvWWWvSSSSV',
      'VSSSSSSvWvWvSSSSV',
      'VSSSSSSvWWWvSSSSV',
      'VSvSSSSSvvvSSSSvV',
      'VSSSSSSSSSSSSSSSV',
      'VVVVVVVVVVVVVVVVV',
    ]),
  rug: () => {
    const c = canvas(44, 8)
    c.rect(2, 0, 41, 7, 'R')
      .rect(3, 1, 40, 1, 'Y')
      .rect(3, 6, 40, 6, 'Y')
      .rect(3, 1, 3, 6, 'Y')
      .rect(40, 1, 40, 6, 'Y')
    for (const cx of [10, 22, 34])
      c.put(cx, 2, 'N')
        .put(cx - 1, 3, 'N')
        .put(cx, 3, 'Y')
        .put(cx + 1, 3, 'N')
        .put(cx - 1, 4, 'N')
        .put(cx, 4, 'Y')
        .put(cx + 1, 4, 'N')
        .put(cx, 5, 'N')
    for (const x of [16, 28]) c.put(x, 3, 'r').put(x, 4, 'r')
    c.rect(0, 1, 1, 6, 'w').rect(42, 1, 43, 6, 'w')
    for (const y of [1, 3, 5]) c.clear(0, y).clear(43, y)
    return c
  },
  frame: () => {
    const c = canvas(18, 14)
    c.rect(0, 0, 17, 13, 'Y')
      .rect(1, 1, 16, 12, 'y')
      .rect(2, 2, 15, 11, 'O')
      .rect(2, 2, 15, 3, 'P')
    c.rect(11, 4, 13, 6, 'h').put(12, 3, 'h').put(10, 5, 'h').put(14, 5, 'h')
    c.rect(5, 7, 7, 7, 'n')
      .rect(4, 8, 9, 8, 'n')
      .rect(3, 9, 15, 9, 'n')
      .rect(11, 8, 14, 8, 'n')
      .rect(12, 7, 13, 7, 'n')
    c.rect(2, 10, 15, 11, 'V')
    return c
  },
  cap: () =>
    fromRows([
      '.....RRRRRR.....',
      '...RRRRRRRRRR...',
      '..RRRRRRRRRRRR..',
      '.RRRRRRYYRRRRRR.',
      '.RRRRRYYYYRRRRR.',
      '.RRRRRRYYRRRRRR.',
      '.RRRRRRRRRRRRRR.',
      '.rrrrrrrrrrrrrr.',
      'KKKKKKKKKKKKKKKK',
      '.KKKKKKKKKKKKKK.',
    ]),
  earbuds: () =>
    fromRows([
      '..WW......WW..',
      '.WWWW....WWWW.',
      '.WTWW....WWTW.',
      '.WWWW....WWWW.',
      '..Ww......wW..',
      '..Ww......wW..',
      '..Ww......wW..',
      'WWWWWWWWWWWWWW',
      'wwwwwwwwwwwwww',
      'WWWWWWWWWWWWWW',
      'WWWWWWTTWWWWWW',
      'WWWWWWWWWWWWWW',
      '.WWWWWWWWWWWW.',
    ]),
  shades: () =>
    fromRows([
      'YYYYYYYYYYYYYYYYYY',
      'YMMMMMMYYYYMMMMMMY',
      'YMTMMMMY..YMTMMMMY',
      'YMMTMMMY..YMMTMMMY',
      'YMMMMMMY..YMMMMMMY',
      '.YMMMMY....YMMMMY.',
      '..YYYY......YYYY..',
    ]),
  undershirt: () =>
    fromRows([
      '.....MMMM..MMMM.....',
      '...MMMMMMmmMMMMMM...',
      '.MMMMMMMMMMMMMMMMMM.',
      'MMMMMMMMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMMMMMMMM',
      'MMMm.MMMMMMMMMM.mMMM',
      'MMMm.MMMOOOOMMM.mMMM',
      'MMMm.MMMMMMMMMM.mMMM',
      'MMMm.MMMMMMMMMM.mMMM',
      'MMMm.MMMMMMMMMM.mMMM',
      'MMMm.MMMMMMMMMM.mMMM',
      'OOOO.MMMMMMMMMM.OOOO',
      '.....MMMMMMMMMM.....',
      '.....OOOOOOOOOO.....',
    ]),
  tights: () =>
    fromRows([
      'OOOOOOOOOOOOOO',
      'MMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMM',
      'MMMMMMmmMMMMMM',
      'MMMMMM..MMMMMM',
      'MMMMM....MMMMM',
      '.MmMM....MMmM.',
      '.MmMM....MMmM.',
      '.MmMM....MMmM.',
      '.MmMM....MMmM.',
      '.MmMM....MMmM.',
      '.MmMM....MMmM.',
      '.MMMM....MMMM.',
      '.OOOO....OOOO.',
    ]),
  headphones: () =>
    fromRows([
      '......MMMMMMMM......',
      '....MMMMMMMMMMMM....',
      '...MMM........MMM...',
      '..MM............MM..',
      '..MM............MM..',
      '.MM..............MM.',
      '.MM..............MM.',
      '.MM..............MM.',
      'RRRR............RRRR',
      'RRRRm..........mRRRR',
      'RYRRm..........mRRYR',
      'RYRRm..........mRRYR',
      'RYRRm..........mRRYR',
      'RRRRm..........mRRRR',
      'RRRR............RRRR',
    ]),
  goldShoes: () =>
    fromRows([
      '...YYYYYY.............',
      '..YhhhhhYY............',
      '..YYYYYYYYK...........',
      '..YYYYYYYKYK..........',
      '..YYYRYYYYKYK.........',
      '..YYRRYYYYYKYK........',
      '..YRRRRYYYYYKYKY......',
      '.YYYRRRRYYYYYYYYYYY...',
      'YYYYYRRRRRYYYYYYYYYYY.',
      'YYYYYYYYYYYYYYYYYYYYYY',
      'WWWWWWWWWWWWWWWWWWWWWW',
      'wwwwwwwwwwwwwwwwwwwwww',
    ]),
  chain: () =>
    fromRows([
      'YY..............YY',
      'yY..............Yy',
      '.YY............YY.',
      '.yY............Yy.',
      '..YY..........YY..',
      '..yY..........Yy..',
      '...YY........YY...',
      '...yY........Yy...',
      '....YY......YY....',
      '....yYY....YYy....',
      '.....yYYYYYYy.....',
      '.......YYYY.......',
      '.....YYhhhhYY.....',
      '....YhYYTTYYyY....',
      '....YhYTTTTYyY....',
      '....YhYYTTYYyY....',
      '.....YYyyyyYY.....',
      '.......YYYY.......',
    ]),
  car: () => {
    const c = canvas(45, 16)
    c.rect(14, 0, 25, 0, 'C')
    c.rect(11, 1, 28, 1, 'C').rect(15, 1, 21, 1, 'T').rect(23, 1, 26, 1, 'T')
    c.rect(9, 2, 30, 2, 'C').rect(12, 2, 21, 2, 'T').rect(23, 2, 28, 2, 'T')
    c.rect(7, 3, 34, 3, 'C').rect(10, 3, 21, 3, 'T').rect(23, 3, 30, 3, 'T')
    c.put(16, 1, 'W').put(13, 2, 'W').put(11, 3, 'W')
    c.rect(3, 4, 41, 4, 'C')
      .rect(1, 5, 43, 5, 'C')
      .rect(0, 6, 44, 8, 'C')
      .rect(1, 9, 43, 9, 'c')
    c.rect(3, 5, 41, 5, 'Y')
    c.rect(22, 4, 22, 8, 'c').rect(19, 6, 20, 6, 'c')
    c.rect(0, 6, 1, 6, 'Y').rect(43, 6, 44, 6, 'R')
    c.rect(38, 2, 43, 2, 'K').rect(41, 3, 41, 3, 'K')
    // 바퀴 자리는 비우고 바퀴를 얹는다
    for (let x = 6; x <= 14; x++) for (let y = 7; y <= 9; y++) c.clear(x, y)
    for (let x = 32; x <= 40; x++) for (let y = 7; y <= 9; y++) c.clear(x, y)
    return c.rows(WHEEL, 6, 7).rows(WHEEL, 32, 7)
  },
  motorcycle: () => {
    const c = canvas(36, 20)
    c.rect(6, 0, 8, 0, 'K').put(7, 1, 'K')
    c.rect(6, 1, 7, 1, 'T').rect(5, 2, 8, 2, 'T')
    c.rect(7, 3, 11, 3, 'O')
      .rect(5, 3, 6, 3, 'T')
      .rect(4, 4, 14, 4, 'O')
      .rect(3, 5, 17, 5, 'O')
      .rect(4, 6, 34, 6, 'O')
      .rect(7, 7, 33, 7, 'O')
    c.rect(3, 4, 3, 5, 'Y')
    c.rect(24, 4, 30, 4, 'M').rect(22, 5, 31, 5, 'M').rect(32, 5, 34, 5, 'O')
    c.rect(9, 6, 16, 6, 'Y')
    c.rect(10, 8, 18, 10, 'K')
    for (let x = 11; x <= 17; x += 2) c.put(x, 9, 's')
    c.rect(19, 9, 31, 9, 's').rect(28, 8, 34, 8, 's')
    for (let y = 6; y <= 15; y++) {
      const x = 7 - Math.round(((y - 6) * 3) / 9)
      c.put(x, y, 'K').put(x + 1, y, 'K')
    }
    c.line(18, 10, 31, 15, 'K').line(18, 11, 30, 15, 'K')
    return c.rows(WHEEL, 0, 11).rows(WHEEL, 27, 11)
  },
  // ── 훈련용품 ──
  band: () =>
    fromRows([
      '..VVVVVVVVVV..',
      '.VV........VV.',
      'VV..OOOOOO..VV',
      'V..OO....OO..V',
      'VV..OOOOOO..VV',
      '.VV........VV.',
      '..VVVVVVVVVV..',
    ]),
  rope: () =>
    fromRows([
      '...LLLLLLLLLL...',
      '..L..........L..',
      '.L............L.',
      'L..............L',
      'L..............L',
      'RR............RR',
      'RR............RR',
      'RR............RR',
      'rr............rr',
    ]),
  reboundPad: () =>
    fromRows([
      '.LLLLLLLLLL.',
      'LLLLLLLLLLLL',
      'LWWWWWWWWWWL',
      'LLLLLLLLLLLL',
      'LLLLOOOOLLLL',
      'LLLOOoOOOLLL',
      'LLLOoooOOLLL',
      'LLLOOoOOOLLL',
      'LLLLOOOOLLLL',
      'LLLLLLLLLLLL',
      'LLLLLLLLLLLL',
      'LWWWWWWWWWWL',
      'LLLLLLLLLLLL',
      'llllllllllll',
      '.l........l.',
    ]),
  cones: () =>
    fromRows([
      '...O.......O.......O...',
      '..OOO.....OOO.....OOO..',
      '..WWW.....WWW.....WWW..',
      '.OOOOO...OOOOO...OOOOO.',
      '.OOOOO...OOOOO...OOOOO.',
      'OOOOOOO.OOOOOOO.OOOOOOO',
      'ooooooo.ooooooo.ooooooo',
    ]),
  sleeve: () =>
    fromRows([
      'MMMMMMM',
      'WWWWWWW',
      'MMMMMMM',
      'MMMMMMm',
      'MMMMMMm',
      '.MMMMMm',
      '.MMMMMm',
      '.MMMMMm',
      '.MMMMMm',
      '..MMMMm',
      '..MMMMm',
      '..OOOOO',
      '..MMMMm',
      '..MMMMm',
    ]),
  passWall: () => {
    const c = canvas(18, 18)
    c.rect(0, 0, 17, 13, 'O')
    for (let y = 1; y <= 12; y++)
      for (let x = 1; x <= 16; x++)
        c.put(x, y, x % 3 === 0 || y % 3 === 0 ? 'W' : 'K')
    c.line(2, 14, 0, 17, 'g').line(15, 14, 17, 17, 'g')
    return c
  },
  // ── 사치품 추가 ──
  headband: () =>
    fromRows([
      '...WWWWWWWWWW...',
      '.WWRRRRRRRRRRWW.',
      'WW............WW',
      'WW............WW',
      '.WWRRRRRRRRRRWW.',
      '...WWWWWWWWWW...',
    ]),
  kneePads: () =>
    fromRows([
      '.MMMMM...MMMMM.',
      'MMMMMMM.MMMMMMM',
      'MmmmmmM.MmmmmmM',
      'MMMMMMM.MMMMMMM',
      'MMsssMM.MMsssMM',
      'MsMMMsM.MsMMMsM',
      'MMsssMM.MMsssMM',
      'MMMMMMM.MMMMMMM',
      'MmmmmmM.MmmmmmM',
      '.MMMMM...MMMMM.',
    ]),
  glasses: () =>
    fromRows([
      'bbbbbbb....bbbbbbb',
      'bTTTTTbbbbbbTTTTTb',
      'bTWTTTb....bTWTTTb',
      'bTTTTTb....bTTTTTb',
      '.bbbbb......bbbbb.',
    ]),
  scooter: () => {
    const c = canvas(24, 18)
    c.rect(0, 0, 2, 0, 'M').rect(3, 0, 6, 0, 'K')
    for (let y = 1; y <= 12; y++) {
      const x = 3 + Math.round((y * 4) / 12)
      c.put(x, y, 'G').put(x + 1, y, 'G')
    }
    c.rect(6, 12, 22, 13, 'O')
      .rect(7, 14, 21, 14, 'o')
      .rect(21, 10, 22, 11, 'K')
    const wheel = ['.KK.', 'KssK', 'KssK', '.KK.']
    c.rows(wheel, 5, 14).rows(wheel, 19, 14)
    return c
  },
  roadBike: () => {
    const c = canvas(34, 20)
    const ring = (cx: number, cy: number) => {
      for (let k = 0; k < 72; k++) {
        const t = (k / 72) * Math.PI * 2
        c.put(
          Math.round(cx + Math.cos(t) * 6),
          Math.round(cy + Math.sin(t) * 6),
          'K',
        )
      }
      c.put(cx, cy, 's')
    }
    ring(7, 13)
    ring(26, 13)
    c.line(7, 13, 13, 6, 'R')
      .line(13, 6, 23, 6, 'R')
      .line(13, 6, 16, 13, 'R')
      .line(7, 13, 16, 13, 'R')
      .line(16, 13, 23, 6, 'R')
      .line(23, 6, 26, 13, 'R')
      .line(23, 6, 24, 2, 'G')
      .rect(24, 2, 28, 2, 'K')
      .rect(28, 3, 28, 4, 'K')
      .line(13, 6, 12, 3, 'G')
      .rect(10, 2, 14, 2, 'K')
    return c
  },
  // ── 모자 (카드용 · 선수 스프라이트는 sprite.ts) ──
  beanie: () =>
    fromRows([
      '......YY......',
      '....NNNNNN....',
      '..NNNNNNNNNN..',
      '.NNlNlNlNlNNN.',
      '.NNNNNNNNNNNN.',
      'NNlNlNlNlNlNNN',
      'OOOOOOOOOOOOOO',
      'oOoOoOoOoOoOoO',
      'OOOOOOOOOOOOOO',
    ]),
  visor: () =>
    fromRows([
      '..WWWWWWWWWWWW..',
      '..WWWWWYYWWWWW..',
      '..wwwwwwwwwwww..',
      'VVVVVVVVVVVVVVVV',
      '.vvvvvvvvvvvvvv.',
    ]),
  bucketHat: () =>
    fromRows([
      '.....dddddddd.....',
      '....dddddddddd....',
      '...dddddddddddd...',
      '...dddddddddddd...',
      '...BBBBBBBBBBBB...',
      '..dddddddddddddd..',
      '.dddddddddddddddd.',
      'dddddddddddddddddd',
      '.bbbbbbbbbbbbbbbb.',
    ]),
  truckerCap: () =>
    fromRows([
      '.....WWWWWW.....',
      '...MMWWWWWWMM...',
      '..MmMWWWWWWMmM..',
      '.MMMWWRRRRWWMMM.',
      '.MmMWWRWWRWWMmM.',
      '.MMMWWRRRRWWMMM.',
      '.MmMWWWWWWWWMmM.',
      '.NNNNNNNNNNNNNN.',
      'NNNNNNNNNNNNNNNN',
      '.nnnnnnnnnnnnnn.',
    ]),
  fedora: () =>
    fromRows([
      '......MMMM.MMMM.......',
      '.....MMMMMMMMMMMM.....',
      '.....MMMMMMMMMMMM.....',
      '....MMMMMMMMMMMMMM....',
      '....MMMMMMMMMMMMMM....',
      '....rrrrrrrrrrrrrr....',
      '...MMMMMMMMMMMMMMMM...',
      'MMMMMMMMMMMMMMMMMMMMMM',
      '.mmmmmmmmmmmmmmmmmmmm.',
    ]),
  // ── 가구 추가 ──
  plant: () =>
    fromRows([
      '.....VV.......',
      '....VVVV..VV..',
      '.VV.VvVV.VVVV.',
      'VVVV.VvV.VvVV.',
      'VvVVV.v.VVvV..',
      '.VVvVV.v.VV...',
      '..VVVVvVVV.VV.',
      '.....VvVV.VVVV',
      '..VVV.vV.VVvV.',
      '.VVvVVvVVVV...',
      '..VVVVvVV.....',
      '......v.......',
      '...OOOOOOOO...',
      '...oooooooo...',
      '....OOOOOO....',
      '....OOOOOO....',
      '....OOOOOO....',
      '.....oooo.....',
    ]),
  lamp: () => {
    const c = canvas(12, 30)
    c.rows([
      '...YYYYYY...',
      '..YhhhhhhY..',
      '..YhhhhhhY..',
      '.YhhhhhhhhY.',
      '.YhhhhhhhhY.',
      'YYYYYYYYYYYY',
    ])
    c.rect(5, 6, 6, 26, 'G').rect(3, 27, 8, 27, 'g').rect(2, 28, 9, 29, 'g')
    return c
  },
  // 빈 선반. 위 여섯 줄은 트로피 자리 (실제 트로피는 shop.tsx 가 보유 수만큼 얹는다)
  trophyShelf: () =>
    fromRows([
      '...............................',
      '...............................',
      '...............................',
      '...............................',
      '...............................',
      '...............................',
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '..bb.......................bb..',
      '...b.......................b...',
    ]),
  miniHoop: () =>
    fromRows([
      'WWWWWWWWWWWWWWWWWWWW',
      'WwwwwwwwwwwwwwwwwwwW',
      'WwWWWWWWWWWWWWWWWWwW',
      'WwWWWWWRRRRRRWWWWWwW',
      'WwWWWWWRWWWWRWWWWWwW',
      'WwWWWWWRRRRRRWWWWWwW',
      'WwwwwwwwwwwwwwwwwwwW',
      'WWWWWWWWWWWWWWWWWWWW',
      '........GGGG........',
      '....OOOOOOOOOOOO....',
      '....oWWWWWWWWWWo....',
      '.....W.W.W.W.W.W....',
      '.....WWWWWWWWWWW....',
      '......W.W.W.W.W.....',
      '......WWWWWWWWW.....',
      '.......W.W.W.W......',
    ]),
  tv: () => {
    const c = canvas(26, 17)
    c.rect(0, 0, 25, 15, 'K')
      .rect(1, 1, 24, 14, 'n')
      .rect(2, 7, 23, 13, 'd')
      .rect(2, 7, 23, 7, 'W')
      .rect(12, 7, 13, 13, 'W')
      .rect(3, 9, 4, 11, 'O')
      .rect(21, 9, 22, 11, 'O')
      .put(9, 4, 'Y')
      .put(10, 3, 'h')
      .rect(16, 3, 22, 4, 'C')
      .rect(10, 16, 15, 16, 'g')
    return c
  },
  iceBath: () => {
    const c = canvas(26, 14)
    c.rect(1, 2, 24, 2, 'w').rect(0, 3, 25, 10, 's').rect(1, 11, 24, 11, 'G')
    c.clear(0, 10).clear(25, 10)
    c.rect(2, 3, 23, 4, 'T').rect(2, 3, 23, 3, 't').rect(4, 6, 21, 6, 'G')
    for (const [x, y] of [
      [4, 1],
      [9, 0],
      [15, 1],
      [20, 0],
    ])
      c.rect(x, y, x + 2, y + 2, 'W').put(x, y, 'T')
    c.rect(3, 12, 4, 13, 'g').rect(21, 12, 22, 13, 'g')
    return c
  },
  window: () => {
    const c = canvas(26, 20)
    c.rect(1, 0, 24, 18, 'B')
      .rect(2, 1, 23, 17, 'T')
      .rect(12, 1, 13, 17, 'B')
      .rect(2, 8, 23, 9, 'B')
    for (const [x, y] of [
      [4, 2],
      [5, 2],
      [4, 3],
      [15, 2],
      [16, 2],
      [15, 3],
      [4, 11],
      [15, 11],
    ])
      c.put(x, y, 'W')
    c.rect(2, 14, 11, 17, 't').rect(14, 14, 23, 17, 't')
    return c.rect(0, 19, 25, 19, 'd')
  },
  curtain: () => {
    const c = canvas(38, 34)
    c.rect(0, 1, 37, 1, 'Y').rect(0, 0, 1, 2, 'Y').rect(36, 0, 37, 2, 'Y')
    c.rect(1, 2, 36, 4, 'R')
    for (let x = 9; x <= 28; x++) {
      if ((x - 9) % 5 === 4) c.clear(x, 4)
      else if (x % 2) c.put(x, 4, 'r')
    }
    for (let y = 5; y <= 33; y++) {
      const wl =
        y < 21
          ? 9 - Math.floor((y - 5) / 5)
          : Math.min(10, 6 + Math.floor((y - 21) / 3))
      for (let x = 0; x < wl; x++) {
        const k = x % 3 === 1 ? 'r' : 'R'
        c.put(x, y, k).put(37 - x, y, k)
      }
    }
    for (let x = 0; x <= 6; x++)
      c.put(x, 20, 'Y')
        .put(x, 21, 'y')
        .put(37 - x, 20, 'Y')
        .put(37 - x, 21, 'y')
    return c
  },
  // 추가 흔들리는 괘종시계 (프레임 0/1)
  clock: (f: number) => {
    const face = fromRows([
      '....BBBBBBB....',
      '..BBdddddddBB..',
      '.BdWWWWKWWWWdB.',
      '.BdWWWWWWWWWdB.',
      'BdWWWWWKWWWWWdB',
      'BdWWWWWKWWWWWdB',
      'BdKWWWWKKKWWKdB',
      'BdWWWWWWWWWWWdB',
      '.BdWWWWWWWWWdB.',
      '.BdWWWWKWWWWdB.',
      '..BBdddddddBB..',
      '...BBBBBBBBB...',
    ])
    const c = canvas(15, 26)
    c.g.splice(0, 12, ...face.g.map((r) => r.slice()))
    c.rect(3, 12, 11, 24, 'B').rect(4, 12, 10, 23, 'T').rect(4, 25, 10, 25, 'b')
    const rod = f
      ? [
          [7, 12],
          [7, 13],
          [7, 14],
          [6, 15],
          [6, 16],
          [6, 17],
          [5, 18],
        ]
      : [
          [7, 12],
          [7, 13],
          [7, 14],
          [8, 15],
          [8, 16],
          [8, 17],
          [9, 18],
        ]
    for (const [x, y] of rod) c.put(x, y, 'Y')
    return f
      ? c.rect(4, 19, 6, 21, 'Y').put(5, 20, 'h')
      : c.rect(8, 19, 10, 21, 'Y').put(9, 20, 'h')
  },
  sofa: () => {
    const c = canvas(40, 18)
    c.rect(4, 0, 35, 9, 'L').clear(4, 0).clear(35, 0)
    c.rect(19, 2, 20, 9, 'l')
    c.rect(0, 5, 5, 15, 'L').rect(34, 5, 39, 15, 'L').clear(0, 5).clear(39, 5)
    c.rect(5, 7, 5, 13, 'l').rect(34, 7, 34, 13, 'l')
    c.rect(6, 10, 33, 13, 'L')
      .rect(19, 10, 20, 13, 'l')
      .rect(6, 13, 33, 13, 'l')
    c.rect(1, 14, 38, 15, 'l')
    c.rect(3, 16, 4, 17, 'b').rect(35, 16, 36, 17, 'b')
    c.rect(7, 3, 13, 9, 'P').clear(7, 3).clear(13, 3).clear(7, 9).clear(13, 9)
    c.rect(26, 3, 32, 9, 'Y')
      .clear(26, 3)
      .clear(32, 3)
      .clear(26, 9)
      .clear(32, 9)
      .put(29, 6, 'h')
    return c
  },
  bed: () => {
    const c = canvas(46, 24)
    c.rect(0, 1, 5, 21, 'B').rect(1, 0, 4, 0, 'B').rect(2, 3, 3, 15, 'd')
    c.rect(40, 10, 45, 21, 'B')
      .rect(41, 9, 44, 9, 'B')
      .rect(42, 12, 43, 17, 'd')
    c.rect(6, 16, 39, 18, 'B').rect(6, 18, 39, 18, 'b')
    c.rect(6, 11, 39, 15, 'W').rect(6, 15, 39, 15, 'w')
    c.rect(6, 7, 15, 11, 'W').clear(6, 7).clear(15, 7).rect(7, 11, 14, 11, 'w')
    c.rect(16, 10, 39, 16, 'N')
      .rect(16, 10, 18, 15, 'W')
      .rect(19, 13, 39, 13, 'Y')
      .rect(18, 16, 39, 17, 'n')
    c.rect(1, 22, 3, 23, 'b').rect(42, 22, 44, 23, 'b')
    return c.flip()
  },
  barbell: () => {
    const c = canvas(30, 25)
    c.rect(5, 0, 6, 22, 'G').rect(23, 0, 24, 22, 'G')
    c.rect(1, 23, 10, 24, 'g').rect(19, 23, 28, 24, 'g')
    c.rect(7, 7, 7, 8, 'g').rect(22, 7, 22, 8, 'g')
    c.rect(0, 6, 29, 6, 's')
    c.rect(0, 1, 2, 11, 'R')
      .rect(27, 1, 29, 11, 'R')
      .rect(3, 3, 4, 9, 'L')
      .rect(25, 3, 26, 9, 'L')
    c.put(1, 6, 'Y').put(28, 6, 'Y')
    c.rect(7, 20, 22, 20, 'g')
    for (const x of [9, 16])
      c.rect(x, 17, x + 1, 19, 'M')
        .put(x + 2, 18, 's')
        .rect(x + 3, 17, x + 4, 19, 'M')
    return c
  },
}
export type ArtName = keyof typeof ART
export const hasArt = (name: string): name is ArtName => name in ART

const sizes = new Map<ArtName, [number, number]>()
// 외곽선 1px 여백을 포함한 크기
export function artSize(name: ArtName): [w: number, h: number] {
  let s = sizes.get(name)
  if (!s) {
    const c = ART[name](0)
    sizes.set(name, (s = [c.w + 2, c.h + 2]))
  }
  return s
}

const cache = new Map<string, string>()
export function artURL(name: ArtName, frame = 0) {
  const key = `${name}:${frame}`
  let url = cache.get(key)
  if (url) return url
  cache.set(key, (url = shadeURL(ART[name](frame), PAL, FLAT)))
  return url
}

// 키 격자 → 셰이딩·외곽선 PNG. 팔레트를 받아 랜딩 소품도 같은 규칙으로 그린다
export function shadeURL(
  c: Canvas,
  pal: Record<string, string>,
  flat: Set<string>,
) {
  const w = c.w + 2
  const h = c.h + 2
  const g: Grid = [...Array(h)].map((_, y) =>
    [...Array(w)].map((_, x) =>
      y > 0 && x > 0 && y <= c.h && x <= c.w ? c.g[y - 1][x - 1] : null,
    ),
  )
  const empty = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h || !g[y][x]
  const px = g.map((row, y) =>
    row.map((k, x) => {
      if (!k) {
        const edge =
          !empty(x - 1, y) ||
          !empty(x + 1, y) ||
          !empty(x, y - 1) ||
          !empty(x, y + 1)
        return edge ? OUT : null
      }
      const col = pal[k]
      if (flat.has(k)) return col
      if (empty(x + 1, y) || empty(x, y + 1)) return adj(col, 0.76)
      if (empty(x, y - 1) || empty(x - 1, y)) return adj(col, 1.22)
      return col
    }),
  )
  return paint(px, w, h)
}

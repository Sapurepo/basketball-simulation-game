import { canvas, type Canvas, fromRows, shadeURL } from './shopArt'
import { mix, paint } from './sprite'

// 랜딩 마일스톤 장면 소품. 상점 아트와 같은 규칙(키 격자 → 셰이딩 → 1px 외곽선)이고
// 장면은 110×72 논리 픽셀. 관중은 시드로 생성하고 외곽선 없이 그린다
const PAL: Record<string, string> = {
  K: '#2b2a2a',
  E: '#1e1a1a',
  W: '#fbf7ee',
  w: '#e6dfcf',
  R: '#d8433a',
  Y: '#f2c14e',
  y: '#c99a25',
  h: '#ffe08a',
  b: '#5e3b20',
  d: '#b07a48',
  T: '#8fd0f5',
  t: '#5d7a8a',
  G: '#9a9a9a',
  g: '#6b6b6b',
  N: '#23306b',
  n: '#18204a',
  O: '#f07a2b',
  o: '#c05a12',
  M: '#2a2c33',
  A: '#e8792e',
  a: '#5a2a12',
  q: '#ff5a4a',
  j: '#ffd25a',
  z: '#8fd0f5',
  u: '#ffffff',
}
// 셰이딩 없이 그대로 칠하는 키 (전광판 숫자·빛)
const FLAT = new Set('KEhqjzu')

const DIG = [
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
const num = (c: Canvas, str: string, ox: number, oy: number, k: string) =>
  [...str].forEach((d, i) =>
    c.rows(
      DIG[+d].map((r) => r.replaceAll('X', k)),
      ox + i * 4,
      oy,
    ),
  )

const hoop = (glass: boolean) => () => {
  const c = canvas(26, 46)
  c.rect(15, 14, 17, 45, 'G')
    .rect(14, 30, 18, 42, 'N')
    .rect(11, 43, 21, 45, 'n')
  c.rect(14, 8, 17, 13, 'G')
  c.rect(3, 0, 21, 13, 'W')
  if (glass)
    c.rect(4, 1, 20, 12, 'T').put(5, 2, 'u').put(6, 2, 'u').put(5, 3, 'u')
  c.rect(9, 6, 15, 12, 'R').rect(10, 7, 14, 11, glass ? 'T' : 'W')
  c.rect(1, 14, 13, 15, 'O')
  // 그물: 아래로 좁아지는 체크무늬
  for (let y = 16; y <= 22; y++) {
    const a = 2 + Math.floor((y - 16) / 2)
    const b = 12 - Math.floor((y - 16) / 2)
    for (let x = a; x <= b; x++)
      if ((x + y) % 2 === 0 || x === a || x === b) c.put(x, y, 'W')
  }
  return c
}

const ART = {
  bench: () => {
    const c = canvas(96, 9).rect(0, 0, 95, 2, 'd').rect(0, 3, 95, 3, 'b')
    for (const x of [3, 47, 90]) c.rect(x, 4, x + 1, 8, 'g')
    return c
  },
  jug: () =>
    canvas(9, 13)
      .rect(2, 0, 6, 1, 'W')
      .rect(0, 2, 8, 11, 'O')
      .rect(0, 5, 8, 5, 'W')
      .rect(1, 12, 7, 12, 'o'),
  gymWindow: () =>
    canvas(16, 9)
      .rect(0, 0, 15, 8, 'g')
      .rect(1, 1, 6, 7, 't')
      .rect(9, 1, 14, 7, 't')
      .put(2, 2, 'T')
      .put(3, 2, 'T')
      .put(10, 2, 'T'),
  scoreboard: () => {
    const c = canvas(32, 16)
      .rect(0, 0, 31, 15, 'K')
      .rect(1, 1, 30, 14, 'E')
      .rect(1, 1, 30, 3, 'y')
    num(c, '12', 5, 6, 'q')
    num(c, '18', 20, 6, 'q')
    return c.put(15, 7, 'j').put(15, 9, 'j').rect(13, 12, 17, 12, 'j')
  },
  hoopHS: hoop(false),
  hoopNBA: hoop(true),
  podium: () => {
    const c = canvas(26, 30)
    c.rect(19, 0, 21, 1, 'M').rect(20, 2, 20, 6, 'K')
    c.rect(0, 6, 25, 8, 'N').rect(3, 9, 22, 29, 'N').rect(3, 11, 22, 11, 'Y')
    c.rect(8, 15, 17, 23, 'Y').rect(9, 16, 16, 22, 'n')
    return c
      .put(12, 17, 'Y')
      .put(13, 17, 'Y')
      .rect(10, 18, 15, 19, 'Y')
      .rect(11, 20, 14, 20, 'Y')
      .put(11, 21, 'Y')
      .put(14, 21, 'Y')
  },
  jumbo: () => {
    const c = canvas(36, 19)
      .rect(6, 0, 6, 2, 'G')
      .rect(29, 0, 29, 2, 'G')
      .rect(0, 3, 35, 18, 'K')
      .rect(1, 4, 34, 17, 'E')
      .rect(1, 4, 34, 6, 'n')
    num(c, '98', 4, 9, 'j')
    num(c, '97', 24, 9, 'z')
    return c.put(17, 10, 'q').put(17, 12, 'q').rect(14, 16, 21, 16, 'q')
  },
  ball: () =>
    fromRows([
      '..AaA..',
      '.AAaAA.',
      'aAAaAAa',
      'aaaaaaa',
      'aAAaAAa',
      '.AAaAA.',
      '..AaA..',
    ]),
  flash: () =>
    fromRows([
      '....u....',
      '....u....',
      '...uuu...',
      '.uuuhuuu.',
      'uuuhhhuuu',
      '.uuuhuuu.',
      '...uuu...',
      '....u....',
      '....u....',
    ]),
  lamp: () => canvas(10, 5).rect(0, 0, 9, 2, 'G').rect(1, 3, 8, 4, 'u'),
  star: () =>
    fromRows([
      '....Y....',
      '...YYY...',
      'YYYYhYYYY',
      '.YYYYYYY.',
      '..YYYYY..',
      '.YYY.YYY.',
      'YY.....YY',
    ]),
}
export type PropName = keyof typeof ART

const cache = new Map<string, string>()
const sizes = new Map<PropName, [number, number]>()

// 외곽선 1px 여백을 포함한 크기
export function propSize(name: PropName): [w: number, h: number] {
  let s = sizes.get(name)
  if (!s) {
    const c = ART[name]()
    sizes.set(name, (s = [c.w + 2, c.h + 2]))
  }
  return s
}

export function propURL(name: PropName) {
  let url = cache.get(name)
  if (!url) cache.set(name, (url = shadeURL(ART[name](), PAL, FLAT)))
  return url
}

export interface CrowdOpts {
  seed: number
  bg: string
  // 뒷줄로 갈수록 바탕색에 섞이는 정도, 전체를 어둡게 섞는 정도
  fade?: number
  dim?: number
  // 환호하는 비율(프레임 1에 팔을 들고 들썩인다), 빈자리 비율, 휴대폰 불빛 비율
  cheer?: number
  empty?: number
  lights?: number
  gapY?: number
  skins?: string[]
  shirts?: string[]
}

const SKINS = ['#ffe0c4', '#f6c9a0', '#e3aa7a', '#bd7f52', '#8f5a37']
const SHIRTS = ['#d8433a', '#4f7ad6', '#f2c14e', '#f3eee2', '#2f7a4a']

// mulberry32: 같은 시드면 같은 관중석
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (x: number, y: number, f: number) => {
  let n = x * 374761393 + y * 668265263 + f * 2147483647
  n = (n ^ (n >>> 13)) * 1274126177
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

// 관중: 한 사람은 2×2 머리 + 3×3 상의, 줄마다 엇갈려 앉는다
export function crowdURL(
  key: string,
  w: number,
  h: number,
  o: CrowdOpts,
  frame: number,
) {
  const ck = `crowd:${key}:${frame}`
  let url = cache.get(ck)
  if (url) return url
  const r = rng(o.seed)
  const skins = o.skins ?? SKINS
  const shirts = o.shirts ?? SHIRTS
  const g: (string | null)[][] = [...Array(h)].map(() => Array(w).fill(null))
  const fill = (x0: number, y0: number, cw: number, ch: number, c: string) => {
    for (let y = y0; y < y0 + ch; y++)
      for (let x = x0; x < x0 + cw; x++)
        if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c
  }
  let row = 0
  for (let y = h - 4; y >= -3; y -= o.gapY ?? 4, row++) {
    const fade = Math.min(0.85, (o.fade ?? 0) * row + (o.dim ?? 0))
    for (let x = (row % 2) * 2 - 1; x < w; x += 4) {
      // 난수 순서를 시안과 맞춘다: 피부 → 상의 → 환호 → 머리 위치 → 빈자리
      const sk = skins[Math.floor(r() * skins.length)]
      const sh = shirts[Math.floor(r() * shirts.length)]
      const cheer = r() < (o.cheer ?? 0)
      const hx = x + (r() < 0.5 ? 0 : 1)
      if (r() < (o.empty ?? 0)) continue
      const bob = cheer && frame ? -1 : 0
      fill(x, y + 2 + bob, 3, 3, mix(sh, o.bg, fade))
      const skin = mix(sk, o.bg, fade)
      fill(hx, y + bob, 2, 2, skin)
      if (cheer && frame) {
        fill(x - 1, y, 1, 2, skin)
        fill(x + 3, y, 1, 2, skin)
      }
      if (o.lights && hash(x, y, frame) < o.lights)
        fill(x + 1, y - 1 + bob, 1, 1, '#ffffff')
    }
  }
  cache.set(ck, (url = paint(g, w, h)))
  return url
}

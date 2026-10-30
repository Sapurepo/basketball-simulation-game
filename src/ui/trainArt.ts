// 훈련 장면 아트: 측면 웨이트(벤치 프레스·스쿼트)와 측면 골대.
// 관절 → 두꺼운 픽셀 사지 → 모서리 셰이딩 → 1px 잉크 외곽선 → PNG data URL (캐시)
import { adj, OUT } from './sprite'

const BASE: Record<string, string> = {
  W: '#fbf7ee',
  w: '#d9d3c4',
  O: '#ef7a2b',
  G: '#b9bcc4',
  g: '#6b6e76',
  R: '#d8433a',
  r: '#9e2a24',
  K: '#3a3d35',
  E: '#1e1a1a',
  B: '#f4f0e6',
  b: '#c9c2b2',
}
// 셰이딩을 넣지 않는 색(눈)
const FLAT = new Set(['E'])

type Pt = [number, number]
const lerp = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]

class Grid {
  w: number
  h: number
  g: (string | null)[][]
  constructor(w: number, h: number) {
    this.w = w
    this.h = h
    this.g = Array.from({ length: h }, () => Array<string | null>(w).fill(null))
  }
  put(x: number, y: number, k: string) {
    x = Math.round(x)
    y = Math.round(y)
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = k
    return this
  }
  rect(x0: number, y0: number, x1: number, y1: number, k: string) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) this.put(x, y, k)
    return this
  }
  disk(cx: number, cy: number, r: number, k: string) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.put(x, y, k)
    return this
  }
  seg(a: Pt, b: Pt, r: number, k: string) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2) + 1
    for (let i = 0; i <= n; i++) {
      const t = i / n
      this.disk(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r, k)
    }
    return this
  }
}

function plate(c: Grid, p: Pt) {
  c.disk(p[0], p[1], 6.5, 'R')
    .disk(p[0], p[1], 4.5, 'r')
    .disk(p[0], p[1], 3.5, 'R')
    .disk(p[0], p[1], 1.5, 'G')
}
function leg(c: Grid, hip: Pt, kn: Pt, an: Pt) {
  c.seg(hip, lerp(hip, kn, 0.5), 2.5, 'P')
  c.seg(lerp(hip, kn, 0.45), kn, 1.9, 'S')
  c.seg(kn, an, 1.6, 'S')
  c.seg(lerp(kn, an, 0.72), an, 1.6, 'W')
}
function shoe(c: Grid, an: Pt) {
  c.rect(an[0] - 2, an[1], an[0] + 5, an[1] + 1, 'B')
    .rect(an[0] - 2, an[1] + 2, an[0] + 5, an[1] + 2, 'b')
    .put(an[0] + 1, an[1], 'N')
    .put(an[0] + 2, an[1], 'N')
}
function head(c: Grid, p: Pt, lying: boolean, band?: boolean) {
  c.disk(p[0], p[1], 4.4, 'H')
  if (lying) {
    c.disk(p[0] + 0.6, p[1] - 1, 3.8, 'S')
    c.put(p[0] + 1, p[1] - 3, 'E')
    c.put(p[0] + 1, p[1] - 5, 'S')
    return
  }
  c.disk(p[0] + 1, p[1] + 1, 3.8, 'S')
  c.put(p[0] + 3, p[1], 'E')
  c.put(p[0] + 5, p[1] + 1, 'S')
  c.put(p[0], p[1] + 1, 's')
  if (band) {
    const y = p[1] - 2
    for (let x = p[0] - 4; x <= p[0] + 5; x++)
      if (c.g[y] && c.g[y][x]) c.put(x, y, 'W')
  }
}

type Joints = Record<'hd' | 'sh' | 'hip' | 'kn' | 'an', Pt>
// 선 자세 · 반 · 깊은 자세 (오른쪽을 보고 바를 등에 멘다). squat(level) 0 = 깊은 자세 … 4 = 선 자세, 관절을 보간
const SQ: Joints[] = [
  { hd: [21, 8], sh: [19, 15], hip: [19, 30], kn: [20, 40], an: [19, 49] },
  { hd: [21, 15], sh: [18, 22], hip: [14, 36], kn: [24, 41], an: [19, 49] },
  { hd: [22, 22], sh: [18, 29], hip: [14, 43], kn: [25, 42], an: [19, 49] },
]
const lj = (A: Joints, B: Joints, t: number): Joints =>
  Object.fromEntries(
    (Object.keys(A) as (keyof Joints)[]).map((k) => [k, lerp(A[k], B[k], t)]),
  ) as Joints
const sqJ = (f: number) =>
  f <= 2 ? lj(SQ[2], SQ[1], f / 2) : lj(SQ[1], SQ[0], (f - 2) / 2)

function squat(f: number, band?: boolean) {
  const J = sqJ(Math.max(0, Math.min(4, f)))
  const c = new Grid(34, 54)
  const bar: Pt = [J.sh[0] - 3, J.sh[1]]
  plate(c, bar)
  leg(c, J.hip, J.kn, J.an)
  shoe(c, J.an)
  c.seg(J.hip, J.sh, 3.3, 'J').seg(J.hip, lerp(J.hip, J.sh, 0.18), 3.4, 'P')
  c.seg(J.sh, [J.hd[0] - 0.5, J.hd[1] + 3.5], 1.5, 'S')
  const elb: Pt = [J.sh[0] - 4, J.sh[1] + 5]
  const hand: Pt = [bar[0] + 1, bar[1] - 1]
  c.seg(J.sh, elb, 1.5, 'S')
    .seg(elb, hand, 1.3, 'S')
    .put(hand[0], hand[1] + 1, 'N')
  head(c, J.hd, false, band)
  return c
}
// bench(level) 0 = 바가 가슴에 … 4 = 락아웃. 누워서 머리는 왼쪽
function bench(f: number) {
  const c = new Grid(54, 40)
  c.rect(5, 28, 39, 30, 'K')
    .rect(9, 31, 10, 35, 'g')
    .rect(34, 31, 35, 35, 'g')
    .rect(6, 36, 13, 37, 'g')
    .rect(31, 36, 38, 37, 'g')
  const sh: Pt = [16, 24]
  const hip: Pt = [30, 24]
  const kn: Pt = [40, 23]
  const an: Pt = [42, 35]
  const hd: Pt = [10, 24]
  const t = Math.max(0, Math.min(4, f)) / 4
  const hand = lerp([17, 17], [16, 8], t)
  const elb = lerp([12, 28], [16, 16], t)
  plate(c, hand)
  leg(c, hip, kn, an)
  shoe(c, an)
  c.seg(sh, hip, 3.1, 'J').seg(lerp(sh, hip, 0.85), hip, 3.2, 'P')
  c.seg(sh, elb, 1.5, 'S')
    .seg(elb, hand, 1.3, 'S')
    .put(hand[0], hand[1] + 1, 'N')
  head(c, hd, true)
  return c
}
// 측면 골대: 오른쪽 기둥, 백보드, 왼쪽을 향한 림. frame 1 = 스위시로 흔들린 네트
function hoop(f: number) {
  const c = new Grid(32, 62)
  c.rect(27, 18, 29, 61, 'G')
    .rect(24, 59, 31, 61, 'g')
    .rect(20, 18, 28, 20, 'G')
  c.rect(18, 3, 20, 31, 'W')
  c.rect(7, 22, 18, 23, 'O')
  const rows = f ? 12 : 10
  const step = f ? 2 : 3
  const inset = f ? 1 : 0
  for (let y = 24; y < 24 + rows; y++) {
    const k = Math.floor((y - 24) / step)
    const a = 8 + k + inset
    const b = 17 - k - inset
    if (a > b) break
    for (let x = a; x <= b; x++)
      if ((x + y) % 2 === 0 || x === a || x === b) c.put(x, y, 'W')
  }
  return c
}

function render(c: Grid, pal: Record<string, string>) {
  const w = c.w + 2
  const h = c.h + 2
  const at = (x: number, y: number) =>
    x > 0 && y > 0 && x <= c.w && y <= c.h ? c.g[y - 1][x - 1] : null
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')!
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const k = at(x, y)
      let col: string | null = null
      if (k) {
        col = pal[k] || BASE[k] || k
        if (!FLAT.has(k)) {
          if (!at(x + 1, y) || !at(x, y + 1)) col = adj(col, 0.76)
          else if (!at(x, y - 1) || !at(x - 1, y)) col = adj(col, 1.2)
        }
      } else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))
        col = OUT
      if (col) {
        ctx.fillStyle = col
        ctx.fillRect(x, y, 1, 1)
      }
    }
  return cv.toDataURL()
}

// 선수 색: 피부·머리·유니폼·트림, 헤드밴드 여부
export interface LiftKit {
  skin: string
  hair: string
  jersey: string
  trim: string
  band?: boolean
}
const kitPal = (k: LiftKit) => ({
  S: k.skin,
  s: adj(k.skin, 0.8),
  H: k.hair,
  J: k.jersey,
  P: k.jersey,
  N: k.trim,
})

const cache = new Map<string, string>()
const get = (
  key: string,
  make: () => Grid,
  pal: Record<string, string> = {},
) => {
  let url = cache.get(key)
  if (!url) cache.set(key, (url = render(make(), pal)))
  return url
}

export const hoopURL = (swish: boolean) =>
  get(`hoop${swish ? 1 : 0}`, () => hoop(swish ? 1 : 0))
export const squatURL = (k: LiftKit, f: number) =>
  get(`sq${f}${k.jersey}${k.skin}${k.hair}`, () => squat(f, k.band), kitPal(k))
export const benchURL = (k: LiftKit, f: number) =>
  get(`bp${f}${k.jersey}${k.skin}${k.hair}`, () => bench(f), kitPal(k))

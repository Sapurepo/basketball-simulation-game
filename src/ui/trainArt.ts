// 훈련 장면 아트: 측면 웨이트(벤치 프레스·스쿼트)와 측면 골대.
// 관절 → 두꺼운 픽셀 사지 → 모서리 셰이딩 → 1px 잉크 외곽선 → PNG data URL (캐시)
// 머리는 내 선수 스프라이트(sprite.ts)의 머리를 그대로 붙여 머리 모양·얼굴·모자가 보이게 한다
import { adj, build, OUT, SKINS, type Spec, W as SPRITE_W } from './sprite'

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
// 셰이딩을 넣지 않는 색(눈). 스프라이트에서 가져온 머리 픽셀('#…')은 이미 셰이딩돼 있어 건너뛴다
const FLAT = new Set(['E'])
const flat = (k: string) => FLAT.has(k) || k.length > 1

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
// 내 선수 스프라이트의 머리(목 위 20줄): 머리 모양·얼굴·모자·안경까지. 외곽선은 render 가 다시 그리니 뺀다
const HEAD_H = 20
function avatarHead(spec: Spec): (string | null)[][] {
  const rows = build(spec, 'guard', 0)
    .slice(0, HEAD_H)
    .map((r) => r.map((c) => (c && c !== OUT ? c : null)))
  let x0 = SPRITE_W
  let x1 = -1
  rows.forEach((r) =>
    r.forEach((c, x) => {
      if (c) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
      }
    }),
  )
  return rows.map((r) => r.slice(x0, x1 + 1))
}
// 머리 붙이기. p 는 얼굴 중심(위에서 12줄). lying 이면 반시계로 눕혀 정수리가 왼쪽
function head(c: Grid, p: Pt, spec: Spec, lying: boolean) {
  const h = avatarHead(spec)
  const hw = h[0].length
  if (!lying) {
    const left = Math.round(p[0] - hw / 2)
    const top = Math.round(p[1] - 12)
    h.forEach((r, y) => r.forEach((k, x) => k && c.put(left + x, top + y, k)))
    return
  }
  const left = Math.round(p[0] - 12)
  const top = Math.round(p[1] - hw / 2)
  h.forEach((r, y) =>
    r.forEach((k, x) => k && c.put(left + y, top + (hw - 1 - x), k)),
  )
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

// 선 자세에서 머리 위 여유 6줄
const SQ_DY = 6
function squat(f: number, spec: Spec) {
  const J0 = sqJ(Math.max(0, Math.min(4, f)))
  const J = Object.fromEntries(
    (Object.keys(J0) as (keyof Joints)[]).map((k) => [
      k,
      [J0[k][0], J0[k][1] + SQ_DY] as Pt,
    ]),
  ) as Joints
  const c = new Grid(34, 54 + SQ_DY)
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
  head(c, [J.hd[0] + 1, J.hd[1] + 1], spec, false)
  return c
}
// bench(level) 0 = 바가 가슴에 … 4 = 락아웃. 누워서 머리는 왼쪽 (머리가 커져 몸을 4칸 오른쪽으로)
const BX = 4
function bench(f: number, spec: Spec) {
  const c = new Grid(54, 40)
  c.rect(5 + BX, 28, 39 + BX, 30, 'K')
    .rect(9 + BX, 31, 10 + BX, 35, 'g')
    .rect(34 + BX, 31, 35 + BX, 35, 'g')
    .rect(6 + BX, 36, 13 + BX, 37, 'g')
    .rect(31 + BX, 36, 38 + BX, 37, 'g')
  const sh: Pt = [16 + BX, 24]
  const hip: Pt = [30 + BX, 24]
  const kn: Pt = [40 + BX, 23]
  const an: Pt = [42 + BX, 35]
  const hd: Pt = [9 + BX, 22]
  const t = Math.max(0, Math.min(4, f)) / 4
  const hand = lerp([17 + BX, 17], [16 + BX, 8], t)
  const elb = lerp([12 + BX, 28], [16 + BX, 16], t)
  plate(c, hand)
  leg(c, hip, kn, an)
  shoe(c, an)
  c.seg(sh, hip, 3.1, 'J').seg(lerp(sh, hip, 0.85), hip, 3.2, 'P')
  c.seg(sh, elb, 1.5, 'S')
    .seg(elb, hand, 1.3, 'S')
    .put(hand[0], hand[1] + 1, 'N')
  head(c, hd, spec, true)
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
        if (!flat(k)) {
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

// 선수 외형(머리용) + 유니폼·트림(몸용)
export type LiftKit = Spec
const kitPal = (k: LiftKit) => {
  const skin = SKINS[k.skin] ?? SKINS[0]
  return {
    S: skin,
    s: adj(skin, 0.8),
    H: k.hair,
    J: k.jersey,
    P: k.jersey,
    N: k.trim,
  }
}

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
  get(`sq${f}${JSON.stringify(k)}`, () => squat(f, k), kitPal(k))
export const benchURL = (k: LiftKit, f: number) =>
  get(`bp${f}${JSON.stringify(k)}`, () => bench(f, k), kitPal(k))

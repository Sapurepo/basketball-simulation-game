import { type Canvas, canvas, fromRows, shadeURL } from './shopArt'

// 명예의 전당 장식: 상점 아트와 같은 규칙(키 격자 → 셰이딩 → 1px 외곽선)
const PAL: Record<string, string> = {
  Y: '#f2c14e',
  y: '#c99a25',
  h: '#ffe08a',
  R: '#d8433a',
  L: '#4f7ad6',
  M: '#2a2c33',
  u: '#ffffff',
}
const FLAT = new Set('hu')
const MEDAL = { g: '#f2c14e', s: '#c9ccd6', b: '#c07a3a' }
export type Medal = keyof typeof MEDAL

// 월계관: 호를 따라 잎을 바깥·안쪽에 번갈아 붙인다. 'R' 은 좌우 반전
function laurel(side: string) {
  const c = canvas(12, 22)
  const N = 20
  const pt = (i: number) => {
    const a = Math.PI * (0.6 + (i / N) * 0.82)
    const ox = Math.cos(a)
    const oy = -Math.sin(a)
    return [11 + ox * 9.5, 11 + oy * 10.5, ox, oy]
  }
  for (let i = 0; i <= N; i++) {
    const [x, y] = pt(i)
    c.put(Math.round(x), Math.round(y), 'y')
  }
  for (let i = 1; i < N; i += 2) {
    const [x, y, ox, oy] = pt(i)
    const lx = Math.round(x + ox * 1.7)
    const ly = Math.round(y + oy * 1.7)
    c.put(lx, ly, 'Y')
      .put(lx + Math.round(ox), ly, 'h')
      .put(lx, ly - 1, 'Y')
      .put(lx + Math.round(ox), ly - 1, 'Y')
    const ix = Math.round(x - ox * 1.4)
    const iy = Math.round(y - oy * 1.4) - 1
    c.put(ix, iy, 'Y').put(ix, iy - 1, 'y')
  }
  return side === 'R' ? c.flip() : c
}

// 액자 모서리: 'R' 좌우, 'B' 상하 반전
function corner(f: string) {
  const c = fromRows([
    'YYYYYYYYY',
    'YhhhhhhYy',
    'YhYYYYy..',
    'YhY......',
    'YhY.YY...',
    'YhY.Yh...',
    'YhY......',
    'YYy......',
    'Yy.......',
  ])
  if (f.includes('R')) c.flip()
  if (f.includes('B')) c.g.reverse()
  return c
}

const ART: Record<string, (v: string) => Canvas> = {
  crown: () =>
    fromRows([
      'Y...Y...Y',
      'YY.YhY.YY',
      'YhYYYYYhY',
      'YYYYYYYYY',
      'YRYYLYYRY',
      'YYYYYYYYY',
      'yyyyyyyyy',
    ]),
  laurel,
  corner,
  pedestal: () =>
    canvas(30, 10)
      .rect(0, 0, 29, 1, 'Y')
      .rect(1, 2, 28, 2, 'y')
      .rect(2, 3, 27, 8, 'M')
      .rect(2, 5, 27, 5, 'y')
      .rect(0, 9, 29, 9, 'y'),
  medal: () =>
    fromRows([
      'RR...LL',
      '.RR.LL.',
      '..RLL..',
      '..DDD..',
      '.DDDDD.',
      'DDDuDDD',
      'DDuDDDD',
      'DDDDDDD',
      '.DDDDD.',
      '..DDD..',
    ]),
}

const cache = new Map<string, string>()
export function hallArtURL(
  name: 'crown' | 'laurel' | 'corner' | 'pedestal' | 'medal',
  variant = '',
) {
  const key = `${name}:${variant}`
  let url = cache.get(key)
  if (!url) {
    const pal = { ...PAL, D: MEDAL[variant as Medal] ?? PAL.Y }
    cache.set(key, (url = shadeURL(ART[name](variant), pal, FLAT)))
  }
  return url
}

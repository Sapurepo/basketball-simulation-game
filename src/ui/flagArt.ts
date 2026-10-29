import { type Canvas, canvas, fromRows, shadeURL } from './shopArt'

// 아시안게임 국가대표 로고: 국기를 18×12 픽셀로 단순화해 상점 아트와 같은 규칙(셰이딩·외곽선)으로 그린다.
// 협회 엠블럼은 상표라 쓰지 않는다. 대만은 대회 표기(차이니즈 타이베이)를 따라 국기 대신 매화만 그린다
const PAL: Record<string, string> = {
  W: '#fbf7ee',
  R: '#d8433a',
  r: '#8a1c3a',
  B: '#2a4fa8',
  K: '#1e1a1a',
  Y: '#f2c14e',
  G: '#2f7a4a',
  S: '#4fb0d8',
  P: '#e58a9a',
}
const FLAT = new Set<string>()

const W = 18
const H = 12
const fill = (k: string) => canvas(W, H).rect(0, 0, W - 1, H - 1, k)
// 가로 줄무늬: 위에서부터 [색, 줄 수]
const stripes = (...bands: [string, number][]) => {
  const c = canvas(W, H)
  let y = 0
  for (const [k, n] of bands) {
    c.rect(0, y, W - 1, y + n - 1, k)
    y += n
  }
  return c
}
// 깃대 쪽 삼각형: 가운데 (tip, 5.5) 로 뾰족해진다
const hoist = (c: Canvas, tip: number, k: string) => {
  for (let y = 0; y < H; y++) {
    const w = Math.round(tip * (1 - Math.abs(y - 5.5) / 6))
    if (w > 0) c.rect(0, y, w - 1, y, k)
  }
  return c
}

const FLAGS: Record<string, () => Canvas> = {
  대한민국: () =>
    fromRows([
      'WWWWWWWWWWWWWWWWWW',
      'WKKKWWWWWWWWWWKKKW',
      'WWWWWWWRRRRWWWWWWW',
      'WKKKWWRRRRRRWWKKKW',
      'WWWWWRRRRRRRRWWWWW',
      'WWWWWRRRRRRBBWWWWW',
      'WWWWWRRBBBBBBWWWWW',
      'WWWWWBBBBBBBBWWWWW',
      'WKKKWWBBBBBBWWKKKW',
      'WWWWWWWBBBBWWWWWWW',
      'WKKKWWWWWWWWWWKKKW',
      'WWWWWWWWWWWWWWWWWW',
    ]),
  중국: () =>
    fill('R').rows(
      ['...Y...Y', '..YYY....Y', '.YYYYY', '..YYY....Y', '..Y.Y..Y'],
      0,
      1,
    ),
  일본: () =>
    fill('W').rows(
      [
        '..RRRR..',
        '.RRRRRR.',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        'RRRRRRRR',
        '.RRRRRR.',
        '..RRRR..',
      ],
      5,
      2,
    ),
  이란: () =>
    stripes(['G', 4], ['W', 4], ['R', 4]).rows(
      ['.RR.', 'RRRR', 'RRRR', '.RR.'],
      7,
      4,
    ),
  필리핀: () => {
    const c = hoist(stripes(['B', 6], ['R', 6]), 9, 'W')
    return c.rect(2, 5, 4, 6, 'Y').put(0, 1, 'Y').put(0, 10, 'Y').put(7, 5, 'Y')
  },
  레바논: () =>
    stripes(['R', 3], ['W', 6], ['R', 3]).rows(
      ['..GG..', '.GGGG.', 'GGGGGG', '.GGGG.', 'GGGGGG', '..GG..'],
      6,
      3,
    ),
  요르단: () =>
    hoist(stripes(['K', 4], ['W', 4], ['G', 4]), 8, 'R').rect(2, 5, 3, 6, 'W'),
  // 차이니즈 타이베이: 흰 바탕에 매화 다섯 잎
  대만: () =>
    fill('W')
      .rect(8, 2, 9, 3, 'P')
      .rect(5, 4, 6, 5, 'P')
      .rect(11, 4, 12, 5, 'P')
      .rect(6, 7, 7, 8, 'P')
      .rect(10, 7, 11, 8, 'P')
      .rect(8, 5, 9, 6, 'Y'),
  카타르: () => {
    const c = fill('r').rect(0, 0, 4, H - 1, 'W')
    for (let y = 0; y < H; y++) {
      c.put(5, y, 'W')
      if (y % 2 === 0) c.put(6, y, 'W')
    }
    return c
  },
  카자흐스탄: () => {
    const c = fill('S')
      .rows(['.YY.', 'YYYY', 'YYYY', '.YY.'], 7, 1)
      .put(6, 1, 'Y')
      .put(11, 1, 'Y')
      .put(6, 4, 'Y')
      .put(11, 4, 'Y')
      .rect(5, 7, 12, 7, 'Y')
      .rect(8, 8, 9, 8, 'Y')
    for (let y = 1; y < H - 1; y += 2) c.put(1, y, 'Y')
    return c
  },
  인도네시아: () => stripes(['R', 6], ['W', 6]),
  몽골: () =>
    fill('B')
      .rect(0, 0, 5, H - 1, 'R')
      .rect(12, 0, W - 1, H - 1, 'R')
      .rect(2, 1, 3, 2, 'Y')
      .rect(2, 4, 3, 4, 'Y')
      .rect(1, 6, 4, 6, 'Y')
      .rect(1, 7, 1, 9, 'Y')
      .rect(4, 7, 4, 9, 'Y')
      .rect(2, 8, 3, 8, 'Y')
      .rect(1, 10, 4, 10, 'Y'),
  바레인: () => {
    const c = fill('R').rect(0, 0, 3, H - 1, 'W')
    for (let y = 0; y < H; y++) {
      c.put(4, y, 'W')
      if (y % 3 === 1) c.rect(5, y, 6, y, 'W')
    }
    return c
  },
}

const cache = new Map<string, string>()
// 국가 이름(한국어 원문)으로 국기 그림. 국가대표가 아니면 undefined
export function flagURL(name: string) {
  const draw = FLAGS[name]
  if (!draw) return undefined
  let url = cache.get(name)
  if (!url) cache.set(name, (url = shadeURL(draw(), PAL, FLAT)))
  return url
}

import { ATTR_KEYS } from '../engine/player'
import type { Accessory, Attributes } from '../engine/types'

// 상점 아이템. 착용 사치품(acc)은 보유하는 동안 시즌 능력치 버프와 스프라이트 장식,
// 나머지는 무대를 꾸미고 시즌 성장 보너스를 준다. 가격은 만원.
// 벽지·바닥타일(slot)은 보유한 것 중 하나만 무대에 적용한다 (bg 는 CSS background)
export interface Item {
  id: string
  name: string
  kind: 'luxury' | 'decor' | 'furniture' | 'pet'
  price: number
  buff?: Partial<Attributes>
  growth?: number
  acc?: Accessory
  slot?: 'wall' | 'floor'
  bg?: string
}

const pet = (id: string, name: string, price: number): Item => ({
  id,
  name,
  kind: 'pet',
  price,
  growth: 0.1,
})

export const ITEMS: Item[] = [
  {
    id: 'cap',
    name: '스냅백',
    kind: 'luxury',
    price: 10000,
    buff: { defense: 1 },
    acc: 'cap',
  },
  {
    id: 'earbuds',
    name: '무선 이어폰',
    kind: 'luxury',
    price: 32000,
    buff: { playmaking: 1 },
    acc: 'earbuds',
  },
  {
    id: 'shades',
    name: '선글라스',
    kind: 'luxury',
    price: 43000,
    buff: { shooting: 1 },
    acc: 'shades',
  },
  {
    id: 'undershirt',
    name: '컴프레션 상의',
    kind: 'luxury',
    price: 68000,
    buff: { athleticism: 1 },
    acc: 'undershirt',
  },
  {
    id: 'tights',
    name: '컴프레션 하의',
    kind: 'luxury',
    price: 68000,
    buff: { speed: 1 },
    acc: 'tights',
  },
  {
    id: 'headphones',
    name: '헤드폰',
    kind: 'luxury',
    price: 210000,
    buff: { shooting: 1, playmaking: 1 },
    acc: 'headphones',
  },
  {
    id: 'goldShoes',
    name: '시그니처 농구화',
    kind: 'luxury',
    price: 3800000,
    buff: { speed: 2, athleticism: 1 },
    acc: 'goldShoes',
  },
  {
    id: 'chain',
    name: '금목걸이',
    kind: 'luxury',
    price: 66000000,
    buff: { finishing: 2, rebounding: 1 },
    acc: 'chain',
  },
  { id: 'car', name: '슈퍼카', kind: 'luxury', price: 150000000, growth: 0.3 },
  {
    id: 'motorcycle',
    name: '오토바이',
    kind: 'luxury',
    price: 8100000,
    growth: 0.2,
  },
  { id: 'rug', name: '러그', kind: 'decor', price: 14000, growth: 0.1 },
  { id: 'frame', name: '액자', kind: 'decor', price: 43000, growth: 0.1 },
  {
    id: 'wallStripe',
    name: '스트라이프 벽지',
    kind: 'decor',
    price: 23000,
    growth: 0.1,
    slot: 'wall',
    bg: 'repeating-linear-gradient(90deg, #e8e2d4 0 16px, #dcd3c0 16px 32px)',
  },
  {
    id: 'wallBrick',
    name: '벽돌 벽지',
    kind: 'decor',
    price: 55000,
    growth: 0.1,
    slot: 'wall',
    bg: 'repeating-linear-gradient(0deg, #8e4a34 0 3px, transparent 3px 21px), repeating-linear-gradient(90deg, #8e4a34 0 3px, #b5654a 3px 42px)',
  },
  {
    id: 'wallNavy',
    name: '네이비 체크 벽지',
    kind: 'decor',
    price: 97000,
    growth: 0.1,
    slot: 'wall',
    bg: 'repeating-conic-gradient(#2f3d6b 0 25%, #3a4a82 0 50%) 0 0 / 28px 28px',
  },
  {
    id: 'floorCheck',
    name: '체커 바닥타일',
    kind: 'decor',
    price: 43000,
    growth: 0.1,
    slot: 'floor',
    bg: 'repeating-conic-gradient(#f4efe6 0 25%, #2b2a2a 0 50%) 0 0 / 24px 24px',
  },
  {
    id: 'floorMint',
    name: '민트 바닥타일',
    kind: 'decor',
    price: 82000,
    growth: 0.1,
    slot: 'floor',
    bg: 'repeating-conic-gradient(#9ed8c6 0 25%, #82c4b0 0 50%) 0 0 / 24px 24px',
  },
  {
    id: 'floorMarble',
    name: '대리석 바닥타일',
    kind: 'decor',
    price: 210000,
    growth: 0.1,
    slot: 'floor',
    bg: 'repeating-linear-gradient(90deg, #c9c3b8 0 3px, #eeeae3 3px 48px)',
  },
  {
    id: 'clock',
    name: '벽시계',
    kind: 'furniture',
    price: 300000,
    growth: 0.1,
  },
  {
    id: 'curtain',
    name: '커튼',
    kind: 'furniture',
    price: 450000,
    growth: 0.1,
  },
  { id: 'sofa', name: '소파', kind: 'furniture', price: 560000, growth: 0.2 },
  { id: 'bed', name: '침대', kind: 'furniture', price: 800000, growth: 0.2 },
  {
    id: 'barbell',
    name: '홈짐 바벨 세트',
    kind: 'furniture',
    price: 35000000,
    growth: 0.5,
  },
  pet('pomeranian', '포메라니안', 130000),
  pet('beagle', '비글', 170000),
  pet('poodle', '푸들', 210000),
  pet('maltese', '말티즈', 210000),
  pet('bulldog', '불독', 290000),
  pet('siamese', '샴고양이', 170000),
  pet('russianBlue', '러시안블루', 250000),
  pet('koreanShorthair', '코리안숏헤어', 97000),
  pet('persian', '페르시안', 290000),
  pet('scottishFold', '스코티시폴드', 390000),
]

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)

// 보유 아이템의 합산 효과
export function itemEffects(ids: string[] = []) {
  const attrs: Partial<Attributes> = {}
  let growth = 0
  for (const id of ids) {
    const it = itemById(id)
    if (!it) continue
    growth += it.growth ?? 0
    for (const k of ATTR_KEYS)
      if (it.buff?.[k]) attrs[k] = (attrs[k] ?? 0) + it.buff[k]
  }
  return { attrs, growth }
}

export const buffed = (base: Attributes, buff: Partial<Attributes>) =>
  Object.fromEntries(
    ATTR_KEYS.map((k) => [k, Math.min(99, base[k] + (buff[k] ?? 0))]),
  ) as Attributes

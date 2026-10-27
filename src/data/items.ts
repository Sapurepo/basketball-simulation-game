import { ATTR_KEYS } from '../engine/player'
import type { Accessory, Attributes } from '../engine/types'

// 상점 아이템. 치장(wear)은 보유하는 동안 시즌 능력치 버프와 스프라이트 장식,
// 장식(decor)은 무대를 꾸미고 시즌 성장 보너스를 준다. 가격은 만원.
export interface Item {
  id: string
  name: string
  kind: 'wear' | 'decor'
  price: number
  buff?: Partial<Attributes>
  growth?: number
  acc?: Accessory
}

export const ITEMS: Item[] = [
  {
    id: 'cap',
    name: '스냅백',
    kind: 'wear',
    price: 120,
    buff: { defense: 1 },
    acc: 'cap',
  },
  {
    id: 'earbuds',
    name: '무선 이어폰',
    kind: 'wear',
    price: 250,
    buff: { playmaking: 1 },
    acc: 'earbuds',
  },
  {
    id: 'shades',
    name: '선글라스',
    kind: 'wear',
    price: 300,
    buff: { shooting: 1 },
    acc: 'shades',
  },
  {
    id: 'undershirt',
    name: '컴프레션 상의',
    kind: 'wear',
    price: 400,
    buff: { athleticism: 1 },
    acc: 'undershirt',
  },
  {
    id: 'tights',
    name: '컴프레션 하의',
    kind: 'wear',
    price: 400,
    buff: { speed: 1 },
    acc: 'tights',
  },
  {
    id: 'headphones',
    name: '헤드폰',
    kind: 'wear',
    price: 800,
    buff: { shooting: 1, playmaking: 1 },
    acc: 'headphones',
  },
  {
    id: 'goldShoes',
    name: '시그니처 농구화',
    kind: 'wear',
    price: 5000,
    buff: { speed: 2, athleticism: 1 },
    acc: 'goldShoes',
  },
  {
    id: 'chain',
    name: '금목걸이',
    kind: 'wear',
    price: 30000,
    buff: { finishing: 2, rebounding: 1 },
    acc: 'chain',
  },
  { id: 'rug', name: '러그', kind: 'decor', price: 150, growth: 0.1 },
  { id: 'frame', name: '액자', kind: 'decor', price: 300, growth: 0.1 },
  { id: 'dog', name: '강아지', kind: 'decor', price: 600, growth: 0.3 },
  { id: 'sofa', name: '소파', kind: 'decor', price: 1500, growth: 0.2 },
  {
    id: 'barbell',
    name: '홈짐 바벨 세트',
    kind: 'decor',
    price: 20000,
    growth: 0.5,
  },
  { id: 'car', name: '슈퍼카', kind: 'decor', price: 50000, growth: 0.3 },
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

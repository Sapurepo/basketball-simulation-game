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
  // 상점 상세의 소개 한 줄
  line: string
  // 무대 기본 자리 [x, y]: 110×80 논리 격자(바닥선 y=60)에서 아트 왼쪽 위
  pos?: [x: number, y: number]
}

const pet = (id: string, name: string, price: number, line: string): Item => ({
  id,
  name,
  kind: 'pet',
  price,
  growth: 0.1,
  line,
})

export const ITEMS: Item[] = [
  {
    id: 'cap',
    name: '스냅백',

    line: '챙을 꾹 눌러쓰면 수비 집중력이 올라간다.',
    kind: 'luxury',
    price: 8500,
    buff: { defense: 1 },
    acc: 'cap',
  },
  {
    id: 'earbuds',
    name: '무선 이어폰',

    line: '노이즈 캔슬링 ON. 코트 위 시야가 넓어진다.',
    kind: 'luxury',
    price: 27000,
    buff: { playmaking: 1 },
    acc: 'earbuds',
  },
  {
    id: 'shades',
    name: '선글라스',

    line: '골드 프레임 에비에이터. 림이 더 선명하게 보인다.',
    kind: 'luxury',
    price: 37000,
    buff: { shooting: 1 },
    acc: 'shades',
  },
  {
    id: 'undershirt',
    name: '컴프레션 상의',

    line: '근육을 꽉 잡아주는 두 번째 피부.',
    kind: 'luxury',
    price: 58000,
    buff: { athleticism: 1 },
    acc: 'undershirt',
  },
  {
    id: 'tights',
    name: '컴프레션 하의',

    line: '첫 스텝이 반 박자 빨라진다.',
    kind: 'luxury',
    price: 58000,
    buff: { speed: 1 },
    acc: 'tights',
  },
  {
    id: 'headphones',
    name: '헤드폰',

    line: '입장할 때 쓰는 그것. 집중력 두 배.',
    kind: 'luxury',
    price: 180000,
    buff: { shooting: 1, playmaking: 1 },
    acc: 'headphones',
  },
  {
    id: 'goldShoes',
    name: '시그니처 농구화',

    line: '내 이름이 새겨진 골드 에디션 하이탑.',
    kind: 'luxury',
    price: 3200000,
    buff: { speed: 2, athleticism: 1 },
    acc: 'goldShoes',
  },
  {
    id: 'chain',
    name: '금목걸이',

    line: 'MVP의 상징. 덩크할 때마다 번쩍인다.',
    kind: 'luxury',
    price: 56000000,
    buff: { finishing: 2, rebounding: 1 },
    acc: 'chain',
  },
  {
    id: 'car',
    name: '슈퍼카',
    kind: 'luxury',
    price: 130000000,
    growth: 0.3,
    line: '주차장에서부터 이미 슈퍼스타.',
    pos: [64, 62],
  },
  {
    id: 'motorcycle',
    name: '오토바이',

    line: '훈련장까지 바람처럼. 무대 앞에 세워 둔다.',
    pos: [-4, 59],
    kind: 'luxury',
    price: 6900000,
    growth: 0.2,
  },
  {
    id: 'rug',
    name: '러그',
    kind: 'decor',
    price: 12000,
    growth: 0.1,
    line: '발밑이 폭신해지면 마음도 느긋해진다.',
    pos: [33, 66],
  },
  {
    id: 'frame',
    name: '액자',
    kind: 'decor',
    price: 37000,
    growth: 0.1,
    line: '노을 진 산 그림. 매일 보면 꿈이 커진다.',
    pos: [46, 4],
  },
  {
    id: 'wallStripe',
    name: '스트라이프 벽지',

    line: '크림 스트라이프로 방이 한층 밝아진다.',
    kind: 'decor',
    price: 20000,
    growth: 0.1,
    slot: 'wall',
    bg: 'repeating-linear-gradient(90deg, #e8e2d4 0 16px, #dcd3c0 16px 32px)',
  },
  {
    id: 'wallBrick',
    name: '벽돌 벽지',

    line: '뉴욕 로프트 같은 붉은 벽돌.',
    kind: 'decor',
    price: 47000,
    growth: 0.1,
    slot: 'wall',
    bg: 'repeating-linear-gradient(0deg, #8e4a34 0 3px, transparent 3px 21px), repeating-linear-gradient(90deg, #8e4a34 0 3px, #b5654a 3px 42px)',
  },
  {
    id: 'wallNavy',
    name: '네이비 체크 벽지',

    line: '팀 컬러 같은 깊은 네이비 체크.',
    kind: 'decor',
    price: 82000,
    growth: 0.1,
    slot: 'wall',
    bg: 'repeating-conic-gradient(#2f3d6b 0 25%, #3a4a82 0 50%) 0 0 / 28px 28px',
  },
  {
    id: 'floorCheck',
    name: '체커 바닥타일',

    line: '레트로 다이너 감성의 흑백 체커.',
    kind: 'decor',
    price: 37000,
    growth: 0.1,
    slot: 'floor',
    bg: 'repeating-conic-gradient(#f4efe6 0 25%, #2b2a2a 0 50%) 0 0 / 24px 24px',
  },
  {
    id: 'floorMint',
    name: '민트 바닥타일',

    line: '상큼한 민트 체크. 아침 루틴이 가벼워진다.',
    kind: 'decor',
    price: 70000,
    growth: 0.1,
    slot: 'floor',
    bg: 'repeating-conic-gradient(#9ed8c6 0 25%, #82c4b0 0 50%) 0 0 / 24px 24px',
  },
  {
    id: 'floorMarble',
    name: '대리석 바닥타일',

    line: '호텔 로비 같은 매끈한 대리석.',
    kind: 'decor',
    price: 180000,
    growth: 0.1,
    slot: 'floor',
    bg: 'repeating-linear-gradient(90deg, #c9c3b8 0 3px, #eeeae3 3px 48px)',
  },
  {
    id: 'clock',
    name: '벽시계',

    line: '추가 흔들리는 원목 괘종시계. 루틴은 시간에서 시작된다.',
    pos: [68, 10],
    kind: 'furniture',
    price: 260000,
    growth: 0.1,
  },
  {
    id: 'curtain',
    name: '커튼',

    line: '금색 커튼봉에 벨벳 드레이프. 창가가 확 산다.',
    pos: [4, 18],
    kind: 'furniture',
    price: 380000,
    growth: 0.1,
  },
  {
    id: 'sofa',
    name: '소파',
    kind: 'furniture',
    price: 480000,
    growth: 0.2,
    line: '경기 하이라이트는 여기서 돌려본다.',
    pos: [0, 44],
  },
  {
    id: 'bed',
    name: '침대',
    kind: 'furniture',
    price: 680000,
    growth: 0.2,
    line: '잘 자는 것도 훈련이다. 네이비 호텔 침구.',
    pos: [34, 38],
  },
  {
    id: 'barbell',
    name: '홈짐 바벨 세트',

    line: '스쿼트 랙에 덤벨까지. 성장 보너스 최대.',
    pos: [80, 38],
    kind: 'furniture',
    price: 30000000,
    growth: 0.5,
  },
  pet('pomeranian', '포메라니안', 110000, '솜뭉치가 발밑을 졸졸 따라다닌다.'),
  pet(
    'beagle',
    '비글',
    140000,
    '지칠 줄 모르는 에너지. 같이 뛰면 체력이 붙는다.',
  ),
  pet('poodle', '푸들', 180000, '영리한 곱슬머리 룸메이트.'),
  pet('maltese', '말티즈', 180000, '하얀 털뭉치의 무한 애교.'),
  pet('bulldog', '불독', 250000, '듬직한 얼굴의 경호원.'),
  pet('siamese', '샴고양이', 140000, '파란 눈으로 경기 영상을 같이 본다.'),
  pet('russianBlue', '러시안블루', 210000, '조용하고 우아한 은회색 고양이.'),
  pet('koreanShorthair', '코리안숏헤어', 82000, '치즈 줄무늬 동네 스타.'),
  pet('persian', '페르시안', 250000, '소파 위 왕좌의 주인.'),
  pet('scottishFold', '스코티시폴드', 330000, '접힌 귀로 고개를 갸웃.'),
]

// 가격(만원) 구간별 등급: 0 일반 · 1 레어 · 2 에픽 · 3 레전드
export const tierOf = (price: number) =>
  price < 1e5 ? 0 : price < 1e6 ? 1 : price < 5e7 ? 2 : 3

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

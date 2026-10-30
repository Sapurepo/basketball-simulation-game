import { ATTR_KEYS } from '../engine/player'
import type { Accessory, Attributes } from '../engine/types'

// 상점 아이템. 착용 사치품(acc)·훈련용품(gear)은 보유하는 동안 시즌 능력치 버프,
// 나머지는 무대를 꾸미고 시즌 성장 보너스를 준다. 가격은 만원.
// 슬롯 아이템(벽지·바닥타일·모자)은 보유한 것 중 하나만 적용하고, 적용 중일 때만 효과가 있다 (bg 는 CSS background)
export interface Item {
  id: string
  name: string
  kind: 'gear' | 'luxury' | 'decor' | 'furniture' | 'pet'
  price: number
  buff?: Partial<Attributes>
  growth?: number
  acc?: Accessory
  slot?: 'wall' | 'floor' | 'hat'
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

const wall = (
  id: string,
  name: string,
  price: number,
  bg: string,
  line: string,
): Item => ({
  id,
  name,
  kind: 'decor',
  price,
  growth: 0.05,
  slot: 'wall',
  bg,
  line,
})

const hat = (
  id: string,
  name: string,
  price: number,
  buff: Partial<Attributes>,
  line: string,
): Item => ({
  id,
  name,
  kind: 'luxury',
  price,
  buff,
  acc: id as Accessory,
  slot: 'hat',
  line,
})

export const ITEMS: Item[] = [
  // ── 훈련용품: 무대에 두고(슬리브는 착용) 능력치 +1 ──
  {
    id: 'band',
    name: '저항밴드',
    kind: 'gear',
    price: 300,
    buff: { athleticism: 1 },
    pos: [30, 62],
    line: '어디서든 하체 루틴. 점프 첫 동작이 묵직해진다.',
  },
  {
    id: 'rope',
    name: '점프로프',
    kind: 'gear',
    price: 500,
    buff: { speed: 1 },
    pos: [72, 62],
    line: '하루 천 번. 발이 바닥에 닿는 시간이 짧아진다.',
  },
  {
    id: 'reboundPad',
    name: '리바운드 패드',
    kind: 'gear',
    price: 800,
    buff: { rebounding: 1 },
    pos: [88, 46],
    line: '몸싸움 연습용 패드. 박스아웃 자리를 뺏기지 않는다.',
  },
  {
    id: 'cones',
    name: '수비 슬라이드 콘',
    kind: 'gear',
    price: 1200,
    buff: { defense: 1 },
    pos: [44, 74],
    line: '콘 사이 사이드 스텝. 수비 자세가 낮고 빨라진다.',
  },
  {
    id: 'sleeve',
    name: '슈팅 슬리브',
    kind: 'gear',
    price: 2000,
    buff: { shooting: 1 },
    acc: 'sleeve',
    line: '팔꿈치를 잡아주는 압박 슬리브. 릴리스가 일정해진다.',
  },
  {
    id: 'passWall',
    name: '패스 벽',
    kind: 'gear',
    price: 3000,
    buff: { playmaking: 1 },
    pos: [20, 40],
    line: '던지면 돌아오는 리바운더 네트. 혼자서도 패스 천 개.',
  },
  // ── 사치품 ──
  hat(
    'beanie',
    '니트 비니',
    600,
    { athleticism: 1 },
    '새벽 러닝에도 귀가 따뜻하다.',
  ),
  {
    id: 'headband',
    name: '헤어밴드',
    kind: 'luxury',
    price: 1800,
    buff: { rebounding: 1 },
    acc: 'headband',
    line: '땀이 눈에 안 들어가면 공이 떨어질 곳까지 보인다.',
  },
  hat(
    'visor',
    '썬바이저',
    2500,
    { shooting: 1 },
    '햇빛을 가리면 야외 코트에서도 림이 또렷하다.',
  ),
  {
    id: 'kneePads',
    name: '카본 무릎 보호대',
    kind: 'luxury',
    price: 4000,
    buff: { defense: 1 },
    acc: 'knee',
    line: '바닥에 몸을 던져도 무섭지 않다.',
  },
  hat(
    'bucketHat',
    '버킷햇',
    5000,
    { playmaking: 1 },
    '느긋한 챙 아래로 코트가 넓게 보인다.',
  ),
  {
    id: 'cap',
    name: '스냅백',

    line: '챙을 꾹 눌러쓰면 수비 집중력이 올라간다.',
    kind: 'luxury',
    price: 8500,
    buff: { defense: 1 },
    acc: 'cap',
    slot: 'hat',
  },
  {
    id: 'scooter',
    name: '전동 킥보드',
    kind: 'luxury',
    price: 9000,
    growth: 0.05,
    pos: [86, 58],
    line: '체육관까지 5분. 남는 시간은 개인 훈련에.',
  },
  hat(
    'truckerCap',
    '트러커 캡',
    12000,
    { speed: 1 },
    '메시 뒤판으로 열이 빠진다. 발걸음이 가볍다.',
  ),
  {
    id: 'glasses',
    name: '뿔테 안경',
    kind: 'luxury',
    price: 16000,
    buff: { playmaking: 1 },
    acc: 'glasses',
    line: '경기 영상을 분석할 땐 안경부터 쓴다.',
  },
  {
    id: 'roadBike',
    name: '로드 자전거',
    kind: 'luxury',
    price: 45000,
    growth: 0.1,
    pos: [70, 44],
    line: '비시즌 유산소는 강변 라이딩으로.',
  },
  hat(
    'fedora',
    '페도라',
    60000,
    { rebounding: 1 },
    '입장할 때 쓰는 신사 모자. 존재감으로 자리를 잡는다.',
  ),
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
  // ── 장식: 저가 벽지 ──
  wall(
    'wallKraft',
    '크라프트지 벽지',
    50,
    'repeating-linear-gradient(0deg, #c49a68 0 2px, #cfa775 2px 7px)',
    '포장지 같은 갈색 종이. 첫 자취방 감성.',
  ),
  wall(
    'wallNews',
    '신문지 벽지',
    80,
    'repeating-linear-gradient(90deg, transparent 0 46px, #b8b2a4 46px 48px), repeating-linear-gradient(0deg, #c9c3b5 0 2px, #ece8de 2px 6px)',
    '스포츠면만 골라 붙였다. 언젠가 내 기사도.',
  ),
  wall(
    'wallDots',
    '하늘 도트 벽지',
    120,
    'linear-gradient(90deg, #8cc4e6 0 12px, transparent 12px) 0 0 / 18px 18px, linear-gradient(0deg, #8cc4e6 0 12px, #f7fbff 12px) 0 0 / 18px 18px',
    '맑은 하늘에 흰 도트. 기분이 가벼워진다.',
  ),
  wall(
    'wallPeg',
    '타공판 벽지',
    200,
    'linear-gradient(90deg, #d9b380 0 10px, transparent 10px) 0 0 / 14px 14px, linear-gradient(0deg, #d9b380 0 10px, #6b4a2a 10px) 0 0 / 14px 14px',
    '공구 대신 농구공을 거는 차고 감성.',
  ),
  wall(
    'wallTeam',
    '팀 컬러 사선 벽지',
    300,
    'repeating-linear-gradient(135deg, #f07a2b 0 12px, #efe8d8 12px 20px, #23306b 20px 32px, #efe8d8 32px 40px)',
    '주황과 네이비 사선. 매일이 홈 경기 날.',
  ),
  wall(
    'wallGym',
    '체육관 블록 벽지',
    500,
    'linear-gradient(180deg, transparent 0 62%, #f07a2b 62% 67%, #23306b 67% 72%, transparent 72%), linear-gradient(0deg, #9aa3a8 0 2px, transparent 2px) 0 0 / 28px 14px, linear-gradient(90deg, #9aa3a8 0 2px, #d7dde0 2px) 0 0 / 28px 14px',
    '페인트 칠한 블록 벽. 체육관 냄새가 난다.',
  ),
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
  // ── 가구 ──
  {
    id: 'plant',
    name: '몬스테라 화분',
    kind: 'furniture',
    price: 1500,
    growth: 0.05,
    pos: [96, 44],
    line: '초록이 있으면 회복이 빠르다는 소문.',
  },
  {
    id: 'lamp',
    name: '스탠드 조명',
    kind: 'furniture',
    price: 3000,
    growth: 0.05,
    pos: [2, 30],
    line: '밤에 경기 영상을 볼 때 켜는 노란 불빛.',
  },
  {
    id: 'trophyShelf',
    name: '트로피 선반',
    kind: 'furniture',
    price: 6000,
    growth: 0.1,
    pos: [10, 4],
    line: '첫 트로피 자리를 미리 비워 둔다.',
  },
  {
    id: 'miniHoop',
    name: '미니 골대',
    kind: 'furniture',
    price: 12000,
    growth: 0.1,
    pos: [86, 26],
    line: '벽에 단 작은 림. 자기 전 마지막 슛 100개.',
  },
  {
    id: 'tv',
    name: '벽걸이 TV',
    kind: 'furniture',
    price: 40000,
    growth: 0.1,
    pos: [82, 4],
    line: '75인치 화면으로 상대 팀 경기를 돌려 본다.',
  },
  {
    id: 'iceBath',
    name: '아이스 배스',
    kind: 'furniture',
    price: 90000,
    growth: 0.2,
    pos: [62, 54],
    line: '경기 다음 날 10분. 다리가 다시 가벼워진다.',
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

// 가격(만원) 구간별 등급: 0 일반(1천만 미만) · 1 레어(1억 미만) · 2 에픽(100억 미만) · 3 레전드
export const tierOf = (price: number) =>
  price < 1000 ? 0 : price < 1e4 ? 1 : price < 1e6 ? 2 : 3

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)

// 아이템 효과 상한: 능력치별 버프 합 +3, 시즌 성장 보너스 합 +2.0
export const BUFF_CAP = 3
export const GROWTH_CAP = 2

export type ItemSlots = Partial<Record<NonNullable<Item['slot']>, string>>

// 보유 아이템의 합산 효과. 슬롯 아이템(벽지·바닥·모자)은 적용 중인 것만 센다
export function itemEffects(s: { items?: string[] } & ItemSlots): {
  attrs: Partial<Attributes>
  growth: number
} {
  const attrs: Partial<Attributes> = {}
  let growth = 0
  for (const id of s.items ?? []) {
    const it = itemById(id)
    if (!it || (it.slot && s[it.slot] !== id)) continue
    growth += it.growth ?? 0
    for (const k of ATTR_KEYS)
      if (it.buff?.[k])
        attrs[k] = Math.min(BUFF_CAP, (attrs[k] ?? 0) + it.buff[k])
  }
  // 0.05 가 쌓이면 부동소수 찌꺼기가 남으므로 소수 둘째 자리로
  growth = Math.min(GROWTH_CAP, Math.round(growth * 100) / 100)
  return { attrs, growth }
}

export const buffed = (base: Attributes, buff: Partial<Attributes>) =>
  Object.fromEntries(
    ATTR_KEYS.map((k) => [k, Math.min(99, base[k] + (buff[k] ?? 0))]),
  ) as Attributes

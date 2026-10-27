import { useEffect, useRef, useState } from 'react'
import { type Item, itemById, ITEMS } from '../data/items'
import { formatMoney } from '../engine/events'
import { ATTR_LABELS } from '../engine/player'
import type { AttrKey, GameState } from '../engine/types'
import { Pet } from './pet'
import { type IconName, iconSize, iconURL } from './sprite'

const effectText = (it: Item) =>
  it.buff
    ? Object.entries(it.buff)
        .map(([k, v]) => `${ATTR_LABELS[k as AttrKey]} +${v}`)
        .join(' · ')
    : `시즌 성장 +${it.growth}`

const KINDS: [Item['kind'], string, string][] = [
  ['luxury', '사치품', '착용하면 시즌 능력치 버프, 선수에게 입혀져요'],
  [
    'decor',
    '장식',
    '무대를 꾸미고 시즌 성장 보너스. 벽지와 바닥은 하나만 적용',
  ],
  ['furniture', '가구', '무대를 꾸미고 시즌 성장 보너스'],
  ['pet', '펫', '무대에서 함께 지내고 시즌 성장 보너스'],
]

// 상점 팝업: 보유 자금으로 아이템을 산다. 한 번 산 아이템은 계속 보유
export function ShopDialog({
  cash,
  items = [],
  applied,
  onBuy,
  onApply,
  onClose,
}: {
  cash: number
  items?: string[]
  applied: (string | undefined)[]
  onBuy: (id: string) => void
  onApply: (it: Item) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<Item['kind']>('luxury')
  const [, title, desc] = KINDS.find(([k]) => k === tab)!
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal shop"
      onClose={() => setTimeout(onClose, 150)}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">상점</p>
          <h2>보유 자금 {formatMoney(cash, 'KRW')}</h2>
        </div>
        <button className="ghost" onClick={() => ref.current?.close()}>
          닫기
        </button>
      </div>
      <div className="tabs" role="tablist">
        {KINDS.map(([kind, label]) => (
          <button
            key={kind}
            role="tab"
            aria-selected={tab === kind}
            onClick={() => setTab(kind)}
          >
            {label}
          </button>
        ))}
      </div>
      <section aria-label={title}>
        <p className="muted">{desc}</p>
        <ul className="shop-list">
          {ITEMS.filter((it) => it.kind === tab).map((it) => {
            const owned = items.includes(it.id)
            const on = applied.includes(it.id)
            return (
              <li key={it.id}>
                <span>
                  <b>{it.name}</b>
                  <small>{effectText(it)}</small>
                </span>
                <span className="price">{formatMoney(it.price, 'KRW')}</span>
                {owned && it.slot ? (
                  <button
                    className="ghost"
                    disabled={on}
                    onClick={() => onApply(it)}
                  >
                    {on ? '적용 중' : '적용'}
                  </button>
                ) : (
                  <button
                    className={owned ? 'ghost' : 'primary'}
                    disabled={owned || cash < it.price}
                    onClick={() => onBuy(it.id)}
                  >
                    {owned ? '보유' : '구입'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </dialog>
  )
}

// 무대 장식: 창문은 늘 있고, 보유한 가구·장식·탈것은 정해진 자리(CSS)에,
// 펫은 바닥을 돌아다닌다
const DECOR_SCALE = 4
const SCALE: Record<string, number> = { sofa: 7, clock: 3 }

function Icon({ name, alt }: { name: IconName; alt: string }) {
  const [w, h] = iconSize(name)
  const k = SCALE[name] ?? DECOR_SCALE
  return (
    <img
      className={`px decor decor-${name}`}
      src={iconURL(name)}
      width={w * k}
      height={h * k}
      alt={alt}
    />
  )
}

export function Decor({ items = [] }: { items?: string[] }) {
  const owned = items
    .map((id) => itemById(id))
    .filter((it): it is Item => !!it && !it.acc && !it.slot)
  const pets = owned.filter((it) => it.kind === 'pet')
  return (
    <>
      <Icon name="window" alt="창문" />
      {owned
        .filter((it) => it.kind !== 'pet')
        .map((it) => (
          <Icon key={it.id} name={it.id as IconName} alt={it.name} />
        ))}
      {pets.length > 0 && (
        <div className="pets">
          {pets.map((it, i) => (
            <Pet
              key={it.id}
              it={it}
              start={Math.round((i * 90) / pets.length) + 2}
            />
          ))}
        </div>
      )}
    </>
  )
}

// 트로피 진열대: 팀 우승과 아시안게임 금메달. 칸이 넘치면 ×N
const SHELF_SLOTS = 5
export function TrophyShelf({ state }: { state: GameState }) {
  const n =
    state.history
      .flatMap((h) => h.awards)
      .filter((a) => a.endsWith(' 우승') || a === 'NBA 챔피언').length +
    state.honors.filter((h) => h.name === '아시안게임 금메달').length
  return (
    <div className="shelf" aria-label={`팀 우승 트로피 ${n}개`}>
      <div className="shelf-items">
        {[...Array(Math.min(n, SHELF_SLOTS))].map((_, i) => (
          <img
            key={i}
            className="px"
            src={iconURL('trophy')}
            width={22}
            height={22}
            alt=""
          />
        ))}
        {n > SHELF_SLOTS && <b>×{n}</b>}
      </div>
    </div>
  )
}

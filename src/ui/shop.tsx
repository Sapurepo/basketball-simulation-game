import { useEffect, useRef } from 'react'
import { type Item, itemById, ITEMS } from '../data/items'
import { formatMoney } from '../engine/events'
import { ATTR_LABELS } from '../engine/player'
import type { AttrKey } from '../engine/types'
import { type IconName, iconSize, iconURL } from './sprite'

const effectText = (it: Item) =>
  it.buff
    ? Object.entries(it.buff)
        .map(([k, v]) => `${ATTR_LABELS[k as AttrKey]} +${v}`)
        .join(' · ')
    : `시즌 성장 +${it.growth}`

const KINDS: [Item['kind'], string, string][] = [
  ['wear', '치장', '보유하는 동안 시즌 능력치 버프, 선수에게 입혀져요'],
  ['decor', '장식', '무대를 꾸미고 시즌 성장 보너스'],
]

// 상점 팝업: 보유 자금으로 아이템을 산다. 한 번 산 아이템은 계속 보유
export function ShopDialog({
  cash,
  items = [],
  onBuy,
  onClose,
}: {
  cash: number
  items?: string[]
  onBuy: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
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
      {KINDS.map(([kind, title, desc]) => (
        <section key={kind}>
          <h3>{title}</h3>
          <p className="muted">{desc}</p>
          <ul className="shop-list">
            {ITEMS.filter((it) => it.kind === kind).map((it) => {
              const owned = items.includes(it.id)
              return (
                <li key={it.id}>
                  <span>
                    <b>{it.name}</b>
                    <small>{effectText(it)}</small>
                  </span>
                  <span className="price">{formatMoney(it.price, 'KRW')}</span>
                  <button
                    className={owned ? 'ghost' : 'primary'}
                    disabled={owned || cash < it.price}
                    onClick={() => onBuy(it.id)}
                  >
                    {owned ? '보유' : '구입'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </dialog>
  )
}

// 무대 장식: 보유한 장식 아이템을 정해진 자리(CSS)에 놓는다
const DECOR_SCALE = 4
export function Decor({ items = [] }: { items?: string[] }) {
  return (
    <>
      {items
        .map((id) => itemById(id))
        .filter((it): it is Item => it?.kind === 'decor')
        .map((it) => {
          const name = it.id as IconName
          const [w, h] = iconSize(name)
          return (
            <img
              key={it.id}
              className={`px decor decor-${it.id}`}
              src={iconURL(name)}
              width={w * DECOR_SCALE}
              height={h * DECOR_SCALE}
              alt={it.name}
            />
          )
        })}
    </>
  )
}

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { type Item, itemById, itemEffects, ITEMS, tierOf } from '../data/items'
import { formatMoney } from '../engine/events'
import { buyItem } from '../engine/game'
import { ATTR_LABELS } from '../engine/player'
import type { AttrKey, GameState } from '../engine/types'
import { T, tr } from '../i18n'
import { Pet } from './pet'
import { useFrame } from './frame'
import {
  anchorOf,
  clampPos,
  type Layout,
  type Place,
  patchPlace,
  placeOf,
  resetPlace,
  WALL,
} from './layout'
import { PixelPlayer } from './pixelPlayer'
import type { Kit } from './pose'
import { type ArtName, artSize, artURL } from './shopArt'
import { DEFAULT_LOOK, type IconName, iconSize, iconURL } from './sprite'

const money = (n: number) => formatMoney(n, 'KRW')

const effectText = (it: Item) =>
  it.buff
    ? Object.entries(it.buff)
        .map(([k, v]) => `${tr(ATTR_LABELS[k as AttrKey])} +${v}`)
        .join(' · ')
    : tr('시즌 성장 +{n}', { n: it.growth ?? 0 })

const tierLabel = (t: number) =>
  [tr('일반'), tr('레어'), tr('에픽'), tr('레전드')][t]

function Bill({ size = 2 }: { size?: number }) {
  const [w, h] = artSize('bill')
  return (
    <img
      className="px"
      src={artURL('bill')}
      width={w * size}
      height={h * size}
      alt=""
    />
  )
}

// ── 무대 장식 ──
// 창문은 늘 있고, 보유한 가구·장식·탈것은 배치(layout, 없으면 기본 자리)에, 펫은 바닥을 돌아다닌다.
// 격자는 110×80: 가로는 무대 폭 %, 세로는 1칸 3.5px (무대 높이 280px)
const SCALE = 4
export const UNIT_Y = 3.5

function zOf(id: string, y: number, h: number) {
  if (id === 'window') return 1
  if (id === 'curtain') return 2
  if (WALL.has(id)) return 3
  if (id === 'rug') return 5
  return 10 + y + h
}

// 배치 편집 중일 때 Decor 가 받는 것
export interface StageEdit {
  sel?: string
  onGrab: (id: string, e: ReactPointerEvent) => void
}

function Piece({
  id,
  place,
  alt,
  preview,
  drop,
  edit,
}: {
  id: ArtName
  place: Place
  alt: string
  preview?: boolean
  drop?: boolean
  edit?: StageEdit
}) {
  const frame = useFrame()
  const [w, h] = artSize(id)
  const { x, y } = place
  // 커튼과 창문은 한 몸이라 어느 쪽을 골라도 둘 다 선택 표시
  const picked = !!edit?.sel && anchorOf(edit.sel) === anchorOf(id)
  // 바닥 물건은 아래 기준이라 무대 높이가 바뀌어도 바닥에 붙어 있다
  const style: CSSProperties = {
    left: `${(x * 100) / 110}%`,
    zIndex: preview ? 150 : zOf(id, y, h),
    ...(WALL.has(id) ? { top: y * UNIT_Y } : { bottom: (80 - y - h) * UNIT_Y }),
  }
  const cls = [
    'decor',
    preview && 'preview',
    drop && 'drop',
    edit && 'editable',
    picked && 'picked',
  ]
  return (
    <span
      className={cls.filter(Boolean).join(' ')}
      style={style}
      onPointerDown={edit && ((e) => edit.onGrab(id, e))}
    >
      <img
        className={place.flip ? 'px flip' : 'px'}
        src={artURL(id, id === 'clock' ? frame : 0)}
        width={w * SCALE}
        height={h * SCALE}
        alt={alt}
        draggable={false}
      />
      {preview && <b className="preview-tag">{tr('미리보기')}</b>}
      {picked && edit?.sel === id && <b className="preview-tag">{alt}</b>}
    </span>
  )
}

export function Decor({
  items = [],
  layout,
  preview,
  drop,
  edit,
}: {
  items?: string[]
  layout?: Layout
  // 아직 사지 않은 아이템을 무대에 놓아 본다 (상점)
  preview?: string
  // 방금 산 아이템은 위에서 떨어진다
  drop?: string
  // 배치 편집 중이면 끌어서 옮긴다
  edit?: StageEdit
}) {
  const shown = [...items, ...(preview ? [preview] : [])]
    .map((id) => itemById(id))
    .filter((it): it is Item => !!it && !it.acc && !it.slot)
  const pets = shown.filter((it) => it.kind === 'pet')
  return (
    <>
      <Piece
        id="window"
        place={placeOf(layout, 'window')}
        alt={tr('창문')}
        edit={edit}
      />
      {shown
        .filter((it) => it.kind !== 'pet')
        .map((it) => ({ it, place: placeOf(layout, it.id) }))
        .filter(({ it, place }) => !place.hidden || it.id === preview)
        .map(({ it, place }) => (
          <Piece
            key={it.id}
            id={it.id as ArtName}
            place={place}
            alt={tr(it.name)}
            preview={it.id === preview}
            drop={it.id === drop}
            edit={it.id === preview ? undefined : edit}
          />
        ))}
      {pets.length > 0 && (
        <div className="pets">
          {pets.map((it, i) => (
            <Pet
              key={it.id}
              it={it}
              start={Math.round(((i + 0.5) * 90) / pets.length)}
              preview={it.id === preview}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ── 상점 ──
const KINDS: Item['kind'][] = ['luxury', 'decor', 'furniture', 'pet']
const kindTab = (k: Item['kind']) =>
  ({
    luxury: tr('사치품'),
    decor: tr('장식'),
    furniture: tr('가구'),
    pet: tr('펫'),
  })[k]
const kindDesc = (k: Item['kind']) =>
  ({
    luxury: tr('착용하면 시즌 능력치 버프. 탈것은 무대 앞에 세워져요.'),
    decor: tr('무대를 꾸미고 시즌 성장 보너스. 벽지와 바닥은 하나만 적용돼요.'),
    furniture: tr('무대를 꾸미고 시즌 성장 보너스. 놓을 자리가 정해져 있어요.'),
    pet: tr('무대에서 함께 지내고 시즌 성장 보너스. 눌러서 쓰다듬어 주세요.'),
  })[k]

function kindLabel(it: Item) {
  if (it.buff) return tr('착용 아이템')
  if (it.kind === 'luxury') return tr('탈것 · 무대 배치')
  if (it.kind === 'pet') return tr('펫 · 무대에서 함께')
  if (it.slot === 'wall') return tr('벽지 · 하나만 적용')
  if (it.slot === 'floor') return tr('바닥 · 하나만 적용')
  if (it.kind === 'decor') return tr('장식 · 무대 배치')
  return tr('가구 · 무대 배치')
}

function whereLabel(it: Item) {
  if (it.buff) return tr('효과 · 선수에게 착용')
  if (it.kind === 'pet') return tr('효과 · 무대에서 함께 지내기')
  if (it.slot === 'wall') return tr('효과 · 무대 벽에 적용')
  if (it.slot === 'floor') return tr('효과 · 무대 바닥에 적용')
  return tr('효과 · 무대에 배치')
}

// 카드에 붙는 보유 상태
function ownedStatus(it: Item, applied: boolean) {
  if (it.buff) return tr('착용 중')
  if (it.kind === 'pet') return tr('함께 지내는 중')
  if (it.slot) return applied ? tr('적용 중') : tr('보유 · 미적용')
  return tr('배치 중')
}

// 탭을 고르면 살 수 있는 첫 아이템, 없으면 아직 없는 첫 아이템을 고른다
function firstPick(kind: Item['kind'], owned: string[], cash: number) {
  const list = ITEMS.filter((i) => i.kind === kind).sort(
    (a, b) => a.price - b.price,
  )
  return (
    list.find((i) => !owned.includes(i.id) && i.price <= cash) ??
    list.find((i) => !owned.includes(i.id)) ??
    list[0]
  ).id
}

function CardArt({ it }: { it: Item }) {
  if (it.bg) return <span className="swatch" style={{ background: it.bg }} />
  const [w, h] =
    it.kind === 'pet' ? iconSize(it.id as IconName) : artSize(it.id as ArtName)
  const s = Math.max(2, Math.min(7, Math.floor(Math.min(150 / w, 92 / h))))
  return (
    <img
      className="px"
      src={
        it.kind === 'pet'
          ? iconURL(it.id as IconName)
          : artURL(it.id as ArtName)
      }
      width={w * s}
      height={h * s}
      alt=""
    />
  )
}

// 무대 아이템이 놓이는 곳 (편집 패널 안내)
function zoneOf(id: string) {
  if (id === 'window' || id === 'curtain')
    return tr('벽 · 창문과 커튼은 함께 움직여요')
  if (WALL.has(id)) return tr('벽에 걸기')
  return tr('바닥에 놓기')
}

function Thumb({ id }: { id: ArtName }) {
  const [w, h] = artSize(id)
  const k = Math.min(40 / w, 26 / h)
  return (
    <span className="thumb">
      <img
        className="px"
        src={artURL(id)}
        width={Math.round(w * k)}
        height={Math.round(h * k)}
        alt=""
      />
    </span>
  )
}

// 배치 편집 패널: 고른 아이템 다루기 + 내 무대 아이템 목록(보관·꺼내기)
function EditPanel({
  owned,
  layout,
  sel,
  onSelect,
  onLayout,
  onDone,
}: {
  owned: string[]
  layout?: Layout
  sel?: string
  onSelect: (id: string) => void
  // nextSel: 바꿀 선택 ('' 는 선택 해제, undefined 는 그대로)
  onLayout: (next: Layout, nextSel?: string) => void
  onDone: () => void
}) {
  const placeable = ITEMS.filter((i) => i.pos && owned.includes(i.id))
  const name = (id: string) =>
    id === 'window' ? tr('창문') : tr(itemById(id)?.name ?? id)
  // 보관한 아이템은 고를 수 없다
  const cur =
    sel &&
    (sel === 'window' || (owned.includes(sel) && !placeOf(layout, sel).hidden))
      ? sel
      : undefined
  const onStage = placeable.filter((i) => !placeOf(layout, i.id).hidden)
  const store = (id: string) =>
    onLayout(
      patchPlace(layout, id, { hidden: true }),
      sel === id ? '' : undefined,
    )
  return (
    <section className="shop-detail shop-edit" aria-live="polite">
      <div className="row">
        <span className="tier t3">EDIT</span>
        <small className="muted">{tr('배치 편집')}</small>
      </div>
      <h3>{tr('무대 꾸미기')}</h3>
      <p className="muted">
        {tr(
          '무대 위 아이템을 끌어서 옮기세요. 가구·탈것은 바닥에, 창문·시계는 벽에만 놓여요. 보관해도 성장 보너스는 그대로예요.',
        )}
      </p>
      {cur ? (
        <div className="edit-sel">
          <span>
            <b>{name(cur)}</b>
            <small className="muted">{zoneOf(cur)}</small>
          </span>
          <div className="row">
            <button
              className="chip"
              onClick={() => {
                const t = anchorOf(cur)
                onLayout(
                  patchPlace(layout, t, { flip: !placeOf(layout, t).flip }),
                )
              }}
            >
              {tr('좌우 반전')}
            </button>
            <button
              className="chip"
              onClick={() => onLayout(resetPlace(layout, anchorOf(cur)))}
            >
              {tr('제자리로')}
            </button>
            {cur !== 'window' && (
              <button className="chip" onClick={() => store(cur)}>
                {tr('보관하기')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="edit-sel muted">
          {tr('무대 위 아이템을 눌러 선택하세요.')}
        </p>
      )}
      <div className="shop-effects edit-list">
        <p>
          {tr('내 아이템 · 무대 위 {n}', {
            n: `${onStage.length}/${placeable.length}`,
          })}
        </p>
        {placeable.length === 0 && (
          <span className="muted">
            {tr(
              '무대에 놓을 아이템이 아직 없어요. 가구나 탈것을 구매해 보세요.',
            )}
          </span>
        )}
        {placeable.map((i) => {
          const hidden = placeOf(layout, i.id).hidden
          return (
            <div key={i.id}>
              <Thumb id={i.id as ArtName} />
              <span>
                <b>{tr(i.name)}</b>
                <small className="muted">
                  {hidden
                    ? tr('보관 중')
                    : cur === i.id
                      ? tr('무대 위 · 선택됨')
                      : i.id === 'curtain'
                        ? tr('창문')
                        : WALL.has(i.id)
                          ? tr('벽')
                          : tr('바닥')}
                </small>
              </span>
              {hidden ? (
                <button
                  className="chip on"
                  onClick={() =>
                    onLayout(patchPlace(layout, i.id, { hidden: false }), i.id)
                  }
                >
                  {tr('꺼내기')}
                </button>
              ) : (
                <span className="row nowrap">
                  <button className="chip" onClick={() => onSelect(i.id)}>
                    {tr('선택')}
                  </button>
                  <button className="chip" onClick={() => store(i.id)}>
                    {tr('보관')}
                  </button>
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="edit-actions">
        <button className="ghost" onClick={() => onLayout({}, '')}>
          {tr('기본 배치로')}
        </button>
        <button className="primary" onClick={onDone}>
          {tr('완료')}
        </button>
      </div>
    </section>
  )
}

// 상점 팝업: 아이템을 고르면 무대에 미리 놓아 보고, 산 아이템은 계속 보유
export function ShopDialog({
  state,
  kit,
  onChange,
  onClose,
}: {
  state: GameState
  kit: Kit
  onChange: (s: GameState) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const cash = state.cash ?? 0
  const owned = state.items ?? []
  const [tab, setTab] = useState<Item['kind']>('luxury')
  const [sel, setSel] = useState(() => firstPick('luxury', owned, cash))
  // 방금 산 아이템: 떨어지는 연출·토스트·차감 금액. n 은 연출을 다시 틀기 위한 키
  const [bought, setBought] = useState<{ id: string; n: number }>()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    ref.current?.showModal()
    return () => clearTimeout(timer.current)
  }, [])

  const it = itemById(sel)!
  const has = owned.includes(it.id)
  const isApplied = (x: Item) => !!x.slot && state[x.slot] === x.id
  const look = state.player.look ?? DEFAULT_LOOK

  // 배치 편집: 미리보기를 끄고 무대 아이템을 끌거나 방향키로 옮긴다.
  // 끄는 동안의 자리는 drag 에만 두고, 손을 떼면 저장한다
  const [editing, setEditing] = useState(false)
  const [edSel, setEdSel] = useState<string>()
  const [drag, setDrag] = useState<{ id: string; x: number; y: number }>()
  const stageRef = useRef<HTMLDivElement>(null)
  const layout = state.layout
  const setLayout = (next: Layout) => onChange({ ...state, layout: next })
  const shownLayout = drag
    ? patchPlace(layout, drag.id, { x: drag.x, y: drag.y })
    : layout

  const grab = (id: string, e: ReactPointerEvent) => {
    e.preventDefault()
    const target = anchorOf(id)
    const from = placeOf(layout, target)
    const unitX = (stageRef.current?.clientWidth ?? 440) / 110
    let last = from
    setEdSel(id)
    const move = (ev: PointerEvent) => {
      const [x, y] = clampPos(
        target,
        Math.round(from.x + (ev.clientX - e.clientX) / unitX),
        Math.round(from.y + (ev.clientY - e.clientY) / UNIT_Y),
      )
      last = { ...from, x, y }
      setDrag({ id: target, x, y })
    }
    const up = () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
      setDrag(undefined)
      if (last.x !== from.x || last.y !== from.y)
        setLayout(patchPlace(layout, target, { x: last.x, y: last.y }))
    }
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
  }

  // 방향키로 1칸씩
  useEffect(() => {
    if (!editing || !edSel) return
    const onKey = (e: KeyboardEvent) => {
      const d = (
        {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        } as Record<string, [number, number]>
      )[e.key]
      if (!d) return
      e.preventDefault()
      const target = anchorOf(edSel)
      const p = placeOf(state.layout, target)
      const [x, y] = clampPos(target, p.x + d[0], p.y + d[1])
      onChange({ ...state, layout: patchPlace(state.layout, target, { x, y }) })
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [editing, edSel, state, onChange])

  const startEdit = (id?: string) => {
    setEditing(true)
    setEdSel(id)
    if (id && placeOf(layout, id).hidden)
      setLayout(patchPlace(layout, id, { hidden: false }))
  }

  // 무대 미리보기: 착용 아이템은 선수에게, 벽지·바닥은 무대에, 나머지는 자리에 놓아 본다
  const wearPreview = !editing && !has && !!it.acc
  const slotPreview = !editing && !!it.slot && !isApplied(it)
  const bgOf = (slot: 'wall' | 'floor') =>
    itemById((slotPreview && it.slot === slot ? it.id : state[slot]) ?? '')?.bg
  const stageLook =
    wearPreview && it.acc ? { ...look, acc: [...look.acc, it.acc] } : look

  // 효과: 이 아이템을 뺀 보유 효과에서 이 아이템을 더한 값으로
  const rest = itemEffects(owned.filter((id) => id !== it.id))
  const effects = it.buff
    ? Object.entries(it.buff).map(([k, v]) => {
        // 능력치는 소수로 쌓이므로 화면(AttrBars)처럼 반올림해 보여 준다
        const from = Math.min(
          99,
          Math.round(
            state.player.attrs[k as AttrKey] + (rest.attrs[k as AttrKey] ?? 0),
          ),
        )
        return {
          label: tr(ATTR_LABELS[k as AttrKey]),
          from: String(from),
          to: String(Math.min(99, from + v)),
          plus: `+${v}`,
        }
      })
    : [
        {
          label: tr('시즌 성장 보너스'),
          from: `+${rest.growth.toFixed(1)}`,
          to: `+${(rest.growth + (it.growth ?? 0)).toFixed(1)}`,
          plus: `+${it.growth ?? 0}`,
        },
      ]
  const growthAll = itemEffects(owned).growth

  const buy = () => {
    const next = buyItem(state, it.id)
    if (next === state) return
    onChange(next)
    clearTimeout(timer.current)
    setBought((b) => ({ id: it.id, n: (b?.n ?? 0) + 1 }))
    timer.current = setTimeout(() => setBought(undefined), 1800)
  }
  const setSlot = (id?: string) =>
    it.slot && onChange({ ...state, [it.slot]: id })
  const pickTab = (k: Item['kind']) => {
    setTab(k)
    setSel(firstPick(k, owned, cash))
  }

  const boughtItem = bought && itemById(bought.id)
  const toast = boughtItem?.acc
    ? tr('구매 완료! 바로 착용했어요')
    : boughtItem?.slot
      ? tr('구매 완료! 바로 적용했어요')
      : boughtItem?.kind === 'pet'
        ? tr('구매 완료! 무대에 들어왔어요')
        : tr('구매 완료! 무대에 놓았어요')

  const tier = tierOf(it.price)
  const cards = ITEMS.filter((i) => i.kind === tab).sort(
    (a, b) => a.price - b.price,
  )

  return (
    <dialog
      ref={ref}
      className="modal shop"
      onClose={() => setTimeout(onClose, 150)}
    >
      <div className="shop-bar">
        <div className="row">
          <span className="shop-badge">SHOP</span>
          <h2>{tr('상점')}</h2>
        </div>
        <div className="row nowrap">
          <div className="shop-cash">
            <Bill />
            <span>
              <small>{tr('보유 자금')}</small>
              <b>{money(cash)}</b>
            </span>
            {bought && boughtItem && (
              <span key={bought.n} className="cash-float">
                −{money(boughtItem.price)}
              </span>
            )}
          </div>
          <button className="ghost" onClick={() => ref.current?.close()}>
            {tr('닫기')}
          </button>
        </div>
      </div>

      <div className="shop-body">
        <div className="shop-top">
          <div
            ref={stageRef}
            className={
              editing ? 'stage shop-stage editing' : 'stage shop-stage'
            }
            style={
              {
                '--wall': bgOf('wall'),
                '--floor': bgOf('floor'),
              } as CSSProperties
            }
          >
            <p className="shop-stage-tag">
              {tr('내 무대')}
              <span className="gold">
                {tr('수집 {n}', { n: `${owned.length}/${ITEMS.length}` })}
              </span>
              <span className="mint">
                {tr('성장 {n}', { n: `+${growthAll.toFixed(1)}` })}
              </span>
            </p>
            <Decor
              items={owned}
              layout={shownLayout}
              preview={
                !editing && !has && !it.acc && !it.slot ? it.id : undefined
              }
              drop={bought?.id}
              edit={editing ? { sel: edSel, onGrab: grab } : undefined}
            />
            {editing ? (
              <>
                <button
                  className="stage-edit on"
                  onClick={() => setEditing(false)}
                >
                  {tr('완료')}
                </button>
                <p className="stage-edit-hint">
                  {tr('배치 편집 중 · 끌어서 옮기기 · 방향키로 1칸씩')}
                </p>
              </>
            ) : (
              <button
                className="stage-edit"
                onClick={() => startEdit(has && it.pos ? it.id : undefined)}
              >
                {tr('배치 편집')}
              </button>
            )}
            <div
              className={`sprite${wearPreview ? ' preview' : ''}${
                bought && boughtItem?.acc ? ' spark' : ''
              }`}
            >
              <PixelPlayer pose="idle" kit={kit} look={stageLook} scale={4} />
              {wearPreview && (
                <b className="preview-tag">{tr('착용 미리보기')}</b>
              )}
            </div>
            {slotPreview && (
              <span className="slot-tag">
                {it.slot === 'wall'
                  ? tr('벽지 미리보기 · {name}', { name: T(it.name) })
                  : tr('바닥 미리보기 · {name}', { name: T(it.name) })}
              </span>
            )}
            {bought && (
              <p key={bought.n} className="shop-toast" role="status">
                {toast}
              </p>
            )}
          </div>

          {editing ? (
            <EditPanel
              owned={owned}
              layout={layout}
              sel={edSel}
              onSelect={setEdSel}
              onLayout={(next, nextSel) => {
                setLayout(next)
                if (nextSel !== undefined) setEdSel(nextSel || undefined)
              }}
              onDone={() => setEditing(false)}
            />
          ) : (
            <section className="shop-detail" aria-live="polite">
              <div className="row">
                <span className={`tier t${tier}`}>{tierLabel(tier)}</span>
                <small className="muted">{kindLabel(it)}</small>
              </div>
              <h3>{tr(it.name)}</h3>
              <p className="muted">{tr(it.line)}</p>
              <div className="shop-effects">
                <p>{whereLabel(it)}</p>
                {effects.map((e) => (
                  <div key={e.label}>
                    <b>{e.label}</b>
                    <span>
                      <span className="muted">{e.from} → </span>
                      <span className="win">{e.to}</span>
                    </span>
                    <span className="plus">{e.plus}</span>
                  </div>
                ))}
              </div>
              <div className="shop-price">
                <span className="row nowrap">
                  <Bill size={3} />
                  <b>{money(it.price)}</b>
                </span>
                {!has &&
                  (cash >= it.price ? (
                    <small className="muted">
                      {tr('구매 후 잔액 {money}', {
                        money: money(cash - it.price),
                      })}
                    </small>
                  ) : (
                    <small className="loss">
                      {tr('{money} 더 모으면 살 수 있어요', {
                        money: money(it.price - cash),
                      })}
                    </small>
                  ))}
              </div>
              {has ? (
                <p className="shop-owned">
                  {tr('보유 중 · {status}', {
                    status: it.buff
                      ? tr('착용됨')
                      : it.kind === 'pet'
                        ? tr('함께 지내는 중')
                        : it.slot
                          ? isApplied(it)
                            ? tr('적용 중')
                            : tr('미적용')
                          : tr('무대에 배치됨'),
                  })}
                </p>
              ) : cash >= it.price ? (
                <button className="primary big" onClick={buy}>
                  {tr('구매하기')}
                </button>
              ) : (
                <button className="primary big" disabled>
                  {tr('자금 부족 · {money}', { money: money(it.price - cash) })}
                </button>
              )}
              {has && it.slot && !isApplied(it) && (
                <button className="primary" onClick={() => setSlot(it.id)}>
                  {tr('적용하기')}
                </button>
              )}
              {has && isApplied(it) && (
                <button className="ghost" onClick={() => setSlot(undefined)}>
                  {tr('기본으로 되돌리기')}
                </button>
              )}
              {has && it.pos && (
                <button className="ghost" onClick={() => startEdit(it.id)}>
                  {tr('배치 옮기기')}
                </button>
              )}
            </section>
          )}
        </div>

        <div className="shop-tabs">
          <div className="tabs" role="tablist">
            {KINDS.map((k) => {
              const list = ITEMS.filter((i) => i.kind === k)
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => pickTab(k)}
                >
                  {kindTab(k)}
                  <small>
                    {list.filter((i) => owned.includes(i.id)).length}/
                    {list.length}
                  </small>
                </button>
              )
            })}
          </div>
          <p className="muted">{kindDesc(tab)}</p>
        </div>

        <div className="shop-cards">
          {cards.map((c) => {
            const mine = owned.includes(c.id)
            const t = tierOf(c.price)
            return (
              <button
                key={c.id}
                className={c.id === sel ? 'shop-card on' : 'shop-card'}
                aria-pressed={c.id === sel}
                onClick={() => setSel(c.id)}
              >
                <span className={t === 3 ? 'card-art legend' : 'card-art'}>
                  <CardArt it={c} />
                  <span className={`tier t${t}`}>{tierLabel(t)}</span>
                  {mine && <span className="owned-tag">{tr('보유')}</span>}
                </span>
                <span className="card-body">
                  <b>{tr(c.name)}</b>
                  <small className="win">▲ {effectText(c)}</small>
                  {mine ? (
                    <small className="win">
                      {ownedStatus(c, isApplied(c))}
                    </small>
                  ) : (
                    <span
                      className={
                        cash < c.price ? 'card-price short' : 'card-price'
                      }
                    >
                      <Bill />
                      {money(c.price)}
                      {cash < c.price && <em>{tr('부족')}</em>}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </dialog>
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
    <div className="shelf" aria-label={tr('팀 우승 트로피 {n}개', { n })}>
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

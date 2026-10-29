import { useEffect, useRef } from 'react'
import { tr } from '../i18n'
import { POSITION_LABELS } from '../engine/player'
import { hallArtURL } from './hallArt'
import { type HallRow, statText } from './hallApi'
import { PixelPlayer } from './pixelPlayer'
import { teamKit } from './pose'

// 랭킹에서 선수를 누르면 여는 상세 기록. 베스트 5에서 열면 베스트 5 안에서, 목록에서 열면 목록 안에서 넘긴다.
// mine: 이 브라우저의 기록. 시즌 수·전체 순위가 없어 4칸만 보여 준다
export function HallPlayerDialog({
  list,
  index,
  inBest,
  bestIds,
  leaderId,
  sortLabel,
  total,
  mine = false,
  onStep,
  onClose,
}: {
  list: HallRow[]
  index: number
  inBest: boolean
  bestIds: Set<string>
  leaderId?: string
  sortLabel: string
  total: number
  mine?: boolean
  onStep: (d: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  // 팝업 안에서 누른 채 바깥으로 끌고 나가 뗀 클릭은 닫지 않는다
  const downOutside = useRef(false)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  const close = () => ref.current?.close()
  const p = list[index]
  const best = bestIds.has(p.id)
  const pos = tr(POSITION_LABELS[p.position])
  const pct = Math.max(0.1, Math.round((p.rank / total) * 1000) / 10)
  const stats = [
    [tr('최고 OVR'), String(p.peakOvr)],
    [tr('파이널 MVP'), tr('{n}회', { n: p.fmvp })],
    [tr('트로피'), tr('{n}개', { n: p.trophies })],
    ...(mine ? [] : [[tr('시즌 수'), String(p.seasons)]]),
    [tr('은퇴'), tr('{year}년', { year: p.retiredYear })],
    ...(mine ? [] : [[tr('전체 순위'), tr('상위 {n}%', { n: pct }), 'long']]),
  ]
  // 통산 기록: 정렬 다양화 전 기록에는 없어 있을 때만
  const career = (
    [
      ['earnings', tr('통산 수입')],
      ['minutes', tr('통산 출전')],
      ['pts', tr('통산 득점')],
      ['ast', tr('통산 어시스트')],
    ] as const
  ).flatMap(([k, label]) => {
    const v = statText(k, p)
    return v ? [[label, v]] : []
  })
  return (
    <dialog
      ref={ref}
      className={best ? 'modal hall-pop best' : 'modal hall-pop'}
      aria-label={tr('{name} 상세 기록', { name: p.name })}
      onClose={() => setTimeout(onClose, 150)}
      onPointerDown={(e) =>
        (downOutside.current = e.target === e.currentTarget)
      }
      onClick={(e) => {
        if (downOutside.current && e.target === e.currentTarget) close()
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onStep(1)
        if (e.key === 'ArrowLeft') onStep(-1)
      }}
    >
      <div className="hall-pop-stage">
        {best && (
          <>
            <img className="px corner cTL" src={hallArtURL('corner')} alt="" />
            <img
              className="px corner cTR"
              src={hallArtURL('corner', 'R')}
              alt=""
            />
          </>
        )}
        <button className="hall-pop-x" aria-label={tr('닫기')} onClick={close}>
          ✕
        </button>
        {best ? (
          <span className="ribbon">BEST 5 · {pos}</span>
        ) : (
          <span className="hall-pop-chip">
            #{p.rank} · {sortLabel}
          </span>
        )}
        <div className="hall-pop-hero">
          {best && (
            <img className="px laurel" src={hallArtURL('laurel', 'L')} alt="" />
          )}
          <div className="hall-pop-figure">
            {p.id === leaderId && (
              <img className="px crown" src={hallArtURL('crown')} alt="" />
            )}
            <img className="px pedestal" src={hallArtURL('pedestal')} alt="" />
            <span className="hall-pop-sprite">
              <PixelPlayer
                pose={p.fmvp > 0 ? 'trophy' : 'idle'}
                kit={teamKit(p.name)}
                look={p.look}
                scale={3}
              />
            </span>
          </div>
          {best && (
            <img className="px laurel" src={hallArtURL('laurel', 'R')} alt="" />
          )}
        </div>
      </div>
      <div className="hall-pop-body">
        <div className="hall-pop-name">
          <h2>{p.name}</h2>
          <span>
            {p.position} · {pos} · {sortLabel} {tr('{n}위', { n: p.rank })}
          </span>
        </div>
        <dl className={mine ? 'hall-pop-stats two' : 'hall-pop-stats'}>
          {stats.map(([k, v, cls]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className={cls}>{v}</dd>
            </div>
          ))}
        </dl>
        {career.length > 0 && (
          <dl className="hall-pop-stats two">
            {career.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="row between nowrap">
          <button className="ghost" onClick={() => onStep(-1)}>
            {tr('◀ 이전')}
          </button>
          <span className="hall-pop-idx">
            {inBest && `${tr('베스트 5')} · `}
            {index + 1} / {list.length}
          </span>
          <button className="ghost" onClick={() => onStep(1)}>
            {tr('다음 ▶')}
          </button>
        </div>
      </div>
    </dialog>
  )
}

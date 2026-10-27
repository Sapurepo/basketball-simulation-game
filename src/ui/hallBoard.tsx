import { useEffect, useState } from 'react'
import type { HallEntry } from '../engine/save'
import type { Look, Position } from '../engine/types'
import { fetchHall, type HallSort, SORTS } from './hallApi'
import { PixelPlayer } from './pixelPlayer'
import { teamKit } from './pose'
import { iconURL } from './sprite'

// 랭킹 한 줄. 랜딩 미리보기와 랭킹 화면이 함께 쓴다 (detail 은 트로피·시즌·은퇴 연도)
export function HallItem({
  rank,
  name,
  position,
  look,
  peakOvr,
  fmvp,
  detail,
}: {
  rank: number
  name: string
  position: Position
  look?: Look
  peakOvr: number
  fmvp: number
  detail?: { trophies: number; seasons: number; retiredYear: number }
}) {
  return (
    <li>
      <b className="rank">{rank}</b>
      <PixelPlayer pose="idle" kit={teamKit(name)} look={look} scale={1} />
      <span className="grow">
        {name} <small className="muted">{position}</small>
      </span>
      {detail && (
        <span className="hall-detail muted">
          <span>트로피 {detail.trophies}</span>
          <span>{detail.seasons}시즌</span>
          <span>{detail.retiredYear}년 은퇴</span>
        </span>
      )}
      <span className="row nowrap">
        <img
          className="px"
          src={iconURL('trophy')}
          alt="NBA 파이널 MVP"
          title="NBA 파이널 MVP"
        />
        {fmvp}
      </span>
      <b>OVR {peakOvr}</b>
    </li>
  )
}

const PREVIEW = 5

// 랜딩의 명예의 전당: 전체 상위 5명 미리보기와 이 브라우저의 기록
export function HallBoard({
  mine,
  onOpenRanking,
}: {
  mine: HallEntry[]
  onOpenRanking: () => void
}) {
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [sort, setSort] = useState<HallSort>('ovr')
  const [all, setAll] = useState<Awaited<ReturnType<typeof fetchHall>>>()
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetchHall(sort, 0, PREVIEW)
      .then((d) => alive && (setAll(d), setError(false)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [sort])

  const mineSorted = [...mine].sort((a, b) =>
    sort === 'fmvp'
      ? (b.fmvp ?? 0) - (a.fmvp ?? 0) || b.peakOvr - a.peakOvr
      : b.peakOvr - a.peakOvr || (b.fmvp ?? 0) - (a.fmvp ?? 0),
  )

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>명예의 전당</h2>
        <div className="tabs" role="tablist">
          {(
            [
              ['all', '전체'],
              ['mine', '내 기록'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="chips">
        {SORTS.map(([id, label]) => (
          <button
            key={id}
            className={sort === id ? 'chip on' : 'chip'}
            onClick={() => setSort(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'all' ? (
        error ? (
          <p className="muted">
            지금은 전체 기록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
          </p>
        ) : !all ? (
          <p className="muted">불러오는 중…</p>
        ) : all.rows.length ? (
          <ol className="hall">
            {all.rows.map((r) => (
              <HallItem key={r.id} {...r} />
            ))}
          </ol>
        ) : (
          <p className="muted">
            아직 등록된 선수가 없어요. 은퇴하면 첫 번째로 이름을 올려 보세요.
          </p>
        )
      ) : mineSorted.length ? (
        <ol className="hall">
          {mineSorted.map((e, i) => (
            <HallItem
              key={e.id ?? `${e.name}-${e.year}-${i}`}
              rank={i + 1}
              name={e.name}
              position={e.position}
              look={e.look}
              peakOvr={e.peakOvr}
              fmvp={e.fmvp ?? 0}
            />
          ))}
        </ol>
      ) : (
        <p className="muted">
          아직 기록이 없어요. 커리어를 마치고 은퇴하면 이 브라우저에 남습니다.
        </p>
      )}
      {tab === 'all' && (
        <button className="ghost" onClick={onOpenRanking}>
          전체 랭킹 보기{all ? ` (${all.total}명)` : ''}
        </button>
      )}
    </section>
  )
}

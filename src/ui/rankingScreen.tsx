import { useEffect, useState } from 'react'
import { HALL_TOP } from '../engine/hallEntry'
import { BestFive } from './bestFive'
import { fetchHall, type HallSort, SORTS } from './hallApi'
import { HallItem } from './hallBoard'

// 주소 해시(#ranking?sort=fmvp)에 정렬을 남겨 새로고침해도 같은 정렬로 연다
const readSort = (): HallSort =>
  new URLSearchParams(location.hash.split('?')[1] ?? '').get('sort') === 'fmvp'
    ? 'fmvp'
    : 'ovr'

type Data = Awaited<ReturnType<typeof fetchHall>>

// 공용 명예의 전당 랭킹: 포지션별 베스트 5와 상위 100명
export function RankingScreen({ onBack }: { onBack: () => void }) {
  const [sort, setSort] = useState(readSort)
  const [data, setData] = useState<{ top: Data; best: Data }>()
  const [error, setError] = useState(false)

  useEffect(() => {
    history.replaceState(null, '', `#ranking?sort=${sort}`)
    let alive = true
    Promise.all([fetchHall(sort), fetchHall(sort, { best: true })])
      .then(([top, best]) => alive && (setData({ top, best }), setError(false)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [sort])

  return (
    <main className="ranking">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              명예의 전당{data ? ` (총 ${data.top.total}명)` : ''}
            </p>
            <h1>전체 랭킹</h1>
          </div>
          <button className="ghost" onClick={onBack}>
            뒤로
          </button>
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

        {error ? (
          <p className="muted">
            랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : !data ? (
          <p className="muted">불러오는 중…</p>
        ) : data.top.rows.length ? (
          <>
            <h2>베스트 5</h2>
            <p className="muted">
              포지션마다{' '}
              {sort === 'fmvp'
                ? '파이널 MVP를 가장 많이 받은'
                : '최고 OVR이 가장 높은'}{' '}
              선수로 짠 라인업이에요.
            </p>
            <BestFive rows={data.best.rows} />
            <h2>상위 {HALL_TOP}명</h2>
            <ol className="hall">
              {data.top.rows.map((r) => (
                <HallItem key={r.id} {...r} detail={r} />
              ))}
            </ol>
          </>
        ) : (
          <p className="muted">
            아직 등록된 선수가 없어요. 은퇴하면 첫 번째로 이름을 올려 보세요.
          </p>
        )}
      </section>
    </main>
  )
}

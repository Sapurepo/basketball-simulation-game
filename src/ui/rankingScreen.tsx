import { useEffect, useState } from 'react'
import { tr } from '../i18n'
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
  // 새로고침 버튼: 값을 올리면 같은 정렬로 다시 불러온다
  const [tick, setTick] = useState(0)
  const refresh = () => {
    setData(undefined)
    setTick((t) => t + 1)
  }

  useEffect(() => {
    history.replaceState(null, '', `#ranking?sort=${sort}`)
    let alive = true
    Promise.all([fetchHall(sort), fetchHall(sort, { best: true })])
      .then(([top, best]) => alive && (setData({ top, best }), setError(false)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [sort, tick])

  return (
    <main className="ranking">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              {tr('명예의 전당')}
              {data ? ` ${tr('(총 {n}명)', { n: data.top.total })}` : ''}
            </p>
            <h1>{tr('전체 랭킹')}</h1>
          </div>
          <div className="row">
            <button
              className="ghost"
              onClick={refresh}
              disabled={!data && !error}
            >
              {tr('새로고침')}
            </button>
            <button className="ghost" onClick={onBack}>
              {tr('뒤로')}
            </button>
          </div>
        </div>
        <div className="chips">
          {SORTS.map(([id, label]) => (
            <button
              key={id}
              className={sort === id ? 'chip on' : 'chip'}
              onClick={() => setSort(id)}
            >
              {tr(label)}
            </button>
          ))}
        </div>

        {error ? (
          <p className="muted">
            {tr('랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')}
          </p>
        ) : !data ? (
          <p className="muted">{tr('불러오는 중…')}</p>
        ) : data.top.rows.length ? (
          <>
            <h2>{tr('베스트 5')}</h2>
            <p className="muted">
              {tr(
                sort === 'fmvp'
                  ? '포지션마다 파이널 MVP를 가장 많이 받은 선수로 짠 라인업이에요.'
                  : '포지션마다 최고 OVR이 가장 높은 선수로 짠 라인업이에요.',
              )}
            </p>
            <BestFive rows={data.best.rows} />
            <h2>{tr('상위 {n}명', { n: HALL_TOP })}</h2>
            <ol className="hall">
              {data.top.rows.map((r) => (
                <HallItem key={r.id} {...r} detail={r} />
              ))}
            </ol>
          </>
        ) : (
          <p className="muted">
            {tr(
              '아직 등록된 선수가 없어요. 은퇴하면 첫 번째로 이름을 올려 보세요.',
            )}
          </p>
        )}
      </section>
    </main>
  )
}

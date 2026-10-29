import { useEffect, useState } from 'react'
import { tr } from '../i18n'
import { HALL_TOP } from '../engine/hallEntry'
import { BestFive } from './bestFive'
import {
  BEST_ORDER,
  fetchHall,
  type HallRow,
  type HallSort,
  SORTS,
} from './hallApi'
import { HallItem } from './hallBoard'
import { HallPlayerDialog } from './hallPlayerDialog'

// 주소 해시(#ranking?sort=fmvp)에 정렬을 남겨 새로고침해도 같은 정렬로 연다
const readSort = (): HallSort =>
  new URLSearchParams(location.hash.split('?')[1] ?? '').get('sort') === 'fmvp'
    ? 'fmvp'
    : 'ovr'

type Data = Awaited<ReturnType<typeof fetchHall>>

// 공용 명예의 전당 랭킹: 포지션별 베스트 5와 상위 100명, 선수를 누르면 상세 팝업
export function RankingScreen({ onBack }: { onBack: () => void }) {
  const [sort, setSort] = useState(readSort)
  const [data, setData] = useState<{ top: Data; best: Data }>()
  const [error, setError] = useState(false)
  // 열린 상세 팝업: 베스트 5 안에서 넘기는지, 몇 번째인지
  const [sel, setSel] = useState<{ inBest: boolean; i: number }>()
  // 새로고침 버튼: 값을 올리면 같은 정렬로 다시 불러온다
  const [tick, setTick] = useState(0)
  // 다시 불러오는 동안은 이전 오류 문구 대신 '불러오는 중…'
  const refresh = () => {
    setData(undefined)
    setError(false)
    setTick((t) => t + 1)
  }
  // 정렬을 바꾸면 이전 정렬의 목록을 지운다. 남겨 두면 새 정렬 라벨이 붙은 옛 순위를 눌러 팝업이 열린다
  const pickSort = (id: HallSort) => {
    if (id === sort) return
    setData(undefined)
    setError(false)
    setSel(undefined)
    setSort(id)
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

  const sortLabel = tr(SORTS.find(([id]) => id === sort)![1])
  const best = BEST_ORDER.flat()
    .map((pos) => data?.best.rows.find((r) => r.position === pos))
    .filter((r): r is HallRow => !!r)
  const bestIds = new Set(best.map((r) => r.id))
  const leaderId = best.reduce<HallRow | undefined>(
    (a, r) => (!a || r.rank < a.rank ? r : a),
    undefined,
  )?.id
  const list = sel ? (sel.inBest ? best : (data?.top.rows ?? [])) : []

  return (
    <main className="ranking">
      <header className="ranking-head">
        <h1>
          {tr('명예의 전당')} · {tr('전체 랭킹')}
        </h1>
        <div className="ranking-tools">
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
          <div className="chips">
            {SORTS.map(([id, label]) => (
              <button
                key={id}
                className={sort === id ? 'chip on' : 'chip'}
                onClick={() => pickSort(id)}
              >
                {tr(label)}
              </button>
            ))}
          </div>
          {/* 불러오는 동안에도 줄을 비워 둔다. 줄이 빠지면 헤더 높이가 줄어 아래 목록이 들썩인다 */}
          <small>
            {data?.top.total
              ? tr('총 {n}명 등록 · 선수를 누르면 상세 기록이 열려요', {
                  n: data.top.total.toLocaleString(),
                })
              : '\u00a0'}
          </small>
        </div>
      </header>

      {error ? (
        <p className="ranking-note">
          {tr('랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')}
        </p>
      ) : !data ? (
        <p className="ranking-note">{tr('불러오는 중…')}</p>
      ) : data.top.rows.length ? (
        <>
          <BestFive
            rows={best}
            desc={tr(
              sort === 'fmvp'
                ? '포지션마다 파이널 MVP를 가장 많이 받은 선수로 짠 라인업이에요.'
                : '포지션마다 최고 OVR이 가장 높은 선수로 짠 라인업이에요.',
            )}
            onOpen={(r) => setSel({ inBest: true, i: best.indexOf(r) })}
          />
          <section className="hall-top">
            <div className="hall-top-bar">
              <div className="row nowrap">
                <span className="hall-top-badge">TOP {HALL_TOP}</span>
                <h2>{tr('상위 {n}명', { n: HALL_TOP })}</h2>
              </div>
              <small>{sortLabel}</small>
            </div>
            <ol>
              {data.top.rows.map((r, i) => (
                <HallItem
                  key={r.id}
                  {...r}
                  best={bestIds.has(r.id)}
                  detail={[
                    tr('트로피 {n}', { n: r.trophies }),
                    tr('{n}시즌', { n: r.seasons }),
                    tr('{year}년 은퇴', { year: r.retiredYear }),
                  ]}
                  onOpen={() => setSel({ inBest: false, i })}
                />
              ))}
            </ol>
          </section>
        </>
      ) : (
        <p className="ranking-note">
          {tr(
            '아직 등록된 선수가 없어요. 은퇴하면 첫 번째로 이름을 올려 보세요.',
          )}
        </p>
      )}

      {sel && data && list[sel.i] && (
        <HallPlayerDialog
          list={list}
          index={sel.i}
          inBest={sel.inBest}
          bestIds={bestIds}
          leaderId={leaderId}
          sortLabel={sortLabel}
          total={data.top.total}
          onStep={(d) =>
            setSel({ ...sel, i: (sel.i + d + list.length) % list.length })
          }
          onClose={() => setSel(undefined)}
        />
      )}
    </main>
  )
}

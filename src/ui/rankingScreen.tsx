import { useEffect, useState } from 'react'
import { tr } from '../i18n'
import { HALL_TOP } from '../engine/hallEntry'
import { BestFive } from './bestFive'
import {
  BEST_ORDER,
  fetchHall,
  type HallLeague,
  type HallPeriod,
  type HallRow,
  type HallSort,
  isHallLeague,
  isHallPeriod,
  isHallSort,
  LEAGUES,
  PERIODS,
  rowDetail,
  showTitles,
  SORTS,
  sortsFor,
} from './hallApi'
import { HallItem } from './hallBoard'
import { HallPlayerDialog } from './hallPlayerDialog'

// 주소(/ranking?sort=fmvp&league=NBA&period=week)에 정렬·리그·기간을 남겨 새로고침해도 같은 화면으로 연다. #ranking?sort= 는 예전 주소
const readQuery = () =>
  new URLSearchParams(location.search || (location.hash.split('?')[1] ?? ''))
const readSort = (): HallSort => {
  const v = readQuery().get('sort')
  return isHallSort(v) ? v : 'ovr'
}
const readLeague = (): HallLeague => {
  const v = readQuery().get('league')
  return isHallLeague(v) ? v : 'all'
}
const readPeriod = (): HallPeriod => {
  const v = readQuery().get('period')
  return isHallPeriod(v) ? v : 'all'
}

type Data = Awaited<ReturnType<typeof fetchHall>>

// 공용 명예의 전당 랭킹: 포지션별 베스트 5와 상위 100명, 선수를 누르면 상세 팝업
export function RankingScreen({ onBack }: { onBack: () => void }) {
  const [sort, setSort] = useState(readSort)
  const [league, setLeague] = useState(readLeague)
  const [period, setPeriod] = useState(readPeriod)
  const [data, setData] = useState<{ top: Data; best: Data }>()
  const [error, setError] = useState(false)
  // 열린 상세 팝업: 베스트 5 안에서 넘기는지, 몇 번째인지
  const [sel, setSel] = useState<{ inBest: boolean; i: number }>()
  // 새로고침 버튼: 값을 올리면 같은 정렬로 다시 불러온다
  const [tick, setTick] = useState(0)
  // 마지막으로 불러온 시각. 1분마다 다시 그려 'n분 전 갱신'을 맞춘다
  const [loadedAt, setLoadedAt] = useState<number>()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  // 다시 불러오는 동안은 이전 오류 문구 대신 '불러오는 중…'
  const refresh = () => {
    setData(undefined)
    setError(false)
    setTick((t) => t + 1)
  }
  // 정렬·리그·기간을 바꾸면 이전 목록을 지운다. 남겨 두면 새 정렬 라벨이 붙은 옛 순위를 눌러 팝업이 열린다
  const pick = (next: {
    sort?: HallSort
    league?: HallLeague
    period?: HallPeriod
  }) => {
    const l = next.league ?? league
    // 리그를 바꿔 지금 정렬 칩이 사라지면(파이널 MVP ↔ KBL 우승) 최고 OVR 로
    const s0 = next.sort ?? sort
    const s = sortsFor(l).some(([id]) => id === s0) ? s0 : 'ovr'
    const p = next.period ?? period
    if (s === sort && l === league && p === period) return
    setData(undefined)
    setError(false)
    setSel(undefined)
    setSort(s)
    setLeague(l)
    setPeriod(p)
  }

  useEffect(() => {
    history.replaceState(
      null,
      '',
      `/ranking?sort=${sort}${league === 'all' ? '' : `&league=${league}`}${period === 'all' ? '' : `&period=${period}`}`,
    )
    let alive = true
    Promise.all([
      fetchHall(sort, { league, period }),
      fetchHall(sort, { best: true, league, period }),
    ])
      .then(
        ([top, best]) =>
          alive &&
          (setData({ top, best }), setError(false), setLoadedAt(Date.now())),
      )
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [sort, league, period, tick])

  const sortLabel = tr(SORTS.find(([id]) => id === sort)![1])
  const scope = league === 'all' ? tr('전체 리그') : league
  const periodLabel = tr(PERIODS.find(([id]) => id === period)![1])
  const ago =
    loadedAt && Math.floor((Math.max(now, loadedAt) - loadedAt) / 60_000)
  const updated =
    loadedAt === undefined
      ? ''
      : ago
        ? tr('{n}분 전 갱신', { n: ago })
        : tr('방금 갱신')
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
        <button className="ghost ranking-back" onClick={onBack}>
          ◀ {tr('뒤로')}
        </button>
        {/* 불러오는 동안에도 자리를 비워 둔다. 빠지면 제목 줄이 들썩인다 */}
        <div className="ranking-title">
          <h1>{tr('명예의 전당')}</h1>
          <span className="ranking-count">
            {data?.top.total
              ? tr('총 {n}명 등록', { n: data.top.total.toLocaleString() })
              : '\u00a0'}
          </span>
        </div>
      </header>

      {/* 스크롤해도 위에 붙어 있는 보기 설정 */}
      <div
        className="ranking-bar"
        role="group"
        aria-label={tr('랭킹 보기 설정')}
      >
        <div className="ranking-field">
          <span id="ranking-league">{tr('리그')}</span>
          <div
            className="chips"
            role="radiogroup"
            aria-labelledby="ranking-league"
          >
            {LEAGUES.map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={league === id}
                className={league === id ? 'chip on' : 'chip'}
                onClick={() => pick({ league: id })}
              >
                {tr(label)}
              </button>
            ))}
          </div>
        </div>
        <div className="ranking-field">
          <span id="ranking-period">{tr('기간')}</span>
          <div
            className="chips"
            role="radiogroup"
            aria-labelledby="ranking-period"
          >
            {PERIODS.map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={period === id}
                className={period === id ? 'chip on' : 'chip'}
                onClick={() => pick({ period: id })}
              >
                {tr(label)}
              </button>
            ))}
          </div>
        </div>
        <div className="ranking-field">
          <span id="ranking-sort">{tr('정렬 기준')}</span>
          <div
            className="chips"
            role="radiogroup"
            aria-labelledby="ranking-sort"
          >
            {sortsFor(league).map(([id, label, chip]) => (
              <button
                key={id}
                aria-label={tr(label)}
                role="radio"
                aria-checked={sort === id}
                className={sort === id ? 'chip on' : 'chip'}
                onClick={() => pick({ sort: id })}
              >
                {tr(chip)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ranking-meta">
        <b>
          {scope} · {periodLabel} · {sortLabel}
        </b>
        <div className="row nowrap">
          <span>{updated}</span>
          <button
            className="ghost"
            onClick={refresh}
            disabled={!data && !error}
          >
            ↻ {tr('새로고침')}
          </button>
        </div>
      </div>

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
            titles={showTitles(league)}
            desc={
              sort === 'fmvp'
                ? tr(
                    '포지션마다 파이널 MVP를 가장 많이 받은 선수로 짠 라인업이에요.',
                  )
                : sort === 'ovr'
                  ? tr(
                      '포지션마다 최고 OVR이 가장 높은 선수로 짠 라인업이에요.',
                    )
                  : tr(
                      '포지션마다 {label} 기준으로 가장 앞선 선수로 짠 라인업이에요.',
                      { label: sortLabel },
                    )
            }
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
                  titles={showTitles(league)}
                  best={bestIds.has(r.id)}
                  detail={rowDetail(sort, r)}
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

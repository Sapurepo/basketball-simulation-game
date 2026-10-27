import { useEffect, useState } from 'react'
import { HALL_PAGE_SIZE } from '../engine/hallEntry'
import { fetchHall, type HallSort, SORTS } from './hallApi'
import { HallItem } from './hallBoard'

// 주소 해시(#ranking?sort=ovr&page=2)에 정렬·페이지를 남겨 새로고침해도 같은 페이지를 연다
function readHash(): { sort: HallSort; page: number } {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  return {
    sort: q.get('sort') === 'fmvp' ? 'fmvp' : 'ovr',
    page: Math.max(0, (Number(q.get('page')) || 1) - 1),
  }
}

// 현재 페이지 주변만 남기고 나머지는 … 로 줄인 페이지 번호 (0부터)
function pageList(page: number, pages: number): (number | '…')[] {
  const keep = new Set([0, pages - 1, page - 1, page, page + 1])
  const out: (number | '…')[] = []
  for (let i = 0; i < pages; i++) {
    if (keep.has(i)) out.push(i)
    else if (out.at(-1) !== '…') out.push('…')
  }
  return out
}

// 마지막 페이지는 실제 인원까지만 (101–120)
const range = (p: number, total: number) =>
  `${p * HALL_PAGE_SIZE + 1}–${Math.min(total, (p + 1) * HALL_PAGE_SIZE)}`

// 공용 명예의 전당 전체 랭킹: 50명 단위 페이지
export function RankingScreen({ onBack }: { onBack: () => void }) {
  const [{ sort, page }, setView] = useState(readHash)
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHall>>>()
  const [error, setError] = useState(false)

  useEffect(() => {
    history.replaceState(null, '', `#ranking?sort=${sort}&page=${page + 1}`)
    let alive = true
    fetchHall(sort, page)
      .then((d) => alive && (setData(d), setError(false)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [sort, page])

  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / HALL_PAGE_SIZE))
  const go = (p: number) => {
    setView({ sort, page: p })
    // 앱 박스 안에서만 스크롤하므로 페이지를 바꾸면 목록 맨 위로
    document.querySelector('.screen')?.scrollTo(0, 0)
  }

  return (
    <main className="ranking">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">
              명예의 전당{data ? ` (총 ${data.total}명)` : ''}
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
              onClick={() => setView({ sort: id, page: 0 })}
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
        ) : data.rows.length ? (
          <ol className="hall">
            {data.rows.map((r) => (
              <HallItem key={r.id} {...r} detail={r} />
            ))}
          </ol>
        ) : (
          <p className="muted">
            {data.total
              ? '이 페이지에는 선수가 없어요.'
              : '아직 등록된 선수가 없어요. 은퇴하면 첫 번째로 이름을 올려 보세요.'}
          </p>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="랭킹 페이지">
            <button
              className="ghost"
              disabled={page === 0}
              onClick={() => go(page - 1)}
            >
              이전
            </button>
            {pageList(page, pages).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="muted">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={p === page ? 'chip on' : 'chip'}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => go(p)}
                >
                  {range(p, data?.total ?? 0)}
                </button>
              ),
            )}
            <button
              className="ghost"
              disabled={page >= pages - 1}
              onClick={() => go(page + 1)}
            >
              다음
            </button>
          </nav>
        )}
      </section>
    </main>
  )
}

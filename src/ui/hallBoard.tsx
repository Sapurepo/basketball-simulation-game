import { Fragment, useEffect, useState } from 'react'
import type { HallEntry } from '../engine/save'
import type { Look, Position } from '../engine/types'
import { tr } from '../i18n'
import { hallArtURL, type Medal } from './hallArt'
import {
  compareRows,
  fetchHall,
  type HallRow,
  type HallSort,
  rowDetail,
  SORTS,
} from './hallApi'
import { HallPlayerDialog } from './hallPlayerDialog'
import { PixelPlayer } from './pixelPlayer'
import { teamKit } from './pose'
import { iconURL } from './sprite'

const MEDALS: Medal[] = ['g', 's', 'b']

// 명예의 전당 한 줄. 랭킹 화면 상위 100명과 랜딩 미리보기가 함께 쓴다. 누르면 상세 팝업
export function HallItem({
  rank,
  name,
  position,
  look,
  peakOvr,
  fmvp,
  kblTitles,
  titles = false,
  best,
  detail,
  onOpen,
}: {
  rank: number
  name: string
  position: Position
  look?: Look
  peakOvr: number
  fmvp: number
  kblTitles?: number | null
  // 트로피 칸에 파이널 MVP 대신 KBL 챔피언결정전 우승을 보여 준다 (KBL 필터)
  titles?: boolean
  best?: boolean
  // 이름 아래 보조 정보(트로피·시즌·은퇴 연도). 항목 하나가 두 줄로 갈라지지 않게 항목 단위로 줄바꿈
  detail: string[]
  onOpen: () => void
}) {
  return (
    <li className={rank <= 3 ? 'podium' : undefined}>
      <button onClick={onOpen}>
        <span className="hall-top-rank">
          {rank <= 3 ? (
            <img
              className="px"
              src={hallArtURL('medal', MEDALS[rank - 1])}
              alt={tr('{n}위', { n: rank })}
            />
          ) : (
            rank
          )}
        </span>
        <span className="hall-top-face">
          <PixelPlayer
            pose="idle"
            kit={teamKit(name)}
            look={look}
            scale={4 / 3}
          />
        </span>
        <span className="hall-top-name">
          <span className="row">
            <b>{name}</b>
            <span className="tag">{position}</span>
            {best && <span className="tag gold">BEST 5</span>}
          </span>
          <small>
            {detail.map((d, i) => (
              <Fragment key={d}>
                {i > 0 && ' · '}
                <span>{d}</span>
              </Fragment>
            ))}
          </small>
        </span>
        <span className="hall-top-fmvp">
          <img
            className="px"
            src={iconURL('trophy')}
            alt={tr(titles ? 'KBL 챔피언결정전 우승' : 'NBA 파이널 MVP')}
            title={tr(titles ? 'KBL 챔피언결정전 우승' : 'NBA 파이널 MVP')}
          />
          {titles ? (kblTitles ?? '-') : fmvp}
        </span>
        <span className="hall-top-ovr">
          OVR <b>{peakOvr}</b>
        </span>
      </button>
    </li>
  )
}

const PREVIEW = 5

// 랜딩의 명예의 전당: 오늘(KST) 등록된 상위 5명 미리보기와 이 브라우저의 기록
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
  // 열린 상세 팝업: 지금 탭 목록의 몇 번째인지
  const [sel, setSel] = useState<number>()

  useEffect(() => {
    let alive = true
    fetchHall(sort, { size: PREVIEW, period: 'day' })
      .then((d) => alive && (setAll(d), setError(false)))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [sort])

  // 정렬을 바꾸면 이전 정렬의 목록을 지운다 (새 정렬 라벨이 붙은 옛 순위를 누르지 않게)
  const pickSort = (id: HallSort) => {
    if (id === sort) return
    setAll(undefined)
    setError(false)
    setSort(id)
  }

  const sortLabel = tr(SORTS.find(([id]) => id === sort)![1])
  // 내 기록을 상세 팝업이 받는 모양으로. 순위는 이 브라우저 안에서, 시즌 수는 기록에 없다
  const mineRows: HallRow[] = mine
    .map((e, i): HallRow => ({
      id: e.id ?? `${e.name}-${e.year}-${i}`,
      rank: 0,
      name: e.name,
      position: e.position,
      look: e.look,
      peakOvr: e.peakOvr,
      fmvp: e.fmvp ?? 0,
      trophies: e.trophies,
      seasons: 0,
      retiredYear: e.year,
      kblTitles: e.kblTitles ?? null,
      earnings: e.earnings ?? null,
      minutes: e.minutes ?? null,
      pts: e.pts ?? null,
      ast: e.ast ?? null,
    }))
    .sort(compareRows(sort))
    .map((r, i) => ({ ...r, rank: i + 1 }))
  const top = all?.rows ?? []
  // 상위 목록에서 포지션마다 처음 나오는 선수가 그 포지션 1위(베스트 5), 1위가 왕관
  const bestIds = new Set(
    top
      .filter((r, i) => top.findIndex((x) => x.position === r.position) === i)
      .map((r) => r.id),
  )
  const list = tab === 'all' ? top : mineRows

  return (
    <section className="hall-top hall-board">
      <div className="hall-top-bar">
        <div className="ranking-title">
          <h2>{tr('명예의 전당')}</h2>
          {tab === 'all' && !!all?.total && (
            <span className="ranking-count">
              {tr('오늘 {n}명 등록', { n: all.total.toLocaleString() })}
            </span>
          )}
        </div>
        <div className="tabs" role="tablist">
          {(
            [
              ['all', '오늘'],
              ['mine', '내 기록'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {tr(label)}
            </button>
          ))}
        </div>
      </div>
      <div className="ranking-field">
        <span id="hall-board-sort">{tr('정렬 기준')}</span>
        <div
          className="chips"
          role="radiogroup"
          aria-labelledby="hall-board-sort"
        >
          {SORTS.map(([id, label, chip]) => (
            <button
              key={id}
              aria-label={tr(label)}
              role="radio"
              aria-checked={sort === id}
              className={sort === id ? 'chip on' : 'chip'}
              onClick={() => pickSort(id)}
            >
              {tr(chip)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'all' ? (
        error ? (
          <p className="hall-board-note">
            {tr(
              '지금은 전체 기록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.',
            )}
          </p>
        ) : !all ? (
          <p className="hall-board-note">{tr('불러오는 중…')}</p>
        ) : top.length ? (
          <ol>
            {top.map((r, i) => (
              <HallItem
                key={r.id}
                {...r}
                best={bestIds.has(r.id)}
                detail={rowDetail(sort, r)}
                onOpen={() => setSel(i)}
              />
            ))}
          </ol>
        ) : (
          <p className="hall-board-note">
            {tr(
              '오늘 등록된 선수가 아직 없어요. 은퇴하면 첫 번째로 이름을 올려 보세요.',
            )}
          </p>
        )
      ) : mineRows.length ? (
        <ol>
          {mineRows.map((r, i) => (
            <HallItem
              key={r.id}
              {...r}
              detail={rowDetail(sort, r)}
              onOpen={() => setSel(i)}
            />
          ))}
        </ol>
      ) : (
        <p className="hall-board-note">
          {tr(
            '아직 기록이 없어요. 커리어를 마치고 은퇴하면 이 브라우저에 남습니다.',
          )}
        </p>
      )}
      {tab === 'all' && (
        <button className="primary hall-board-more" onClick={onOpenRanking}>
          {tr('전체 랭킹 보기')}
        </button>
      )}

      {sel !== undefined && list[sel] && (
        <HallPlayerDialog
          list={list}
          index={sel}
          inBest={false}
          bestIds={tab === 'all' ? bestIds : new Set()}
          leaderId={tab === 'all' ? top[0]?.id : undefined}
          sortLabel={tab === 'all' ? sortLabel : tr('내 기록')}
          total={all?.total ?? 0}
          mine={tab === 'mine'}
          onStep={(d) => setSel((sel + d + list.length) % list.length)}
          onClose={() => setSel(undefined)}
        />
      )}
    </section>
  )
}

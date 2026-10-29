import { useEffect, useRef, useState } from 'react'
import type { Cast, GameLog, Look, Play } from '../engine/types'
import { ko, tr, tx } from '../i18n'
import { PixelPlayer } from './pixelPlayer'
import type { Kit, Pose } from './pose'
import { iconURL } from './sprite'
import { TeamLogo } from './teamLogo'
import { WinLoss } from './winLoss'

export interface CastPlayer {
  name: string
  position: string
  look?: Look
  kit: Kit
}

// 경기 중계: 상단 고정 스코어보드 + 슛 시도 → 결과 두 박자 중계 + 라이브 박스스코어
export function GameCast({ game, me }: { game: GameLog; me: CastPlayer }) {
  if (!game.cast) return <LegacyCast game={game} />
  return <LiveCast game={game} cast={game.cast} me={me} />
}

// 한 줄의 재생 길이(ms, 1x)
const BEAT = 1600
const MULTS = [1, 2, 4]
// 내 선수의 슛 장면, 내 선수의 모든 장면
const SHOTS = new Set(['made2', 'miss2', 'made3', 'miss3', 'ft'])
const MINE = new Set([...SHOTS, 'reb', 'ast', 'stl', 'blk'])
const SEP = new Set(['start', 'qend', 'end'])
const STAT_KEYS = ['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG', '3P'] as const

interface Line {
  p: Play
  // 시작, 결과가 나오는 시각, 쿼터 종료 뒤 시계를 멈춰 두는 시간
  S: number
  E: number
  F: number
}

// 중계 목록에 나오는 장면마다 재생 시각을 잡는다. 시도 문장이 있으면 결과까지 반 박자 기다린다
function schedule(plays: Play[]) {
  let S = 0
  return plays
    .filter((p) => !p.quiet)
    .map((p): Line => {
      const w =
        (p.kind === 'qend'
          ? 1.9
          : p.kind === 'start'
            ? 1.3
            : p.kind === 'end'
              ? 1.2
              : p.pre
                ? 1.15
                : 1) * (p.hot ? 1.3 : 1)
      const L = {
        p,
        S,
        E: S + (p.pre ? 0.5 : 0.22) * w * BEAT,
        F: p.kind === 'qend' ? 0.65 * w * BEAT : 0,
      }
      S += w * BEAT
      return L
    })
}

const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

function LiveCast({
  game,
  cast,
  me,
}: {
  game: GameLog
  cast: Cast
  me: CastPlayer
}) {
  const [lines] = useState(() => schedule(cast.plays))
  const end = lines[lines.length - 1].E + 100
  // 모션 줄이기: 처음부터 최종 상태
  const [rt, setRt] = useState(() => (reducedMotion() ? end : 0))
  const [playing, setPlaying] = useState(() => !reducedMotion())
  const [mult, setMult] = useState(1)
  const done = rt >= end

  useEffect(() => {
    if (!playing || done) return
    const id = setInterval(
      () => setRt((r) => Math.min(end, r + 100 * mult)),
      100,
    )
    return () => clearInterval(id)
  }, [playing, done, mult, end])

  const qSec = cast.quarterMinutes * 60
  const total = qSec * 4
  const n = lines.length
  let i = -1
  while (i + 1 < n && lines[i + 1].E <= rt) i++
  const cur = i >= 0 ? lines[i] : null
  const nx = lines[i + 1]
  // 경기 시각: 결과가 나온 장면에 머물렀다가 다음 장면 결과 시각까지 흐른다
  let T = 0
  if (cur) {
    const hold = cur.E + cur.F
    T =
      !nx || rt <= hold
        ? cur.p.t
        : cur.p.t +
          (nx.p.t - cur.p.t) *
            Math.min(1, (rt - hold) / Math.max(1, nx.E - hold))
  }
  const frozenQ =
    cur?.p.kind === 'qend' && rt <= cur.E + cur.F
      ? Math.round(cur.p.t / qSec)
      : 0
  const pending = nx?.p.pre && rt >= nx.S ? nx.p : null

  // 경기 시각까지의 점수·쿼터 점수·내 기록, 마지막 득점 장면(+N 팝)
  const qs = { me: [0, 0, 0, 0], op: [0, 0, 0, 0] }
  const box = {
    PTS: 0,
    REB: 0,
    AST: 0,
    STL: 0,
    BLK: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
  }
  const lastPts: { me?: number; op?: number } = {}
  let score = { me: 0, op: 0 }
  let next: Play | undefined
  cast.plays.forEach((p, j) => {
    if (p.t > T) {
      if (!next && !SEP.has(p.kind)) next = p
      return
    }
    score = { me: p.me, op: p.op }
    if (!p.pts) {
      if (p.kind === 'miss2' || p.kind === 'miss3') box.fga++
      if (p.kind === 'miss3') box.tpa++
    } else {
      const side = p.kind === 'opp' ? 'op' : 'me'
      qs[side][Math.min(3, Math.floor(p.t / qSec))] += p.pts
      lastPts[side] = j
    }
    if (p.kind === 'made2' || p.kind === 'made3') {
      box.fgm++
      box.fga++
    }
    if (p.kind === 'made3') {
      box.tpm++
      box.tpa++
    }
    if (SHOTS.has(p.kind)) box.PTS += p.pts
    if (p.kind === 'reb') box.REB++
    if (p.kind === 'ast') box.AST++
    if (p.kind === 'stl') box.STL++
    if (p.kind === 'blk') box.BLK++
  })
  const stats: Record<(typeof STAT_KEYS)[number], string> = {
    PTS: String(box.PTS),
    REB: String(box.REB),
    AST: String(box.AST),
    STL: String(box.STL),
    BLK: String(box.BLK),
    FG: `${box.fgm}/${box.fga}`,
    '3P': `${box.tpm}/${box.tpa}`,
  }

  const q = frozenQ || (T >= total ? 4 : Math.floor(T / qSec) + 1)
  const left = frozenQ || T >= total ? 0 : q * qSec - T
  const clock =
    left >= 60 || left === 0
      ? mmss(left)
      : (Math.floor(left * 10) / 10).toFixed(1)
  const qLabel = done
    ? 'FINAL'
    : frozenQ === 2
      ? tr('하프타임')
      : frozenQ
        ? tr('{q}Q 종료', { q: frozenQ })
        : `${q}Q`
  const clutch =
    !done && q === 4 && left <= 120 && Math.abs(score.me - score.op) <= 5
  const poss = done || !next ? null : next.kind === 'opp' ? 'op' : 'me'
  const playClock = (p: Play) => {
    const pq = Math.min(4, Math.floor(p.t / qSec) + 1)
    return `${pq}Q ${mmss(pq * qSec - p.t)}`
  }

  const win = game.myScore > game.oppScore
  const tag = (p: Play) =>
    p.kind === 'end'
      ? tr(win ? '승' : '패')
      : p.pts
        ? `+${p.pts}`
        : p.kind === 'reb'
          ? 'REBOUND'
          : p.kind === 'stl'
            ? 'STEAL'
            : p.kind === 'blk'
              ? 'BLOCK'
              : 'MISS'
  const good = (p: Play) =>
    p.kind === 'end'
      ? win
      : p.kind !== 'opp' &&
        (p.pts > 0 || ['reb', 'stl', 'blk'].includes(p.kind))
  const teamOf = (p: Play) => (p.kind === 'opp' ? game.opponent : cast.team)

  // 내 선수: 슛을 올라가면 슛 포즈, 좋은 장면 직후엔 환호
  let pose: Pose = 'idle'
  if (pending && SHOTS.has(pending.kind)) pose = 'shoot'
  else if (
    cur &&
    MINE.has(cur.p.kind) &&
    good(cur.p) &&
    rt - cur.E < 1500 * mult
  )
    pose = 'cheer'

  const ball = iconURL('ball')
  const side = (k: 'me' | 'op') => {
    const name = k === 'me' ? cast.team : game.opponent
    const pop = lastPts[k]
    return (
      <div className={`gc-team ${k}`}>
        <TeamLogo name={name} size={44} />
        <div className="gc-team-name">
          <b>
            {tr(name)}
            {poss === k && <img src={ball} alt={tr('공격')} />}
          </b>
        </div>
        <div className="gc-score">
          <span>{score[k]}</span>
          {pop !== undefined && (
            <span key={pop} className="gc-pop" aria-hidden="true">
              +{cast.plays[pop].pts}
            </span>
          )}
        </div>
      </div>
    )
  }

  let tick
  if (pending) {
    tick = (
      <>
        <div className="gc-tick-head">
          <TeamLogo name={teamOf(pending)} size={20} />
          <span className="gc-clock-sm">
            {q}Q {clock}
          </span>
        </div>
        <p className="gc-tick-text" aria-live="polite">
          {tx(pending.pre!)}
          <span className="gc-dots" aria-hidden="true">
            ···
          </span>
        </p>
      </>
    )
  } else if (cur) {
    const p = cur.p
    const sep = p.kind === 'start' || p.kind === 'qend'
    tick = (
      <>
        <div className="gc-tick-head">
          {!sep && <TeamLogo name={teamOf(p)} size={20} />}
          {!sep && p.kind !== 'end' && (
            <span className="gc-clock-sm">{playClock(p)}</span>
          )}
          {!sep && (
            <span className={good(p) ? 'gc-tag hot' : 'gc-tag'}>{tag(p)}</span>
          )}
          {p.hot && <span className="gc-tag gold">{tr('★ 승부처!')}</span>}
        </div>
        <p className="gc-tick-text" aria-live="polite">
          {tx(p.text)}
        </p>
      </>
    )
  } else
    tick = (
      <>
        <div className="gc-tick-head" />
        <p className="gc-tick-text">
          {tr('점프볼을 기다리는 중')}
          <span className="gc-dots" aria-hidden="true">
            ···
          </span>
        </p>
      </>
    )

  const feed = lines.slice(0, i + 1).reverse()
  return (
    <div className="gc">
      <div className="gc-bar">
        <span>{tr(game.label)}</span>
      </div>
      <div className="gc-board">
        <div className="gc-teams">
          {side('me')}
          <div className="gc-mid">
            <div className="row">
              <span className="gc-q">{qLabel}</span>
              {!done && playing && <span className="gc-live">LIVE</span>}
              {!done && !playing && <span className="gc-pause">PAUSE</span>}
            </div>
            <span className="gc-clock">{done ? '0:00' : clock}</span>
            {clutch && <span className="gc-clutch">{tr('★ 승부처')}</span>}
          </div>
          {side('op')}
        </div>
        <div className="gc-segs" aria-hidden="true">
          {[0, 1, 2, 3].map((sq) => (
            <span key={sq}>
              {Array.from({ length: 12 }, (_, k) => (
                <i
                  key={k}
                  className={
                    ((T - sq * qSec) / qSec) * 12 > k ? 'on' : undefined
                  }
                />
              ))}
            </span>
          ))}
        </div>
        <div className="gc-lines">
          <span className="dim">{tr('팀')}</span>
          {[1, 2, 3, 4].map((x) => (
            <span key={x} className={!done && x === q ? 'cur' : 'dim'}>
              {x}Q
            </span>
          ))}
          <span className="dim">T</span>
          {(['me', 'op'] as const).map((k) => (
            <LineRow
              key={k}
              name={tr(k === 'me' ? cast.team : game.opponent)}
              qs={qs[k].map((x, j) => (j < q || done ? String(x) : '–'))}
              total={score[k]}
            />
          ))}
        </div>
      </div>
      <div className="gc-tick">{tick}</div>
      <div className="gc-me">
        <div className="gc-me-id">
          <PixelPlayer pose={pose} kit={me.kit} look={me.look} scale={1.5} />
          <div>
            <b>
              {me.name}{' '}
              <small>
                #{me.look?.num} · {me.position}
              </small>
            </b>
            <small>{tr('오늘의 기록 · 실시간')}</small>
          </div>
        </div>
        <div className="gc-box">
          {STAT_KEYS.map((k) => (
            <span
              key={`${k}-${stats[k]}`}
              className={/^0(\/0)?$/.test(stats[k]) ? undefined : 'flash'}
            >
              <b>{stats[k]}</b>
              <small>{k}</small>
            </span>
          ))}
        </div>
      </div>
      <div className="gc-feed">
        <div className="row between">
          <b>{tr('중계 기록')}</b>
          <small>{tr('{n} / {total} 플레이', { n: i + 1, total: n })}</small>
        </div>
        <ol>
          {feed.map((L, j) =>
            SEP.has(L.p.kind) ? (
              <li key={L.S} className="sep">
                {tx(L.p.text)}
              </li>
            ) : (
              <li
                key={L.S}
                className={j === 0 ? 'new' : L.p.hot ? 'hot' : undefined}
              >
                <small>{playClock(L.p)}</small>
                <TeamLogo name={teamOf(L.p)} size={18} />
                <span className={MINE.has(L.p.kind) ? 'mine' : undefined}>
                  {tx(L.p.text)}
                </span>
                <small>
                  {L.p.me}-{L.p.op}
                </small>
              </li>
            ),
          )}
        </ol>
      </div>
      <div className="gc-ctrl">
        <button
          className="ghost"
          onClick={() => {
            if (done) {
              setRt(0)
              setPlaying(true)
            } else setPlaying(!playing)
          }}
        >
          {done ? tr('다시 보기') : playing ? tr('일시정지') : tr('재생')}
        </button>
        <div className="gc-mults" role="group" aria-label={tr('재생 속도')}>
          {MULTS.map((m) => (
            <button
              key={m}
              aria-pressed={m === mult}
              onClick={() => setMult(m)}
            >
              {m}x
            </button>
          ))}
        </div>
        <button
          className="link"
          onClick={() => {
            if (done) {
              setRt(0)
              setPlaying(true)
            } else setRt(end)
          }}
        >
          {done ? tr('처음부터 다시 보기') : tr('건너뛰기')}
        </button>
      </div>
    </div>
  )
}

function LineRow({
  name,
  qs,
  total,
}: {
  name: string
  qs: string[]
  total: number
}) {
  return (
    <>
      <span className="name">{name}</span>
      {qs.map((x, j) => (
        <span key={j}>{x}</span>
      ))}
      <span className="total">{total}</span>
    </>
  )
}

// 이전 저장의 텍스트 중계: 한 줄씩 재생, 건너뛰기 가능
function LegacyCast({ game }: { game: GameLog }) {
  const pbp = game.pbp ?? []
  const [shown, setShown] = useState(1)
  const listRef = useRef<HTMLOListElement>(null)
  const done = shown >= pbp.length

  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setShown((n) => n + 1), 140)
    return () => clearTimeout(id)
  }, [shown, done])

  useEffect(() => {
    // 페이지가 아닌 중계 목록만 스크롤
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  const win = game.myScore > game.oppScore
  return (
    <div className="cast">
      <div className="row between">
        <div>
          <p className="eyebrow">{tr(game.label)}</p>
          <h3 className="row">
            <WinLoss win={win} />
            vs <TeamLogo name={game.opponent} size={24} /> {tr(game.opponent)}{' '}
            <span className={win ? 'win' : 'loss'}>
              {game.myScore}-{game.oppScore}
            </span>
          </h3>
        </div>
        {!done && (
          <button className="ghost" onClick={() => setShown(pbp.length)}>
            {tr('건너뛰기')}
          </button>
        )}
      </div>
      <ol ref={listRef} className="pbp" aria-live="polite">
        {pbp.slice(0, shown).map((line, i) => {
          const src = ko(line)
          return (
            <li
              key={i}
              className={
                src.startsWith('—')
                  ? 'q'
                  : src.includes('★')
                    ? 'hot'
                    : undefined
              }
            >
              {tx(line)}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

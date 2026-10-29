import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { POSITION_LABELS } from '../engine/player'
import type { GameState } from '../engine/types'
import { tr } from '../i18n'
import { useFrame } from './frame'
import { hallArtURL } from './hallArt'
import { crowdURL, propURL } from './landingArt'
import { PixelPlayer } from './pixelPlayer'
import type { Kit } from './pose'
import { DEFAULT_LOOK, iconURL } from './sprite'

// 수상별 문구: 결승 이름(엔진 문장이라 번역 카탈로그에 있다)·줄임말·금장 명판·전광판
const FMVP_AWARDS = {
  'NBA 파이널 MVP': {
    finals: 'NBA 파이널',
    short: '파이널',
    plate: 'FINALS MVP',
    marquee: 'NBA FINALS',
  },
  'KBL 챔피언결정전 MVP': {
    finals: 'KBL 챔피언결정전',
    short: '챔프전',
    plate: 'CHAMP MVP',
    marquee: 'KBL CHAMPIONSHIP',
  },
} as const
export type FmvpAward = keyof typeof FMVP_AWARDS

// 타임라인(ms): 0~1.8초 암전·두구두구 → 1.8초 플래시와 공개 → 4.5초 끝. 장면별 지연은 app.css 에 있다
const END = 4500
// 시리즈 기록 카운트업: 칸마다 150ms 늦게 시작해 600ms 동안 오른다
const COUNT_AT = 3050

// 폭죽 네 발(가로 %, 세로 px, 지연 s)과 반짝이 여섯 개, 색종이 48장: 인덱스로 고정해 렌더마다 같다
const SPARK_COLORS = [
  ['#f2c14e', '#ffe08a'],
  ['#f07a2b', '#ffb27a'],
  ['#fbf7ee', '#8fd0f5'],
  ['#d8433a', '#f2c14e'],
]
const BURSTS = [
  [17, 62, 2.0],
  [83, 50, 2.35],
  [28, 122, 2.7],
  [73, 116, 3.05],
].map(([x, y, d], b) => ({
  pos: { left: `${x}%`, top: y } as CSSProperties,
  core: { animationDelay: `${d}s` } as CSSProperties,
  // 바깥 고리 12개 + 안쪽 4개가 퍼진다
  sparks: Array.from({ length: 16 }, (_, k) => {
    const ring = k < 12
    const a = (ring ? k / 12 : (k - 12) / 4 + 1 / 8) * Math.PI * 2
    const r = ring ? 46 : 22
    return {
      '--dx': `${Math.round(Math.cos(a) * r)}px`,
      '--dy': `${Math.round(Math.sin(a) * r + 12)}px`,
      background: ring ? SPARK_COLORS[b][k % 2] : '#ffffff',
      animationDelay: `${d}s`,
    } as CSSProperties
  }),
}))
const POPS = [
  [8, 30, 1.3],
  [24, 70, 1.7],
  [41, 22, 1.5],
  [60, 82, 1.9],
  [77, 34, 1.4],
  [92, 92, 1.6],
].map(
  ([x, y, t], i) =>
    ({
      left: `${x}%`,
      top: y,
      animationDuration: `${t}s`,
      animationDelay: `${(1.9 + i * 0.23).toFixed(2)}s`,
    }) as CSSProperties,
)
// 무대 위 반짝이: 위치(중앙 기준 px), 크기, 지연
const TWINKLES = [
  [-82, 96, 22, 2.1],
  [48, 110, 33, 2.5],
  [-66, 176, 33, 2.9],
  [66, 196, 22, 2.3],
].map(
  ([x, y, s, d]) =>
    ({
      left: `calc(50% + ${x}px)`,
      top: y,
      width: s,
      height: s,
      animationDelay: `${d}s`,
    }) as CSSProperties,
)
const CONFETTI_COLORS = [
  '#f2c14e',
  '#f07a2b',
  '#fbf7ee',
  '#d8433a',
  '#4f9fdc',
  '#ffe08a',
]
const CONFETTI = Array.from(
  { length: 48 },
  (_, i) =>
    ({
      left: `${(i * 37) % 100}%`,
      width: i % 2 ? 6 : 8,
      height: i % 2 ? 12 : 8,
      background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      animationDuration: `${(2.8 + ((i * 11) % 10) / 7).toFixed(2)}s`,
      animationDelay: `${(1.8 + ((i * 7) % 13) / 10).toFixed(2)}s`,
    }) as CSSProperties,
)
const CORNERS = ['', 'R', 'B', 'RB']
// 진열장에 보이는 트로피 수 상한 (통산 횟수는 글자로 보여 준다)
const SHELF = 6

// 파이널 MVP 축하: 암전·스포트라이트·두구두구 예고 → 플래시와 함께 공개 → 시리즈 기록과 트로피 적립.
// 화면을 누르면 끝 장면으로 건너뛰고, 끝난 뒤 '계속'으로 닫는다
export function FinalsMvp({
  state,
  kit,
  award,
  onClose,
}: {
  state: GameState
  kit: Kit
  award: FmvpAward
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const frame = useFrame()
  // 동작 줄이기면 끝 장면에서 시작한다
  const [reduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [t0, setT0] = useState(() => performance.now() - (reduced ? END : 0))
  const [now, setNow] = useState(() => performance.now())
  const el = now - t0
  useEffect(() => {
    if (el >= END) return
    const id = setTimeout(() => setNow(performance.now()), 50)
    return () => clearTimeout(id)
  }, [el])
  useEffect(() => {
    const d = ref.current
    if (!d) return
    d.showModal()
    if (!reduced) return
    for (const a of d.getAnimations({ subtree: true })) {
      a.currentTime = END
      if (a.effect?.getComputedTiming().iterations === Infinity) a.pause()
    }
  }, [reduced])

  // 모든 CSS 애니메이션을 끝 시점으로 감는다
  const skip = () => {
    const d = ref.current
    if (!d || el >= END) return
    for (const a of d.getAnimations({ subtree: true }))
      if (Number(a.currentTime ?? 0) < END) a.currentTime = END
    const n = performance.now()
    setT0(n - END)
    setNow(n)
  }

  const p = state.player
  const look = p.look ?? DEFAULT_LOOK
  const season = state.history.at(-1)
  const A = FMVP_AWARDS[award]
  const finals = { k: A.finals }
  const short = { k: A.short }
  // 프로 시즌의 결승은 이듬해 봄
  const year = (season?.year ?? 0) + 1
  // 결승 마지막 경기는 시즌 마지막 경기라 하이라이트 끝에 늘 남는다: 라벨의 'n차전'이 시리즈 길이
  const last = season?.featured.at(-1)
  const games = Number(last?.label.match(/(\d+)차전/)?.[1] ?? 4)
  const line = season?.finalsStats
  const stat = (k: 'pts' | 'reb' | 'ast', i: number) => {
    const v = line?.games ? line[k] / line.games : 0
    const t = Math.min(1, Math.max(0, (el - (COUNT_AT + i * 150)) / 600))
    return (v * (1 - (1 - t) ** 3)).toFixed(1)
  }
  const count = state.history.filter((h) => h.awards.includes(award)).length
  const team = { k: season?.team ?? '' }
  const marquee = `${A.marquee} ${year} ★ ${tr('{team} 우승', { team })} ★ ${tr('{short} MVP', { short })} ${p.name} ★ `
  const crowd = crowdURL(
    `fmvp-${kit.jersey}`,
    130,
    36,
    {
      seed: 7,
      bg: '#11141c',
      fade: 0.1,
      dim: 0.05,
      lights: 0.06,
      cheer: 0.6,
      shirts: [kit.jersey, kit.number, '#f3eee2', kit.jersey, '#d8433a'],
    },
    frame,
  )
  const flash = propURL('flash')
  const star = propURL('star')
  const lamp = propURL('lamp')
  const trophy = iconURL('trophy')
  const shelf = Math.min(count, SHELF)

  return (
    <dialog
      ref={ref}
      className="modal fmvp"
      aria-label={tr(award)}
      onClick={skip}
      onClose={() => setTimeout(onClose, 150)}
    >
      <div className="fm-card">
        <div className="fm-stage">
          <img className="fm-crowd" src={crowd} alt="" />
          <div className="fm-band">
            <div className="fm-marq">{marquee.repeat(4)}</div>
          </div>
          <div className="fm-floor" />
          <div className="fm-circle" />
          <div className="fm-rays">
            <div />
          </div>
          <div className="fm-glow" />
          <div className="fm-fx">
            {POPS.map((style, i) => (
              <img
                key={i}
                className="fm-pop"
                src={flash}
                alt=""
                style={style}
              />
            ))}
            {BURSTS.map((b, i) => (
              <div key={i} className="fm-burst" style={b.pos}>
                <img src={flash} alt="" style={b.core} />
                {b.sparks.map((style, k) => (
                  <i key={k} style={style} />
                ))}
              </div>
            ))}
          </div>
          <img className="fm-pedestal" src={hallArtURL('pedestal')} alt="" />
          <span className="fm-ring" />
          <span className="fm-ring two" />
          <div className="fm-hero">
            <PixelPlayer pose="trophy" kit={kit} look={look} scale={4} />
          </div>
          {TWINKLES.map((style, i) => (
            <img
              key={i}
              className="fm-twinkle"
              src={flash}
              alt=""
              style={style}
            />
          ))}
          <div className="fm-spots">
            <div className="l" />
            <div className="r" />
          </div>
          <img className="fm-lamp l" src={lamp} alt="" />
          <img className="fm-lamp r" src={lamp} alt="" />
          <div className="fm-preglow" />
          <div className="fm-silhouette" aria-hidden="true">
            <PixelPlayer pose="trophy" kit={kit} look={look} scale={4} />
          </div>
          <div className="fm-plate">
            <img src={star} alt="" />
            <span>{A.plate}</span>
            <img src={star} alt="" />
          </div>
        </div>
        <div className="fm-body">
          <p className="fm-eyebrow">
            {tr('{year} {finals} · {w}승 {l}패 우승', {
              year,
              finals,
              w: 4,
              l: games - 4,
            })}
          </p>
          <div className="fm-name">
            <img className="l" src={hallArtURL('laurel')} alt="" />
            <h2>{p.name}</h2>
            <img className="r" src={hallArtURL('laurel', 'R')} alt="" />
          </div>
          <p className="fm-sub">
            {tr(season?.team ?? '')} · #{look.num}{' '}
            {tr(POSITION_LABELS[p.position])}
          </p>
          <div className="fm-stats">
            <p>
              {tr('vs {opp} · {short} {g}경기 평균', {
                opp: { k: last?.opponent ?? '' },
                short,
                g: line?.games ?? games,
              })}
            </p>
            <div>
              {(
                [
                  ['득점', 'pts'],
                  ['리바운드', 'reb'],
                  ['어시스트', 'ast'],
                ] as const
              ).map(([label, k], i) => (
                <div key={k}>
                  <span>{tr(label)}</span>
                  <b>{stat(k, i)}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="fm-shelf">
            <div>
              {Array.from({ length: shelf }, (_, i) =>
                i < shelf - 1 ? (
                  <img key={i} src={trophy} alt="" />
                ) : (
                  <span key={i} className="fresh">
                    <img src={trophy} alt={tr('새 트로피')} />
                    <img className="spark" src={flash} alt="" />
                  </span>
                ),
              )}
            </div>
            <div>
              <b>{tr('{short} MVP 통산 {n}회', { short, n: count })}</b>
              <span>{tr('트로피 진열장에 올렸어요')}</span>
            </div>
          </div>
          <div className="fm-foot">
            <p>{tr('화면을 누르면 바로 볼 수 있어요')}</p>
            <button
              className="primary big"
              onClick={(e) => {
                e.stopPropagation()
                if (el < END) skip()
                else ref.current?.close()
              }}
            >
              {tr('계속')} <span>▶</span>
            </button>
          </div>
        </div>
        <div className="fm-badge">
          <span>
            {count === 1
              ? tr('커리어 첫 {short} MVP', { short })
              : tr('통산 {n}번째 {short} MVP', { short, n: count })}
          </span>
        </div>
        <div className="fm-dark">
          <div>
            <p>
              {tr('{year} {finals} · {g}차전 종료', { year, finals, g: games })}
            </p>
            <p>
              {tr('이번 시리즈 MVP는')}
              <span>…</span>
            </p>
            <p>{tr('두구두구두구')}</p>
          </div>
          <p>{tr('화면을 누르면 건너뛰어요')}</p>
        </div>
        <div className="fm-confetti" aria-hidden="true">
          {CONFETTI.map((style, i) => (
            <i key={i} style={style} />
          ))}
        </div>
        {CORNERS.map((c) => (
          <img
            key={c}
            className={`fm-corner c${c || 'TL'}`}
            src={hallArtURL('corner', c)}
            alt=""
          />
        ))}
      </div>
      <div className="fm-flash" />
    </dialog>
  )
}

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { HIGH_SCHOOLS, UNIVERSITIES, US_COLLEGES } from '../data/schools'
import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import { formatMoney } from '../engine/events'
import type { GameState, Look, SeasonRecord, Stage } from '../engine/types'
import { tr } from '../i18n'
import { serviceLabel, stageLabel } from './format'
import { useFrame } from './frame'
import { HallSubmit } from './hallSubmit'
import {
  BANNER_SIZE,
  bannerURL,
  type CrowdOpts,
  crowdURL,
  type PropName,
  propSize,
  propURL,
} from './landingArt'
import { Typed } from './landingScreen'
import { at, DIM, FRAME, u } from './sceneUnits'
import { PixelPlayer } from './pixelPlayer'
import { type Kit, teamKit } from './pose'
import {
  DEFAULT_LOOK,
  type DrawnPose,
  ROSTER,
  type Spec,
  spriteURL,
} from './sprite'
import { TeamLogo } from './teamLogo'

// 은퇴 화면: 한 줄씩 쌓이는 커리어 요약. 은퇴를 정하면 입장 → 헌정 영상 → 고별사 → 영구결번
// 은퇴식이 팝업으로 열리고, 요약 보드의 '은퇴식 다시 보기'로 다시 연다
const BEATS = [
  {
    label: '입장',
    chapter: '마지막 홈경기 · 센터 코트',
    caption: '마지막 홈경기가 끝난 밤, 꺼진 코트 위로 조명 하나',
  },
  {
    label: '헌정 영상',
    chapter: '전광판 · 커리어 하이라이트',
    caption: '전광판에 흐르는 {n}시즌의 장면들',
  },
  {
    label: '고별사',
    chapter: '센터 코트 · 마이크 앞',
    caption: '“농구가 제 인생이었습니다. 고마웠습니다.”',
  },
  {
    label: '영구결번',
    chapter: '홈 아레나 천장',
    caption: '등번호 {num}번, 천장에 영원히 걸리다',
  },
]
const BEAT_MS = 4400
// 요약이 한 줄씩 열리는 간격, 통산 기록 숫자가 올라가는 시간
const REVEAL_MS = 520
const COUNT_MS = 1600
const CONFETTI = ['#f2c14e', '#5a3fa0', '#fbf7ee', '#f07a2b', '#ffe08a']

// 기록에는 팀 이름만 남아 있어 이름으로 팀 id(유니폼 색)를 찾는다
const TEAM_ID = new Map(
  [
    ...KBL_TEAMS,
    ...NBA_TEAMS,
    ...HIGH_SCHOOLS,
    ...UNIVERSITIES,
    ...US_COLLEGES,
  ].map((t) => [t.name, t.id]),
)
const kitOf = (team: string) => teamKit(TEAM_ID.get(team) ?? team)

// 연속으로 같은 무대·팀에서 뛴 시즌을 한 구간으로
interface Chapter {
  stage: Stage
  team: string
  ages: [number, number]
  year: number
  seasons: SeasonRecord[]
  awards: string[]
}
function chapters(state: GameState): Chapter[] {
  const out: Chapter[] = []
  for (const h of state.history) {
    const last = out.at(-1)
    if (last && last.stage === h.stage && last.team === h.team) {
      last.ages[1] = h.age
      last.seasons.push(h)
    } else
      out.push({
        stage: h.stage,
        team: h.team,
        ages: [h.age, h.age],
        year: h.year,
        seasons: [h],
        awards: [],
      })
  }
  for (const c of out) {
    const years = new Set(c.seasons.map((h) => h.year))
    c.awards = [
      ...c.seasons.flatMap((h) => h.awards),
      ...state.honors.filter((h) => years.has(h.year)).map((h) => h.name),
    ]
  }
  return out
}

// 구간 메모: 많이 받은 상 셋, 상이 없으면 평균 기록
function note(c: Chapter) {
  if (c.awards.length) {
    const count = new Map<string, number>()
    for (const a of c.awards) count.set(a, (count.get(a) ?? 0) + 1)
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a, n]) => (n > 1 ? `${tr(a)} ×${n}` : tr(a)))
      .join(' · ')
  }
  const games = c.seasons.reduce((s, h) => s + h.stats.games, 0)
  const pts = c.seasons.reduce((s, h) => s + h.stats.pts, 0)
  return games
    ? tr('{g}경기 · 평균 {pts}득점', {
        g: games,
        pts: (pts / games).toFixed(1),
      })
    : tr(stageLabel(c.stage))
}

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

export function Retirement({
  state,
  ceremony,
  onPosted,
  onNew,
}: {
  state: GameState
  // 처음 그릴 때 은퇴식 팝업을 연다 (방금 은퇴를 정했을 때)
  ceremony: boolean
  onPosted: () => void
  onNew: () => void
}) {
  const [reduced] = useState(reducedMotion)
  const [open, setOpen] = useState(ceremony)
  // 은퇴식을 닫으면 요약을 처음부터 다시 연다 (팝업 뒤에서 이미 끝나 있지 않게)
  const [round, setRound] = useState(0)
  const look = state.player.look ?? DEFAULT_LOOK
  const life = chapters(state)
  // 마지막으로 뛴 팀이 은퇴식을 연다 (자유계약·군 복무 구간은 건너뛴다)
  const home =
    life.findLast((c) => c.stage !== 'FREE' && c.stage !== 'MILITARY') ??
    life.at(-1)
  const kit = home ? kitOf(home.team) : teamKit('')
  return (
    <section className="retire">
      {open && (
        <Ceremony
          state={state}
          look={look}
          kit={kit}
          life={life}
          reduced={reduced}
          // 은퇴를 정하고 처음 여는 은퇴식만 끝까지 봐야 닫힌다. 다시 볼 때는 바로 닫을 수 있다
          locked={ceremony && round === 0}
          onClose={() => {
            setOpen(false)
            setRound((r) => r + 1)
          }}
        />
      )}
      <Career
        key={round}
        state={state}
        look={look}
        kit={kit}
        life={life}
        reduced={reduced}
        onPosted={onPosted}
        onNew={onNew}
        onCeremony={() => setOpen(true)}
      />
    </section>
  )
}

// 은퇴식 팝업: locked 면 네 장면을 한 번 끝까지 보기 전에는 닫을 수 없다. 단계 표시는 진행만 보여 주고,
// 영구결번에서 '다시 보기'로만 처음부터 다시 재생한다
function Ceremony({
  state,
  look,
  kit,
  life,
  reduced,
  locked,
  onClose,
}: {
  state: GameState
  look: Look
  kit: Kit
  life: Chapter[]
  reduced: boolean
  locked: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const last = BEATS.length - 1
  const [step, setStep] = useState(reduced ? last : 0)
  const [seen, setSeen] = useState(reduced || !locked)
  if (step === last && !seen) setSeen(true)
  const frame = useFrame()
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  useEffect(() => {
    if (step >= last) return
    const id = setTimeout(() => setStep(step + 1), BEAT_MS)
    return () => clearTimeout(id)
  }, [step, last])
  const b = BEATS[step]
  return (
    <dialog
      ref={ref}
      className="modal ceremony"
      aria-label={tr('은퇴식')}
      // 다 보기 전에는 Esc 로도 닫히지 않는다. 브라우저가 강제로 닫으면 다시 연다
      onCancel={(e) => {
        if (!seen) e.preventDefault()
      }}
      onClose={() => {
        if (seen) setTimeout(onClose, 150)
        else ref.current?.showModal()
      }}
    >
      <div className="retire-bar">
        <span>{tr('은퇴식')} · CEREMONY</span>
        <span>
          {step + 1} / {BEATS.length}
        </span>
      </div>
      <RetireScene
        key={step}
        step={step}
        look={look}
        kit={kit}
        life={life}
        frame={frame}
        reduced={reduced}
      />
      <div className="milestone-body">
        <div className="row between">
          <span className="retire-chapter">{tr(b.chapter)}</span>
          {step === last && !reduced && (
            <button className="ghost mini" onClick={() => setStep(0)}>
              {tr('다시 보기')}
            </button>
          )}
        </div>
        <Typed
          key={step}
          text={tr(b.caption, { n: state.history.length, num: look.num })}
          instant={reduced}
        />
        <ol className="milestones">
          {BEATS.map((x, i) => (
            <li
              key={x.label}
              className={i < step ? 'done' : i === step ? 'now' : undefined}
            >
              <span aria-current={i === step ? 'step' : undefined}>
                {tr(x.label)}
              </span>
            </li>
          ))}
        </ol>
        {seen && (
          <button className="primary big" onClick={() => ref.current?.close()}>
            {tr('닫기')}
          </button>
        )}
      </div>
    </dialog>
  )
}

function Career({
  state,
  look,
  kit,
  life,
  reduced,
  onPosted,
  onNew,
  onCeremony,
}: {
  state: GameState
  look: Look
  kit: Kit
  life: Chapter[]
  reduced: boolean
  onPosted: () => void
  onNew: () => void
  onCeremony: () => void
}) {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  const rows = life.length + 1
  // 타임라인 → 통산 기록 → 트로피 → 병역·수입 → 버튼 순서로 연다
  const when = {
    count: rows + 1,
    trophy: rows + 2,
    foot: rows + 6,
    act: rows + 6.6,
  }
  const end = when.act * REVEAL_MS + COUNT_MS
  const el = reduced ? Infinity : now - start
  useEffect(() => {
    if (el >= end) return
    const id = setTimeout(() => setNow(Date.now()), 80)
    return () => clearTimeout(id)
  }, [el, end])
  const on = (x: number) => el >= x * REVEAL_MS
  const counted = (v: number) => {
    const t = Math.min(1, Math.max(0, (el - when.count * REVEAL_MS) / COUNT_MS))
    return Math.round(v * (1 - (1 - t) ** 3)).toLocaleString()
  }

  const p = state.player
  const all = state.history.flatMap((h) => h.awards)
  const n = (a: string) => all.filter((x) => x === a).length
  const pro = state.history.filter(
    (h) => h.stage === 'KBL' || h.stage === 'NBA',
  )
  const trophies = (
    [
      ['mvp', 'NBA 파이널 MVP', n('NBA 파이널 MVP')],
      ['cup', 'NBA 챔피언', n('NBA 챔피언')],
      ['mvp', 'NBA MVP', n('NBA MVP')],
      ['cup', 'KBL 우승', n('KBL 챔피언결정전 우승')],
      ['mvp', 'KBL MVP', n('KBL 국내선수 MVP')],
      [
        'medal',
        '아시안게임 금메달',
        state.honors.filter((h) => h.name === '아시안게임 금메달').length,
      ],
    ] as [PropName, string, number][]
  ).filter(([, , c]) => c > 0)
  const counters: [string, number][] = [
    [tr('프로 통산 경기'), pro.reduce((s, h) => s + h.stats.games, 0)],
    [tr('프로 통산 득점'), pro.reduce((s, h) => s + h.stats.pts, 0)],
    [tr('최고 OVR'), state.peakOvr],
    [tr('커리어 시즌'), state.history.length],
  ]
  const first = state.history[0]
  const last = state.history.at(-1)
  const ageLabel = ([a, b]: [number, number]) =>
    a === b ? tr('{a}세', { a }) : tr('{a}–{b}세', { a, b })

  return (
    <div className="panel career">
      <div className="career-head">
        <PixelPlayer pose="wave" kit={kit} look={look} scale={1.5} />
        <div>
          <p className="eyebrow">{tr('커리어 요약')}</p>
          <h2>{tr('{name}의 농구 인생', { name: p.name })}</h2>
          {first && last && (
            <small>
              {first.year}–{last.year} ·{' '}
              {tr('{n}시즌', { n: state.history.length })} · {p.position} #
              {look.num}
            </small>
          )}
        </div>
        <button className="ghost mini" onClick={onCeremony}>
          {tr('은퇴식 다시 보기')}
        </button>
      </div>
      <div className="career-body">
        <ol className="life">
          {life.map((c, j) => (
            <LifeRow
              key={j}
              on={on(j + 1)}
              rail={on(j + 2)}
              age={ageLabel(c.ages)}
              stage={stageLabel(c.stage)}
              logo={<TeamLogo name={c.team} size={22} />}
              team={tr(c.team) || stageLabel(c.stage)}
              note={note(c)}
            />
          ))}
          <LifeRow
            on={on(rows)}
            age={tr('{a}세', { a: state.age })}
            stage={stageLabel('RETIRED')}
            logo={<img className="px" src={propURL('star')} alt="" />}
            team={tr('영구결번 #{num}', { num: look.num })}
            note={tr('{n}시즌을 마치고 코트를 떠나다', {
              n: state.history.length,
            })}
          />
        </ol>
        <div className="career-counters">
          {counters.map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{counted(v)}</b>
            </div>
          ))}
        </div>
        {trophies.length > 0 && (
          <div className="career-shelf">
            <div>
              {trophies.map(([icon, label, c], j) => (
                <div
                  key={label}
                  className={on(when.trophy + j * 0.6) ? 'on' : undefined}
                >
                  <img className="px" src={propURL(icon)} alt="" />
                  <b>×{c}</b>
                  <small>{tr(label)}</small>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={on(when.foot) ? 'reveal on' : 'reveal'}>
          <p className="muted">
            {tr('병역:')} {serviceLabel(state.service)}
          </p>
          <p className="muted">
            {tr('통산 수입:')} {formatMoney(state.earnings.KRW, 'KRW')}
            {state.earnings.USD > 0 &&
              ` + ${formatMoney(state.earnings.USD, 'USD')}`}
          </p>
        </div>
        <div
          className={on(when.act) ? 'reveal on' : 'reveal'}
          inert={!on(when.act)}
        >
          <HallSubmit state={state} onPosted={onPosted}>
            <button className="ghost" onClick={onNew}>
              {tr('새로운 인생 시작하기')}
            </button>
          </HallSubmit>
        </div>
      </div>
    </div>
  )
}

function LifeRow(props: {
  on: boolean
  rail?: boolean
  age: string
  stage: string
  logo: ReactNode
  team: string
  note: string
}) {
  const cls = [props.on && 'on', props.rail && 'rail'].filter(Boolean).join(' ')
  return (
    <li className={cls || undefined}>
      <span className="dot" />
      <small>{props.age}</small>
      {props.logo}
      <div>
        <div className="row">
          <span className="tag">{props.stage}</span>
          <b>{props.team}</b>
        </div>
        <small>{props.note}</small>
      </div>
    </li>
  )
}

// 은퇴식 장면: 110×72 논리 픽셀 (랜딩 마일스톤 장면과 같은 좌표계)
function RetireScene({
  step,
  look,
  kit,
  life,
  frame,
  reduced,
}: {
  step: number
  look: Look
  kit: Kit
  life: Chapter[]
  frame: number
  reduced: boolean
}) {
  const anim = (v: string) => (reduced ? 'none' : v)
  // 헌정 영상: 커리어 구간을 1.3초마다 넘긴다 (프로·학교 구간에서 최대 4개)
  const played = life.filter(
    (c) => c.stage !== 'FREE' && c.stage !== 'MILITARY',
  )
  const clips = played.length > 4 ? [played[0], ...played.slice(-3)] : played
  const [clip, setClip] = useState(reduced ? Math.max(0, clips.length - 1) : 0)
  useEffect(() => {
    if (step !== 1 || reduced || clips.length < 2) return
    const id = setInterval(() => setClip((c) => (c + 1) % clips.length), 1300)
    return () => clearInterval(id)
  }, [step, reduced, clips.length])

  let n = 0
  const key = () => `e${n++}`
  const img = (
    src: string,
    x: number,
    y: number,
    w: number,
    h: number,
    st?: CSSProperties,
  ) => (
    <img
      key={key()}
      src={src}
      alt=""
      draggable={false}
      style={at(x, y, w, h, {
        display: 'block',
        imageRendering: 'pixelated',
        ...st,
      })}
    />
  )
  const prop = (name: PropName, x: number, y: number, st?: CSSProperties) => {
    const [w, h] = propSize(name)
    return img(propURL(name), x, y, w, h, st)
  }
  const banner = (num: number, x: number, y: number, st?: CSSProperties) =>
    img(bannerURL(num, kit.jersey), x, y, ...BANNER_SIZE, st)
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    st: CSSProperties,
    kids?: ReactNode,
  ) => (
    <div key={key()} style={at(x, y, w, h, st)}>
      {kids}
    </div>
  )
  const plate = (
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    size: number,
    st: CSSProperties,
  ) =>
    box(
      x,
      y,
      w,
      h,
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-pixel)',
        fontSize: u(size),
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...st,
      },
      text,
    )
  const planks = (y: number, a: string, b: string) =>
    box(0, y, 110, 72 - y, {
      background: `repeating-linear-gradient(90deg, ${a} 0 ${u(7)}, ${b} ${u(7)} ${u(14)})`,
      borderTop: `${u(0.75)} solid #1a1715`,
    })
  const beam = (pts: [number, number][], color: string) => (
    <div
      key={key()}
      style={{
        position: 'absolute',
        inset: 0,
        background: color,
        pointerEvents: 'none',
        clipPath: `polygon(${pts.map(([x, y]) => `${(x / 1.1).toFixed(2)}% ${(y / 0.72).toFixed(2)}%`).join(',')})`,
      }}
    />
  )
  const trim = '#f3eee2'
  const me = (jersey = kit.jersey): Spec => ({ ...look, jersey, trim })
  const mate = (idx: number, num: number): Spec => ({
    ...ROSTER[idx].look,
    jersey: kit.jersey,
    trim,
    num,
  })
  const ppl = (
    spec: Spec,
    pose: DrawnPose,
    x: number,
    y: number,
    st?: CSSProperties,
    fr = frame,
  ) => img(spriteURL(spec, pose, fr), x, y, 30, 54, st)

  const els: ReactNode[] = []
  let bg = '#0b0c10'
  const arena = (o: {
    dim: number
    lights: number
    cheer: number
    wa: string
    wb: string
  }) => {
    const crowd = (name: string, y: number, h: number, c: CrowdOpts) =>
      img(crowdURL(`retire-${name}${step}`, 110, h, c, frame), 0, y, 110, h)
    const base = { bg, cheer: o.cheer, lights: o.lights }
    els.push(
      crowd('u', 0, 22, { ...base, seed: 11 + step, fade: 0.1, dim: o.dim }),
      crowd('l', 21, 21, {
        ...base,
        seed: 5 + step,
        fade: 0.05,
        dim: o.dim * 0.7,
      }),
      box(
        0,
        42,
        110,
        4,
        {
          background: '#1a1715',
          overflow: 'hidden',
          borderBlock: `${u(0.5)} solid #f2c14e`,
        },
        <div
          className="retire-ticker"
          style={{
            fontSize: u(2.4),
            animation: anim('landing-scroll 10s linear infinite'),
          }}
        >
          {`THANK YOU #${look.num} ★ `.repeat(12)}
        </div>,
      ),
      planks(46, o.wa, o.wb),
    )
  }

  if (step === 0) {
    arena({ dim: 0.55, lights: 0.2, cheer: 0.08, wa: '#4a3a28', wb: '#423322' })
    els.push(
      box(28, 52, 54, 15, {
        border: `${u(0.75)} solid rgba(251,247,238,.22)`,
        borderRadius: '50%',
      }),
      prop('lamp', 50, 0),
      beam(
        [
          [51, 3],
          [59, 3],
          [82, 72],
          [28, 72],
        ],
        'rgba(255,236,190,.16)',
      ),
      box(31, 59, 48, 10, {
        background: 'rgba(255,236,190,.24)',
        borderRadius: '50%',
      }),
      ppl(
        me(),
        'guard',
        40,
        11,
        { animation: anim('retire-walk 2.4s steps(12) both') },
        0,
      ),
    )
  } else if (step === 1) {
    arena({ dim: 0.62, lights: 0.06, cheer: 0, wa: '#3d3022', wb: '#372b1f' })
    const BGS = ['#3a4234', '#18204a', '#11141c', '#2b2a2a']
    const FLOORS = ['#a8743a', '#d49a5e', '#e0b07a', '#c99a25']
    const c = clips[clip]
    const champ = c?.awards.some((a) => /우승|챔피언|MVP/.test(a))
    const pose: DrawnPose = champ
      ? 'trophy'
      : (['guard', 'cheer', 'shoot', 'cheer'] as const)[clip % 4]
    els.push(
      box(42, 0, 0.75, 2, { background: '#6b6b6b' }),
      box(67, 0, 0.75, 2, { background: '#6b6b6b' }),
      box(28, 1, 54, 28, { background: '#1a1715', boxShadow: FRAME }),
      box(30, 3, 50, 20, { background: BGS[clip % 4], overflow: 'hidden' }, [
        box(0, 14, 50, 6, { background: FLOORS[clip % 4] }),
        champ
          ? box(0, 0, 50, 20, {
              background:
                'repeating-conic-gradient(from 0deg at 50% 70%, rgba(242,193,78,.28) 0deg 10deg, transparent 10deg 20deg)',
            })
          : null,
        c
          ? img(
              spriteURL(me(kitOf(c.team).jersey), pose, frame),
              15,
              -2,
              20,
              36,
            )
          : null,
        box(0, 0, 50, 20, {
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px)',
        }),
        plate(2, 2, 15, 3.5, 'TRIBUTE', 2, {
          background: '#d8433a',
          color: '#fbf7ee',
        }),
        <div
          key={`cut${clip}`}
          style={at(0, 0, 50, 20, {
            background: '#fbf7ee',
            opacity: 0,
            animation: anim('retire-cut .3s steps(3) both'),
          })}
        />,
      ]),
      c
        ? plate(30, 23.5, 50, 4.5, `${c.year} · ${tr(c.team)}`, 2.8, {
            color: '#ffe08a',
          })
        : null,
      beam(
        [
          [30, 29],
          [80, 29],
          [100, 72],
          [10, 72],
        ],
        'rgba(143,208,245,.07)',
      ),
      ppl(mate(3, 4), 'guard', 70, 15, DIM),
      ppl(mate(9, 23), 'guard', 84, 13, DIM),
      ppl(me(), 'guard', 4, 16),
    )
  } else if (step === 2) {
    bg = '#0d0f15'
    arena({
      dim: 0.38,
      lights: 0.26,
      cheer: 0.18,
      wa: '#7d6040',
      wb: '#735838',
    })
    els.push(
      box(36, 46, 38, 26, {
        background: `repeating-linear-gradient(90deg, #9e2a24 0 ${u(6)}, #8a241f ${u(6)} ${u(12)})`,
        borderInline: `${u(1)} solid #f2c14e`,
      }),
      ppl(mate(12, 33), 'guard', -4, 9, DIM),
      ppl(mate(19, 24), 'guard', 12, 8, DIM),
      ppl(mate(8, 3), 'guard', 68, 8, DIM),
      ppl(mate(7, 55), 'guard', 84, 9, DIM),
      beam(
        [
          [50, 0],
          [58, 0],
          [74, 72],
          [36, 72],
        ],
        'rgba(255,236,190,.13)',
      ),
    )
    for (const [x, y, d] of [
      [6, 30, 0],
      [24, 35, 0.55],
      [86, 31, 0.25],
      [100, 36, 0.85],
    ])
      els.push(
        prop('flash', x, y, {
          opacity: reduced ? 0 : 1,
          animation: anim(`landing-flash 1.8s steps(1) ${d}s infinite`),
        }),
      )
    els.push(
      prop('bouquet', 32, 58),
      ppl(me(), 'mic', 40, 12),
      plate(62, 4, 44, 10, tr('고마웠습니다!'), 3.4, {
        background: '#fbf7ee',
        color: '#1a1715',
        boxShadow: FRAME,
        animation: anim('scene-in .4s steps(4) .8s both'),
      }),
      box(62, 14, 4, 4, {
        background: '#fbf7ee',
        clipPath: 'polygon(0 0,100% 0,0 100%)',
        animation: anim('scene-in .4s steps(4) .8s both'),
      }),
    )
  } else {
    bg = '#11141c'
    arena({ dim: 0.2, lights: 0.14, cheer: 0.75, wa: '#e0b07a', wb: '#d49a5e' })
    els.push(
      box(0, 0, 110, 3, {
        background: `repeating-linear-gradient(90deg, #2a2c33 0 ${u(3)}, #3a3d45 ${u(3)} ${u(4)})`,
        borderBottom: `${u(0.5)} solid #1a1715`,
      }),
    )
    // 먼저 걸린 선배들의 번호와 올라가는 내 번호
    for (const [x, num] of [
      [4, 23],
      [88, 33],
    ])
      els.push(
        box(x + 8, 0, 0.5, 4, { background: '#6b6b6b' }),
        banner(num, x, 3, DIM),
      )
    els.push(
      box(
        24,
        0,
        17,
        28,
        { animation: anim('retire-rise 3.4s steps(17) .3s both') },
        [box(8, 0, 0.5, 4, { background: '#9a9a9a' }), banner(look.num, 0, 3)],
      ),
      plate(46, 5, 38, 8, `#${look.num} FOREVER`, 3.8, {
        background: '#f2c14e',
        color: '#1a1715',
        boxShadow: FRAME,
      }),
      ppl(mate(3, 4), 'cheer', 84, 13, DIM),
      ppl(mate(9, 23), 'cheer', 0, 13, DIM),
      ppl(me(), 'wave', 50, 14),
    )
    // 꽃가루: 위치·속도는 인덱스로 고정, 음수 지연으로 처음부터 흩날린다
    if (!reduced)
      for (let c = 0; c < 28; c++) {
        const x = (c * 37) % 108
        const dur = 2.2 + (c % 5) * 0.3
        const del = -((c * 0.53) % dur)
        const s = c % 3 ? 1.5 : 1
        els.push(
          <span
            key={key()}
            style={{
              position: 'absolute',
              left: u(x),
              top: '-6%',
              width: u(s),
              height: u(c % 2 ? s : s * 1.6),
              background: CONFETTI[c % CONFETTI.length],
              animation: `landing-fall ${dur.toFixed(2)}s steps(${Math.round(dur * 10)}) ${del.toFixed(2)}s infinite`,
              zIndex: 3,
            }}
          />,
        )
      }
  }

  return (
    <div className="scene" style={{ background: bg }} aria-hidden="true">
      {els}
    </div>
  )
}

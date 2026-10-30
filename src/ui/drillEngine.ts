// 훈련 미니게임 10종의 진행·판정·연출. 화면(drillPlay.tsx)과 분리해 타이머·Web Animations 를 여기서 든다.
// 드문 상태(포즈·판정 문구·회차 결과)는 st 로 React 에 넘기고, 매 프레임 바뀌는 값(게이지·공 위치)은 ref 요소에 직접 그린다.
import { DRILL_REPS, type DrillCtl, DRILLS } from '../engine/events'
import type { DrillKind } from '../engine/types'
import { zoneWidth } from './drill'

// 내 선수 포즈. shoot0/1 은 슛 동작 두 프레임(1 은 공을 손에서 뗀 뒤)
export type Fig = 'idle' | 'guard' | 'cheer' | 'sad' | 'shoot0' | 'shoot1'
export type MateFig = 'stand' | 'idle' | 'guard' | 'cheer'
// 반응속도 등: 0 꺼짐 · 1 켜짐 · 2 성공 · 3 실패
export type Lamp = 0 | 1 | 2 | 3

export interface RunState {
  res: boolean[]
  // 판정 문구(한국어 키, 화면에서 tr) 와 성공 여부
  call: string | null
  good: boolean
  me: Fig
  o: Fig
  mates: [MateFig, MateFig]
  // 팀 패스: 손 든 동료
  open: -1 | 0 | 1
  swish: boolean
  // 웨이트: 바 높이 단계 0~4, 고비 구간, 단계
  lift: number
  stick: boolean
  lphase: '' | 'lower' | 'push' | 'done'
  lamps: Lamp[]
  // 반응속도: 이번 반응 ms, 최고 기록, 제한 ms
  rt: number | null
  best: number | null
  lim: number
  // 드리블: 페이크에 수비가 속았는지
  dMsg: '' | 'bit' | 'read'
  // 게이지 초록 구간과 패스 동료 거리(0~1)
  zone: [number, number]
  dist: number
  holding: boolean
}

// 조작 이름 (카드 칩·플레이 안내)
export const CTL_LABEL: Record<DrillCtl, string> = {
  hold: '누르고 떼기',
  tap: '타이밍 맞춰 누르기',
  lr: '방향 고르기',
  team: '원터치 패스',
  fake: '페이크 + 돌파',
  lamp: '켜진 등 누르기',
  mash: '버튼 연타',
}

export const SHOOT_K: Partial<Record<DrillKind, number>> = {
  ft: 0,
  three: 2,
}
// 슛 자리 x(선수 왼쪽 위), 패스 거리 → x, 동료 자리, 받는 칸, 반응 등 자리
export const SX = [262, 200, 96]
export const X = (v: number) => 60 + 400 * v
export const MB: [number, number][] = [
  [92, 100],
  [388, 100],
]
const CATCH: [number, number] = [240, 168]
const LP: [number, number][] = [
  [240, 40],
  [124, 136],
  [356, 136],
  [240, 232],
]
const SHAKE = [
  { transform: 'none' },
  { transform: 'translate(2px,-2px)' },
  { transform: 'translate(-2px,1px)' },
  { transform: 'none' },
]

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const now = () => performance.now()

const poses = (kind: DrillKind): Pick<RunState, 'me' | 'o' | 'mates'> => ({
  me: ['reb', 'foot', 'react', 'team'].includes(kind) ? 'guard' : 'idle',
  o: kind === 'foot' ? 'idle' : 'guard',
  mates: ['stand', 'stand'],
})

export const initialState = (kind: DrillKind): RunState => ({
  res: [],
  call: null,
  good: false,
  ...poses(kind),
  open: -1,
  swish: false,
  lift: 4,
  stick: false,
  lphase: '',
  lamps: [0, 0, 0, 0],
  rt: null,
  best: null,
  lim: 0,
  dMsg: '',
  zone: [0, 0],
  dist: 0.5,
  holding: false,
})

interface Seg {
  to: [number, number]
  h: number
  ms: number
  s?: number
  fade?: boolean
}

export class DrillEngine {
  st: RunState
  // 화면이 채우는 요소: ball fill hoop p(내 선수) o(상대·동료) g1 g2(잔상) lp(바 게이지) tb(남은 시간)
  r: Record<string, HTMLElement | null> = {}
  private T = new Set<ReturnType<typeof setTimeout>>()
  private A: Animation[] = []
  private ballA: Animation | null = null
  private raf = 0
  private hold: number | null = null
  private inp = false
  private phase = ''
  private gone = false
  // 누르고 떼기
  private leg = 600
  private onPress: (() => void) | null = null
  private onRel: ((v: number, late: boolean) => void) | null = null
  // 팀 패스
  private from: number | null = null
  private tgt = 0
  private arrive = 0
  // 리바운드·드리블·수비 공통 타이밍
  private win = 0
  private tc = 0
  private t0 = 0
  // 드리블
  private lean = 0
  private leanAt = 0
  private leanMs = 0
  private leanBit = false
  private leanId = 0
  private fakes = 0
  private fakeAt = 0
  // 수비
  private drive = 0
  private driveA: Animation | null = null
  // 반응속도
  private lit = 0
  // 웨이트
  private mk = 0
  private mg = 0
  private mLimit = 4000
  private lp = 1
  private tLast = 0
  private lastTap = 0

  readonly kind: DrillKind
  readonly skill: number
  private emit: (s: RunState) => void
  // 10회를 마치면 부른다. 화면이 마운트 뒤에 최신 콜백으로 채운다
  private onFinish: (res: boolean[]) => void = () => {}
  setFinish(fn: (res: boolean[]) => void) {
    this.onFinish = fn
  }
  constructor(kind: DrillKind, skill: number, emit: (s: RunState) => void) {
    this.kind = kind
    this.skill = Math.max(20, Math.min(99, skill))
    this.emit = emit
    this.st = initialState(kind)
  }
  get ctl() {
    return DRILLS[this.kind].ctl
  }

  private set(patch: Partial<RunState>) {
    if (this.gone) return
    this.st = { ...this.st, ...patch }
    this.emit(this.st)
  }
  // StrictMode 는 마운트 effect 를 한 번 되감으므로 destroy 뒤 start 가 다시 올 수 있다
  start() {
    this.gone = false
    this.later(() => this.rep(), 450)
  }
  destroy() {
    this.gone = true
    this.stopAll()
  }

  // ── 타이머·애니메이션 ──
  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      this.T.delete(t)
      fn()
    }, ms)
    this.T.add(t)
  }
  private clearA() {
    for (const a of this.A) a.cancel()
    this.A = []
    this.ballA = null
  }
  private stopAll() {
    this.T.forEach(clearTimeout)
    this.T.clear()
    this.clearA()
    cancelAnimationFrame(this.raf)
    this.hold = null
    this.inp = false
    this.phase = ''
  }
  private anim(k: string, fr: Keyframe[], o: KeyframeAnimationOptions) {
    const el = this.r[k]
    if (!el || !el.animate) return null
    const a = el.animate(fr, { fill: 'forwards', ...o })
    this.A.push(a)
    return a
  }
  private tf(x: number, y: number, s: number) {
    return `translate(${Math.round(x - 11)}px,${Math.round(y - 11)}px) scale(${s})`
  }
  private ballHide() {
    if (this.ballA) {
      this.ballA.cancel()
      this.ballA = null
    }
    if (this.r.ball) this.r.ball.style.opacity = '0'
  }
  // 공 비행: 구간마다 포물선(h), 크기(s), 끝에서 사라짐(fade). 전체 ms 를 돌려준다
  private fly(from: [number, number], segs: Seg[], s0 = 1) {
    const el = this.r.ball
    if (!el || !el.animate) return 0
    const total = segs.reduce((a, s) => a + s.ms, 0)
    let acc = 0
    let p = from
    let sc = s0
    const fr: Keyframe[] = [
      { transform: this.tf(p[0], p[1], sc), opacity: 1, offset: 0 },
    ]
    for (const sg of segs) {
      const s1 = sg.s ?? sc
      for (let i = 1; i <= 12; i++) {
        const t = i / 12
        fr.push({
          transform: this.tf(
            p[0] + (sg.to[0] - p[0]) * t,
            p[1] + (sg.to[1] - p[1]) * t - 4 * sg.h * t * (1 - t),
            sc + (s1 - sc) * t,
          ),
          opacity: sg.fade && i === 12 ? 0 : 1,
          offset: Math.min(1, (acc + sg.ms * t) / total),
        })
      }
      acc += sg.ms
      p = sg.to
      sc = s1
    }
    if (this.ballA) this.ballA.cancel()
    el.style.opacity = '1'
    this.ballA = el.animate(fr, { duration: total, fill: 'forwards' })
    this.A.push(this.ballA)
    return total
  }
  private paint(v: number) {
    if (this.r.fill)
      this.r.fill.style.width =
        (Math.max(0, Math.min(1, v)) * 100).toFixed(2) + '%'
  }
  private shake() {
    this.anim(
      'p',
      [0, -3, 3, -3, 3, -2, 0].map((x) => ({
        transform: `translateX(${x}px)`,
      })),
      { duration: 480, easing: 'steps(6)' },
    )
  }
  private judge(ok: boolean, text: string) {
    this.inp = false
    this.set({ call: text, good: ok })
    this.later(() => this.push(ok), 950)
  }
  private push(ok: boolean) {
    const res = [...this.st.res, ok]
    this.set({ res })
    if (res.length >= DRILL_REPS)
      this.later(() => {
        this.stopAll()
        this.onFinish(res)
      }, 650)
    else this.later(() => this.rep(), 200)
  }

  // 회차 시작: 장면을 초기화하고 종류별 연출을 건다
  private rep() {
    if (this.gone) return
    this.clearA()
    this.ballHide()
    this.paint(0)
    cancelAnimationFrame(this.raf)
    this.hold = null
    this.phase = 'wait'
    this.inp = false
    this.onPress = null
    this.onRel = null
    if (this.r.p) this.r.p.style.translate = ''
    this.set({
      call: null,
      open: -1,
      swish: false,
      holding: false,
      ...poses(this.kind),
    })
    const i = this.st.res.length
    switch (this.kind) {
      case 'ft':
      case 'three':
        return this.rShoot(SHOOT_K[this.kind]!)
      case 'pass':
        return this.rPass()
      case 'team':
        return this.rTeam(i)
      case 'reb':
        return this.rReb()
      case 'drib':
        return this.rDrib(i)
      case 'foot':
        return this.rFoot(i)
      case 'react':
        return this.rReact()
      case 'bench':
      case 'squat':
        return this.rLift(i)
    }
  }

  // ── 입력 (화면·키보드가 부른다) ──
  press = () => {
    if (!this.inp || this.hold != null || this.ctl !== 'hold') return
    this.hold = now()
    this.set({ holding: true })
    this.onPress?.()
    const loop = () => {
      if (this.hold == null) return
      const held = now() - this.hold
      if (held >= this.leg * 6) return this.release(true)
      this.paint(this.ga(held))
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }
  release = (late = false) => {
    if (this.hold == null) return
    const held = now() - this.hold
    this.hold = null
    cancelAnimationFrame(this.raf)
    this.inp = false
    this.set({ holding: false })
    const v = this.ga(held)
    this.paint(v)
    this.onRel?.(v, late)
  }
  // 삼각파 게이지: leg ms 마다 0→1→0
  private ga(held: number) {
    const t = held / this.leg
    const n = Math.floor(t)
    const f = t - n
    return n % 2 ? 1 - f : f
  }
  tap = () => {
    if (this.inp && this.kind === 'reb') this.tapReb()
  }
  choose = (dir: -1 | 1) => {
    if (!this.inp) return
    if (this.kind === 'drib') this.chooseDrib(dir)
    else if (this.kind === 'foot') this.chooseFoot(dir)
  }
  key = (e: KeyboardEvent) => {
    const c = this.ctl
    const k = e.key
    const down = e.type === 'keydown'
    if (k === ' ' || k === 'Enter') {
      if (c !== 'hold' && c !== 'tap' && c !== 'mash') return
      e.preventDefault()
      if (down) {
        if (e.repeat) return
        if (c === 'hold') this.press()
        else if (c === 'mash') this.mash()
        else this.tap()
      } else if (c === 'hold') this.release()
      return
    }
    if (!down) return
    const L = k === 'ArrowLeft'
    const R = k === 'ArrowRight'
    if (c === 'lr' && (L || R)) {
      e.preventDefault()
      this.choose(L ? -1 : 1)
    }
    if (c === 'fake') {
      if ((L || R) && e.shiftKey) {
        e.preventDefault()
        this.fake(L ? -1 : 1)
      } else if (L || R) {
        e.preventDefault()
        this.choose(L ? -1 : 1)
      } else if (k === 'a' || k === 'A') this.fake(-1)
      else if (k === 'd' || k === 'D') this.fake(1)
    }
    if (c === 'team' && (L || R)) {
      e.preventDefault()
      this.pick(L ? 0 : 1)
    }
    if (c === 'lamp') {
      const m = { ArrowUp: 0, ArrowLeft: 1, ArrowRight: 2, ArrowDown: 3 }[k]
      if (m != null) {
        e.preventDefault()
        this.lampHit(m)
      }
    }
  }

  // ── 슈팅 (k: 0 자유투 · 1 미들 · 2 3점) ──
  private rShoot(k: number) {
    const w = zoneWidth(this.skill) * [1.6, 1, 0.7][k]
    const c = k === 2 ? 0.88 : 0.86
    this.leg = [640, 600, 520][k]
    this.set({ zone: [c - w / 2, c + w / 2] })
    this.inp = true
    this.onPress = () => this.set({ me: 'shoot0' })
    this.onRel = (v, late) => {
      const [lo, hi] = this.st.zone
      const vd = late ? 'late' : v < lo ? 'short' : v > hi ? 'long' : 'good'
      const S: [number, number] = [SX[k] + 30, 120]
      const h = 70 + k * 26
      const ms = 620 + k * 90
      const air = vd === 'late' || (vd === 'short' && v < lo - 0.12)
      this.set({ me: 'shoot1' })
      let segs: Seg[]
      if (vd === 'good')
        segs = [
          { to: [414, 116], h, ms },
          { to: [414, 168], h: 0, ms: 200 },
          { to: [404, 226], h: 0, ms: 240, fade: true },
        ]
      else if (air) {
        const lx = S[0] + (414 - S[0]) * 0.62
        segs = [
          { to: [lx, 228], h: h * 0.8, ms: ms * 0.9 },
          { to: [lx + 40, 228], h: 16, ms: 320, fade: true },
        ]
      } else if (vd === 'short')
        segs = [
          { to: [398, 112], h, ms },
          { to: [350, 228], h: 34, ms: 520, fade: true },
        ]
      else
        segs = [
          { to: [418, 80], h: h + 10, ms },
          { to: [390, 228], h: -8, ms: 480, fade: true },
        ]
      this.fly(S, segs)
      const at = segs[0].ms
      if (vd === 'good') {
        this.later(() => this.set({ swish: true }), at + 40)
        this.later(() => this.set({ swish: false }), at + 300)
      } else if (!air)
        this.later(
          () => this.anim('hoop', SHAKE, { duration: 240, easing: 'steps(3)' }),
          at,
        )
      this.later(() => this.set({ me: 'idle' }), at + 250)
      const CALL = {
        good: Math.abs(v - c) < w / 5 ? '클린 슛!' : '골인!',
        short: air ? '에어볼…' : '짧아요',
        long: '길어요',
        late: '너무 오래 잡았어요',
      }
      this.later(() => this.judge(vd === 'good', CALL[vd]), at + 120)
    }
  }
  // ── 일반 패스 ──
  private rPass() {
    const dist = 0.35 + Math.random() * 0.5
    const w = zoneWidth(this.skill) * 1.6
    this.leg = 600
    this.set({ zone: [dist - w / 2, dist + w / 2], dist })
    this.inp = true
    this.onRel = (v, late) => {
      const [lo, hi] = this.st.zone
      const vd = late ? 'late' : v < lo ? 'short' : v > hi ? 'long' : 'good'
      const S: [number, number] = [58, 176]
      const x = X(v)
      const ms = 260 + 440 * v
      this.set({ me: 'guard' })
      let segs: Seg[]
      if (vd === 'good') segs = [{ to: [x, 170], h: 14, ms }]
      else if (vd === 'short')
        segs = [
          { to: [x, 228], h: 10, ms },
          { to: [x + 44, 228], h: 12, ms: 320, fade: true },
        ]
      else if (vd === 'long')
        segs = [
          { to: [x, 118], h: 18, ms },
          { to: [x + 70, 228], h: -6, ms: 380, fade: true },
        ]
      else
        segs = [
          { to: [110, 228], h: 18, ms: 360 },
          { to: [140, 228], h: 8, ms: 260, fade: true },
        ]
      this.fly(S, segs)
      const at = segs[0].ms
      if (vd === 'good')
        this.later(() => {
          this.ballHide()
          this.set({ o: 'idle' })
        }, at)
      const CALL = {
        good: '나이스 패스!',
        short: '짧아요',
        long: '너무 세요',
        late: '너무 오래 잡았어요',
      }
      this.later(() => {
        this.set({ me: 'idle' })
        this.judge(vd === 'good', CALL[vd])
      }, at + 80)
    }
  }
  // ── 팀 패스 게임 (3자 원터치) ──
  private rTeam(i: number) {
    const from = this.from == null ? (Math.random() < 0.5 ? 0 : 1) : this.from
    const tgt = Math.random() < 0.72 ? 1 - from : from
    const D = Math.max(380, 700 - i * 30)
    const w = 110 + (this.skill - 20) * 1.4
    const m: [MateFig, MateFig] = ['stand', 'stand']
    m[from] = 'idle'
    this.set({ mates: m, open: -1 })
    this.later(() => {
      const mm: [MateFig, MateFig] = ['stand', 'stand']
      mm[from] = 'guard'
      mm[tgt] = 'cheer'
      this.set({ mates: mm, open: tgt as 0 | 1 })
      this.fly(MB[from], [{ to: CATCH, h: 22, ms: D, s: 1.8 }], 1)
      this.arrive = now() + D
      this.tgt = tgt
      this.from = from
      this.phase = 'in'
      this.inp = true
      this.later(() => {
        if (this.phase !== 'in') return
        this.phase = 'done'
        this.inp = false
        this.from = null
        this.fly(
          CATCH,
          [{ to: [262, 258], h: 14, ms: 300, s: 1.8, fade: true }],
          1.8,
        )
        this.judge(false, '공을 끌었어요')
      }, D + w)
    }, 500)
  }
  pick = (i: 0 | 1) => {
    if (!this.inp || this.kind !== 'team' || this.phase !== 'in') return
    this.phase = 'done'
    this.inp = false
    const dt = now() - this.arrive
    if (dt < -130) {
      const rest = -dt
      this.anim(
        'p',
        [
          { transform: 'none' },
          { transform: 'translateY(-6px)' },
          { transform: 'none' },
        ],
        { duration: 200, easing: 'steps(2)' },
      )
      this.later(
        () =>
          this.fly(
            CATCH,
            [{ to: [214, 258], h: 18, ms: 320, s: 1.8, fade: true }],
            1.8,
          ),
        rest,
      )
      this.from = null
      return this.later(
        () => this.judge(false, '너무 빨리 손을 뻗었어요'),
        rest + 120,
      )
    }
    const wait = Math.max(0, -dt)
    const ok = i === this.tgt
    const to = MB[i]
    this.later(() => {
      this.anim(
        'p',
        [
          { transform: 'none' },
          { transform: `translateX(${i ? 8 : -8}px)` },
          { transform: 'none' },
        ],
        { duration: 180, easing: 'steps(2)' },
      )
      if (ok) this.fly(CATCH, [{ to, h: 22, ms: 360, s: 1 }], 1.8)
      else
        this.fly(
          CATCH,
          [
            { to: [to[0], to[1] + 10], h: 22, ms: 360, s: 1 },
            { to: [to[0] + (i ? 40 : -40), 200], h: 10, ms: 300, fade: true },
          ],
          1.8,
        )
    }, wait)
    if (ok) {
      this.from = i
      this.later(() => {
        this.ballHide()
        const m: [MateFig, MateFig] = [...this.st.mates]
        m[i] = 'idle'
        this.set({ mates: m, open: -1 })
      }, wait + 360)
      this.later(
        () =>
          this.judge(true, Math.abs(dt) < 70 ? '원터치 패스!' : '나이스 패스!'),
        wait + 380,
      )
    } else {
      this.from = null
      this.later(() => this.judge(false, '엇갈렸어요'), wait + 380)
    }
  }
  // ── 리바운드 점프 ──
  private rReb() {
    this.phase = 'air'
    this.inp = true
    const lx = rnd(318, 352)
    const h = rnd(64, 118)
    const D1 = 700
    const D2 = rnd(820, 1080)
    const lead = 350
    this.win = 40 + (this.skill - 20) * 0.9
    this.tc = now() + lead + D1 + D2 * (1 - 30.5 / h)
    this.later(() => {
      this.fly(
        [-20, 40],
        [
          { to: [398, 114], h: 70, ms: D1 },
          { to: [lx, 236], h, ms: D2 },
          { to: [lx - 40, 236], h: 22, ms: 380, fade: true },
        ],
      )
      this.later(
        () => this.anim('hoop', SHAKE, { duration: 240, easing: 'steps(3)' }),
        D1,
      )
    }, lead)
    this.later(
      () => {
        if (this.phase !== 'air') return
        this.phase = 'done'
        this.judge(false, '놓쳤어요')
      },
      lead + D1 + D2 + 120,
    )
  }
  private tapReb() {
    if (this.phase !== 'air') return
    this.phase = 'done'
    this.inp = false
    const tp = now()
    const a = tp + 200
    const b = tp + 320
    const w = this.win
    const tc = this.tc
    this.anim(
      'p',
      [
        { transform: 'none', easing: 'ease-out' },
        { transform: 'translateY(-46px)', offset: 0.38 },
        { transform: 'translateY(-46px)', offset: 0.58, easing: 'ease-in' },
        { transform: 'none' },
      ],
      { duration: 560 },
    )
    if (tc >= a - w && tc <= b + w) {
      const at = Math.max(120, Math.min(320, tc - tp))
      this.later(() => {
        this.ballHide()
        this.set({ me: 'shoot0' })
      }, at)
      this.later(
        () =>
          this.judge(
            true,
            Math.abs(tc - (a + b) / 2) < w * 0.6
              ? '공중에서 낚아챘다!'
              : '리바운드!',
          ),
        620,
      )
    } else
      this.later(
        () => this.judge(false, tc > b + w ? '너무 빨라요' : '늦었어요'),
        620,
      )
  }
  // ── 드리블 돌파 (페이크) ──
  private rDrib(i: number) {
    this.phase = 'duel'
    this.inp = true
    this.lean = 0
    this.fakes = 0
    this.fakeAt = 0
    this.win = Math.max(380, 900 - i * 45) * (0.8 + this.skill / 250)
    this.set({ dMsg: '' })
    const self = () => {
      if (this.phase !== 'duel') return
      if (!this.lean && Math.random() < 0.35)
        this.setLean(Math.random() < 0.5 ? -1 : 1, this.win * 0.7, false)
      this.later(self, rnd(1100, 1800))
    }
    this.later(self, rnd(1200, 1800))
    this.later(() => {
      if (this.phase !== 'duel') return
      this.phase = 'done'
      this.set({ dMsg: '' })
      this.judge(false, '시간 초과')
    }, 5000)
  }
  private setLean(dir: number, ms: number, bit: boolean) {
    const id = ++this.leanId
    this.lean = dir
    this.leanAt = now()
    this.leanMs = ms
    this.leanBit = bit
    this.anim(
      'o',
      [
        { transform: 'none' },
        {
          transform: `translateX(${dir * 36}px) rotate(${bit ? dir * 6 : 0}deg)`,
        },
      ],
      { duration: 120, easing: 'steps(3)' },
    )
    this.later(() => {
      if (this.phase !== 'duel' || this.leanId !== id) return
      this.lean = 0
      this.anim(
        'o',
        [{ transform: `translateX(${dir * 36}px)` }, { transform: 'none' }],
        { duration: 160, easing: 'steps(3)' },
      )
      this.set({ dMsg: '' })
    }, ms)
  }
  fake = (dir: -1 | 1) => {
    if (
      !this.inp ||
      this.kind !== 'drib' ||
      this.phase !== 'duel' ||
      now() - this.fakeAt < 260
    )
      return
    this.fakeAt = now()
    this.anim(
      'p',
      [
        { transform: 'none' },
        { transform: `translate(${dir * 22}px,-4px)`, offset: 0.4 },
        { transform: 'none' },
      ],
      { duration: 260, easing: 'steps(4)' },
    )
    const bite = Math.max(
      0.15,
      Math.min(0.92, 0.62 + (this.skill - 50) / 160 - this.fakes * 0.18),
    )
    this.fakes++
    this.later(() => {
      if (this.phase !== 'duel') return
      if (Math.random() < bite) {
        this.setLean(dir, this.win, true)
        this.set({ dMsg: 'bit' })
      } else {
        this.set({ dMsg: 'read' })
        this.later(() => {
          if (this.st.dMsg === 'read') this.set({ dMsg: '' })
        }, 600)
      }
    }, 110)
  }
  private chooseDrib(dir: number) {
    if (this.phase !== 'duel') return
    this.phase = 'done'
    this.inp = false
    const lean = this.lean
    const rt = now() - this.leanAt
    this.set({ dMsg: '' })
    if (lean && dir !== lean) {
      const go: Keyframe[] = [
        { transform: 'none' },
        {
          transform: `translate(${dir * 60}px,-16px) scale(.96)`,
          offset: 0.35,
        },
        { transform: `translate(${dir * 150}px,-64px) scale(.8)` },
      ]
      this.anim('p', go, { duration: 360, easing: 'steps(6)' })
      ;(
        [
          ['g1', 50],
          ['g2', 100],
        ] as const
      ).forEach(([g, delay]) =>
        this.anim(
          g,
          go.map((f, k) => ({ ...f, opacity: [0.5, 0.35, 0][k] })),
          { duration: 360, delay, easing: 'steps(6)' },
        ),
      )
      this.set({ o: 'sad' })
      this.anim(
        'o',
        [
          { transform: `translateX(${lean * 36}px)` },
          {
            transform: `translate(${lean * 50}px,4px) rotate(${lean * 10}deg)`,
          },
        ],
        { duration: 260, easing: 'steps(3)' },
      )
      this.judge(
        true,
        this.leanBit
          ? rt < this.leanMs * 0.45
            ? '앵클 브레이커!'
            : '페이크 성공! 돌파!'
          : '빈틈 돌파!',
      )
    } else {
      this.anim(
        'p',
        [
          { transform: 'none' },
          { transform: `translate(${dir * 36}px,-10px)`, offset: 0.5 },
          { transform: 'none' },
        ],
        { duration: 360, easing: 'steps(4)' },
      )
      this.anim(
        'o',
        [
          { transform: `translateX(${lean * 36}px)` },
          { transform: `translateX(${dir * 52}px)` },
        ],
        { duration: 140, easing: 'steps(3)' },
      )
      this.fly(
        [240 + dir * 30, 236],
        [{ to: [240 + dir * 70, 150], h: 30, ms: 380, fade: true }],
      )
      this.judge(
        false,
        lean ? '기운 쪽으로 들어갔어요' : '자리 잡은 수비에 막혔어요',
      )
    }
  }
  // ── 수비 풋워크 ──
  private rFoot(i: number) {
    this.phase = 'wait'
    this.inp = true
    const win = Math.max(420, 820 - i * 40) * (0.8 + this.skill / 250)
    let t = rnd(500, 1000)
    if (Math.random() < 0.6) {
      const j = Math.random() < 0.5 ? -1 : 1
      this.later(() => {
        if (this.phase !== 'wait') return
        this.phase = 'jab'
        this.anim(
          'o',
          [
            { transform: 'none' },
            { transform: `translateX(${j * 18}px)`, offset: 0.4 },
            { transform: 'none' },
          ],
          { duration: 360, easing: 'steps(4)' },
        )
      }, t)
      this.later(() => {
        if (this.phase === 'jab') this.phase = 'wait'
      }, t + 360)
      t += 360 + rnd(300, 700)
    }
    this.later(() => {
      if (this.phase !== 'wait') return
      const dd = Math.random() < 0.5 ? -1 : 1
      this.drive = dd
      this.phase = 'drive'
      this.t0 = now()
      this.driveA = this.anim(
        'o',
        [
          { transform: 'none' },
          { transform: `translate(${dd * 150}px,70px) scale(1.3)` },
        ],
        { duration: win, easing: 'ease-in' },
      )
      this.later(() => {
        if (this.phase !== 'drive') return
        this.phase = 'done'
        this.judge(false, '뚫렸어요')
      }, win)
    }, t)
  }
  private chooseFoot(dir: number) {
    const ph = this.phase
    if (ph !== 'wait' && ph !== 'jab' && ph !== 'drive') return
    this.phase = 'done'
    this.inp = false
    const slide = (dx: number) =>
      this.anim(
        'p',
        [{ transform: 'none' }, { transform: `translateX(${dx}px)` }],
        { duration: 180, easing: 'steps(4)' },
      )
    if (ph === 'jab') {
      slide(dir * 70)
      return this.judge(false, '잽에 속았어요')
    }
    if (ph === 'wait') {
      slide(dir * 40)
      return this.judge(false, '너무 빨라요')
    }
    if (dir === this.drive) {
      slide(dir * 100)
      this.driveA?.pause()
      this.set({ o: 'sad' })
      this.judge(
        true,
        now() - this.t0 < 260 ? '완벽한 길목 차단!' : '길목 차단!',
      )
    } else {
      slide(dir * 90)
      this.judge(false, '반대로 갔어요')
    }
  }
  // ── 반응속도 게임 (4방향 등) ──
  private rReact() {
    const lim = 640 - (this.skill - 20) * 2
    this.phase = 'arm'
    this.inp = true
    this.set({ lamps: [0, 0, 0, 0], rt: null, lim })
    this.later(
      () => {
        if (this.phase !== 'arm') return
        const k = Math.floor(Math.random() * 4)
        const l: Lamp[] = [0, 0, 0, 0]
        l[k] = 1
        this.lit = k
        this.phase = 'go'
        this.t0 = now()
        this.set({ lamps: l })
        this.later(
          () => {
            if (this.phase !== 'go') return
            this.phase = 'done'
            const m: Lamp[] = [0, 0, 0, 0]
            m[k] = 3
            this.set({ lamps: m })
            this.judge(false, '시간 초과')
          },
          Math.max(900, lim * 2),
        )
      },
      rnd(600, 1700),
    )
  }
  lampHit = (k: number) => {
    if (!this.inp || this.kind !== 'react') return
    const ph = this.phase
    if (ph !== 'arm' && ph !== 'go') return
    this.phase = 'done'
    this.inp = false
    const l: Lamp[] = [0, 0, 0, 0]
    if (ph === 'arm') {
      l[k] = 3
      this.set({ lamps: l })
      return this.judge(false, '부정 출발!')
    }
    const rt = Math.round(now() - this.t0)
    if (k !== this.lit) {
      l[k] = 3
      l[this.lit] = 1
      this.set({ lamps: l, rt })
      return this.judge(false, '다른 등이에요')
    }
    const ok = rt <= this.st.lim
    const best =
      ok && (this.st.best == null || rt < this.st.best) ? rt : this.st.best
    l[k] = ok ? 2 : 3
    this.set({ lamps: l, rt, best, me: ok ? 'cheer' : 'guard' })
    const [x, y] = LP[k]
    this.anim(
      'p',
      [
        { transform: 'none' },
        {
          transform: `translate(${Math.round((x - 240) * 0.14)}px,${Math.round((y - 138) * 0.14)}px)`,
        },
        { transform: 'none' },
      ],
      { duration: 220, easing: 'steps(3)' },
    )
    this.judge(
      ok,
      ok ? (rt < this.st.lim * 0.6 ? '번개 반응!' : '좋아요!') : '조금 느려요',
    )
  }
  // ── 웨이트 (버튼 연타). 바를 내린 뒤 연타로 밀어 올린다. 손을 멈추면 내려오고 고비 구간은 더 무겁다 ──
  private rLift(i: number) {
    const s = Math.max(0, Math.min(1, (this.skill - 20) / 80))
    this.mk = 0.085 + s * 0.05
    this.mg = (this.kind === 'squat' ? 0.28 : 0.24) + i * 0.02
    this.mLimit = 4000
    this.lp = 1
    this.paintLift(1)
    this.paintTime(1)
    this.set({ lift: 4, stick: false, lphase: 'lower' })
    ;[3, 2, 1, 0].forEach((f, n) =>
      this.later(
        () => {
          this.set({ lift: f })
          this.paintLift(f / 4)
        },
        120 * (n + 1),
      ),
    )
    this.later(() => {
      this.lp = 0
      this.paintLift(0)
      this.phase = 'push'
      this.inp = true
      this.set({ lphase: 'push' })
      this.t0 = now()
      this.tLast = this.t0
      this.lastTap = 0
      const loop = () => {
        if (this.phase !== 'push') return
        const t = now()
        const dt = Math.min(0.05, (t - this.tLast) / 1000)
        this.tLast = t
        const stick = this.lp > 0.35 && this.lp < 0.6
        this.lp = Math.max(0, this.lp - this.mg * (stick ? 1.5 : 1) * dt)
        this.paintLift(this.lp)
        const left = 1 - (t - this.t0) / this.mLimit
        this.paintTime(left)
        const f = Math.min(4, Math.floor(this.lp * 4 + 0.15))
        if (f !== this.st.lift || stick !== this.st.stick)
          this.set({ lift: f, stick })
        const el = this.r.p
        const amp = t - this.lastTap < 120 ? (stick ? 3 : 2) : 1
        if (el)
          el.style.translate = `${Math.round((Math.random() * 2 - 1) * amp)}px ${
            t - this.lastTap < 90 ? -2 : Math.round(Math.random() * amp)
          }px`
        if (left <= 0) return this.liftFail()
        this.raf = requestAnimationFrame(loop)
      }
      this.raf = requestAnimationFrame(loop)
    }, 600)
  }
  mash = () => {
    if (!this.inp || this.phase !== 'push') return
    this.lastTap = now()
    this.lp = Math.min(1, this.lp + this.mk)
    this.paintLift(this.lp)
    if (this.lp >= 1) this.liftOk()
  }
  private liftOk() {
    this.phase = 'done'
    this.inp = false
    cancelAnimationFrame(this.raf)
    if (this.r.p) this.r.p.style.translate = ''
    const el = now() - this.t0
    this.set({ lift: 4, stick: false, lphase: 'done' })
    this.anim(
      'p',
      [
        { transform: 'none' },
        { transform: 'translateY(-4px)' },
        { transform: 'none' },
      ],
      { duration: 220, easing: 'steps(2)' },
    )
    this.judge(
      true,
      el < this.mLimit * 0.45
        ? '폭발적인 렙!'
        : el < this.mLimit * 0.8
          ? '굿 렙!'
          : '겨우 성공!',
    )
  }
  private liftFail() {
    this.phase = 'done'
    this.inp = false
    cancelAnimationFrame(this.raf)
    if (this.r.p) this.r.p.style.translate = ''
    this.set({ stick: false, lphase: 'done' })
    this.shake()
    this.later(() => this.set({ lift: 2 }), 450)
    this.later(() => {
      this.set({ lift: 4 })
      this.paintLift(1)
    }, 700)
    this.judge(
      false,
      this.kind === 'squat' ? '못 일어났어요' : '보조가 도와줬어요',
    )
  }
  private paintLift(v: number) {
    if (this.r.lp)
      this.r.lp.style.height =
        (Math.max(0, Math.min(1, v)) * 100).toFixed(1) + '%'
  }
  private paintTime(v: number) {
    if (this.r.tb)
      this.r.tb.style.width =
        (Math.max(0, Math.min(1, v)) * 100).toFixed(1) + '%'
  }
}

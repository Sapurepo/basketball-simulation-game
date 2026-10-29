import type { CSSProperties, ReactNode } from 'react'
import type { Look } from '../engine/types'
import { tr } from '../i18n'
import {
  type CrowdOpts,
  crowdURL,
  type PropName,
  propSize,
  propURL,
} from './landingArt'
import { at, DIM, FRAME, u } from './sceneUnits'
import { type DrawnPose, ROSTER, type Spec, spriteURL } from './sprite'

// 랜딩 마일스톤 장면 5종: 110×72 논리 픽셀 좌표를 컨테이너 너비(cqw)에 맞춰 배치한다
const KITS = {
  hs: { jersey: '#23306b', trim: '#f2c14e' },
  def: { jersey: '#ef7a2b', trim: '#1e1a17' },
  kbl: { jersey: '#4f9fdc', trim: '#f7f3ea' },
  nba: { jersey: '#f3eee2', trim: '#5a3fa0', shorts: '#f3eee2' },
  mvp: { jersey: '#f2c14e', trim: '#1b2230' },
}
type KitName = keyof typeof KITS

const CONFETTI = [
  '#f2c14e',
  '#f07a2b',
  '#fbf7ee',
  '#d8433a',
  '#4f9fdc',
  '#ffe08a',
]

export function MilestoneScene({
  step,
  look,
  frame,
  reduced,
}: {
  step: number
  look: Look
  frame: number
  reduced: boolean
}) {
  const anim = (v: string) => (reduced ? 'none' : v)
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
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    st: CSSProperties,
  ) => <div key={key()} style={at(x, y, w, h, st)} />
  const plate = (
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    size: number,
    st: CSSProperties,
  ) => (
    <div
      key={key()}
      style={at(x, y, w, h, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-pixel)',
        fontSize: u(size),
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...st,
      })}
    >
      {text}
    </div>
  )
  // 마루: 7px 널빤지 두 색을 번갈아
  const planks = (y: number, a: string, b: string) =>
    box(0, y, 110, 72 - y, {
      background: `repeating-linear-gradient(90deg, ${a} 0 ${u(7)}, ${b} ${u(7)} ${u(14)})`,
      borderTop: `${u(0.75)} solid #1a1715`,
    })
  // 조명 빛줄기: 논리 좌표 다각형
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
  const crowd = (
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    o: CrowdOpts,
  ) => img(crowdURL(name, w, h, o, frame), x, y, w, h)
  const me = (kit: KitName, extra?: Partial<Spec>): Spec => ({
    ...look,
    ...KITS[kit],
    ...extra,
  })
  const mate = (idx: number, kit: KitName, num: number): Spec => ({
    ...ROSTER[idx].look,
    ...KITS[kit],
    num,
  })
  const ppl = (
    spec: Spec,
    pose: DrawnPose,
    x: number,
    y: number,
    st?: CSSProperties,
  ) => img(spriteURL(spec, pose, frame), x, y, 30, 54, st)

  const els: ReactNode[] = []
  let bg: string
  if (step === 0) {
    // 고교 체육관 벤치
    bg = '#3a4234'
    els.push(
      box(0, 25, 110, 1, { background: '#1a1715' }),
      box(0, 26, 110, 22, {
        background: `repeating-linear-gradient(90deg, #23306b 0 ${u(13)}, #18204a ${u(13)} ${u(14)})`,
      }),
      prop('gymWindow', 6, 5),
      prop('gymWindow', 86, 5),
      prop('scoreboard', 39, -1),
      planks(48, '#a8743a', '#9a6a34'),
      box(0, 62, 110, 0.75, { background: '#e6dfcf' }),
      beam(
        [
          [87, 15],
          [101, 15],
          [112, 72],
          [68, 72],
        ],
        'rgba(255,236,190,.13)',
      ),
      prop('bench', 4, 46),
      ppl(mate(3, 'hs', 11), 'bench', 8, 4, DIM),
      ppl(mate(9, 'hs', 4), 'bench', 30, 4, DIM),
      ppl(mate(12, 'hs', 23), 'bench', 52, 4, DIM),
      ppl(me('hs'), 'bench', 78, 4),
      prop('jug', 0, 55),
    )
  } else if (step === 1) {
    // 첫 출전: 관중석 앞에서 드리블 돌파
    bg = '#4a5240'
    els.push(
      crowd('hs', 0, 0, 110, 40, {
        seed: 7,
        bg,
        fade: 0.07,
        cheer: 0.5,
        empty: 0.12,
        shirts: ['#23306b', '#f2c14e', '#f3eee2', '#3a4a9a', '#23306b'],
      }),
      plate(6, 2, 44, 7, 'SEOUL THUNDER', 3.2, {
        background: '#23306b',
        color: '#f2c14e',
        boxShadow: FRAME,
      }),
      plate(66, 12 - frame, 9, 7, '#7', 3.6, {
        background: '#fbf7ee',
        color: '#cc3049',
        boxShadow: FRAME,
      }),
      box(0, 40, 110, 6, {
        background: '#2b2d27',
        borderTop: `${u(0.75)} solid #f2c14e`,
      }),
      planks(46, '#d49a5e', '#c98b52'),
      box(78, 50, 34, 24, {
        background: '#b5654a',
        boxShadow: `inset 0 0 0 ${u(0.75)} #fbf7ee`,
      }),
      prop('hoopHS', 85, 4),
      ppl(mate(6, 'def', 12), 'guard', 60, 4, { filter: 'brightness(.85)' }),
    )
    // 속도선
    for (const [x, y, w, d] of [
      [14, 38, 14, 0],
      [10, 46, 18, 0.12],
      [16, 54, 12, 0.24],
    ])
      els.push(
        box(x, y, w, 0.75, {
          background: '#fbf7ee',
          animation: anim(`landing-speed .38s steps(3) ${d}s infinite`),
        }),
      )
    els.push(ppl(me('hs'), 'idle', 34, 14))
  } else if (step === 2) {
    // KBL 드래프트 무대
    bg = '#18204a'
    els.push(box(4, 3, 102, 44, { background: '#23306b', boxShadow: FRAME }))
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 6; c++)
        els.push(
          plate(
            5 + c * 17,
            16 + r * 6,
            15,
            4,
            (r + c) % 2 ? 'DRAFT' : '2026',
            2.4,
            {
              color: '#3a4a9a',
            },
          ),
        )
    els.push(
      plate(28, 5, 54, 9, '2026 KBL DRAFT', 3.6, {
        background: '#f2c14e',
        color: '#1a1715',
        boxShadow: FRAME,
      }),
      box(0, 47, 110, 13, { background: '#2b2a2a' }),
      box(0, 49, 110, 0.75, { background: '#3a3d45' }),
      box(0, 60, 110, 1.5, { background: '#f2c14e' }),
      prop('lamp', 8, 0),
      prop('lamp', 92, 0),
      beam(
        [
          [10, 4],
          [18, 4],
          [64, 60],
          [38, 60],
        ],
        'rgba(255,224,138,.16)',
      ),
      beam(
        [
          [92, 4],
          [100, 4],
          [74, 60],
          [48, 60],
        ],
        'rgba(255,224,138,.16)',
      ),
      prop('podium', 6, 26),
      <div
        key={key()}
        style={at(80, 34, 22, 13, {
          display: 'grid',
          alignContent: 'center',
          justifyItems: 'center',
          gap: u(1),
          background: '#fbf7ee',
          boxShadow: FRAME,
          fontFamily: 'var(--font-pixel)',
          color: '#1a1715',
          lineHeight: 1,
        })}
      >
        <span style={{ fontSize: u(2.4), color: '#5d5a52' }}>
          {tr('1라운드')}
        </span>
        <span style={{ fontSize: u(4.2) }}>{tr('3순위')}</span>
      </div>,
      box(83, 47, 1, 13, { background: '#5e3b20' }),
      box(98, 47, 1, 13, { background: '#5e3b20' }),
      ppl(
        me('kbl', {
          acc: [...new Set([...look.acc, 'cap' as const])],
          capColor: '#4f9fdc',
        }),
        'cheer',
        42,
        5,
      ),
      crowd('press', 0, 61, 110, 11, {
        seed: 3,
        bg,
        gapY: 4,
        fade: 0.1,
        skins: ['#3a3d45', '#2f322b'],
        shirts: ['#22242a', '#2b2a2a', '#1a1715'],
      }),
    )
    // 카메라 플래시 (모션 줄이기면 숨긴다)
    if (!reduced)
      for (const [x, y, d] of [
        [6, 57, 0],
        [24, 59, 0.55],
        [47, 58, 0.2],
        [70, 60, 0.9],
        [92, 57, 0.35],
      ])
        els.push(
          prop('flash', x, y, {
            animation: `landing-flash 1.6s steps(1) ${d}s infinite`,
          }),
        )
  } else if (step === 3) {
    // NBA 홈 아레나 점프슛
    bg = '#11141c'
    els.push(
      crowd('nbaU', 0, 0, 110, 20, {
        seed: 11,
        bg,
        fade: 0.12,
        dim: 0.2,
        lights: 0.07,
        cheer: 0.3,
      }),
      <div
        key={key()}
        style={at(0, 20, 110, 3.5, {
          background: '#1a1715',
          overflow: 'hidden',
          borderTop: `${u(0.5)} solid #f07a2b`,
          borderBottom: `${u(0.5)} solid #f07a2b`,
        })}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-pixel)',
            fontSize: u(2.4),
            color: '#f07a2b',
            animation: anim('landing-scroll 8s linear infinite'),
          }}
        >
          {'BENCH TO FINALS MVP ★ '.repeat(10)}
        </div>
      </div>,
      crowd('nbaL', 0, 23, 110, 20, {
        seed: 5,
        bg,
        fade: 0.06,
        lights: 0.09,
        cheer: 0.55,
      }),
      box(0, 42, 110, 4, {
        background: '#23306b',
        borderTop: `${u(0.5)} solid #4f9fdc`,
      }),
      plate(4, 42.5, 40, 3, 'COURT CAREER', 2.2, { color: '#fbf7ee' }),
      plate(62, 42.5, 40, 3, 'COURT CAREER', 2.2, { color: '#fbf7ee' }),
      planks(46, '#e0b07a', '#d49a5e'),
      box(0, 50, 110, 2, { background: 'rgba(255,255,255,.14)' }),
      box(78, 50, 34, 24, {
        background: '#5a3fa0',
        boxShadow: `inset 0 0 0 ${u(0.75)} #fbf7ee`,
      }),
      beam(
        [
          [28, 0],
          [40, 0],
          [58, 72],
          [12, 72],
        ],
        'rgba(255,255,255,.07)',
      ),
      prop('jumbo', 37, -1),
      prop('hoopNBA', 85, 4),
    )
    // 슛 궤적 점선
    for (const [x, y] of [
      [46, 6],
      [53, 1],
      [61, -1],
      [69, -1],
      [77, 2],
      [83, 8],
    ])
      els.push(box(x + 4, y + 4, 1, 1, { background: '#f2c14e', opacity: 0.8 }))
    // 모션이 있으면 손의 공을 지우고 따로 날린다
    els.push(ppl(me('nba', { noBall: !reduced }), 'shoot', 26, 14))
    if (!reduced) {
      const [w, h] = propSize('ball')
      els.push(
        img(propURL('ball'), 38, 10, w, h, {
          animation: 'landing-ball 1.6s steps(16) infinite',
          zIndex: 2,
        }),
      )
    }
  } else {
    // 파이널 시상대
    bg = '#1a1715'
    els.push(
      box(0, 0, 110, 72, {
        background:
          'repeating-conic-gradient(from 0deg at 50% 62%, rgba(242,193,78,.16) 0deg 9deg, transparent 9deg 18deg)',
      }),
      box(0, 62, 110, 10, { background: '#2b2a2a' }),
      ppl(mate(12, 'mvp', 33), 'cheer', -2, 10, DIM),
      ppl(mate(19, 'mvp', 24), 'cheer', 15, 7, DIM),
      ppl(mate(8, 'mvp', 3), 'cheer', 66, 7, DIM),
      ppl(mate(7, 'mvp', 55), 'cheer', 82, 10, DIM),
      box(22, 61, 66, 11, {
        background: '#c99a25',
        borderTop: `${u(1.5)} solid #f2c14e`,
        boxShadow: FRAME,
      }),
      plate(30, 3, 50, 9, 'FINALS MVP', 4, {
        background: '#f2c14e',
        color: '#1a1715',
        boxShadow: FRAME,
      }),
      prop('star', 20, 3.5),
      prop('star', 81, 3.5),
      ppl(me('mvp'), 'trophy', 40, 8),
    )
    // 꽃가루: 위치·속도는 인덱스로 고정, 음수 지연으로 처음부터 흩날린다
    if (!reduced)
      for (let c = 0; c < 30; c++) {
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

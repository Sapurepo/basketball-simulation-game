import { useState } from 'react'
import { HIGH_SCHOOLS } from '../data/schools'
import { newGame } from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  ATTR_MAX,
  ATTR_MIN,
  createPlayer,
  heightRange,
  overall,
  POSITION_LABELS,
  START_TOTAL,
  STYLES,
  WEIGHT_RANGE,
  weightSpeedMod,
} from '../engine/player'
import { clamp, Rng } from '../engine/rng'
import type { AttrKey, Attributes, GameState, Position } from '../engine/types'
import { AttrBars } from './attrBars'
import { PixelPlayer } from './pixelPlayer'
import { type Pose, teamKit } from './pose'
import { ROSTER } from './sprite'
import { tr } from '../i18n'

const POSITIONS = Object.keys(POSITION_LABELS) as Position[]
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]
const STEPS = ['아바타', '기본 정보', '스카우팅 리포트', '집중 능력치']
const POSE_STRIP: [Pose, string][] = [
  ['idle', '드리블'],
  ['shoot', '슛'],
  ['cheer', '환호'],
  ['sad', '패배'],
]

export function CreateScreen({
  onStart,
  onBack,
}: {
  onStart: (s: GameState) => void
  onBack: () => void
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [position, setPosition] = useState<Position>('PG')
  const [style, setStyle] = useState(STYLES.PG[0].name)
  const [school, setSchool] = useState(HIGH_SCHOOLS[0].id)
  const [seed, setSeed] = useState(randomSeed)
  const [sel, setSel] = useState(0)
  const [num, setNum] = useState<number | null>(null)
  const [focus, setFocus] = useState<AttrKey | undefined>()
  // 스카우팅 리포트에서 손본 값. null 이면 뽑힌 값을 그대로 쓴다
  const [custom, setCustom] = useState<Attributes | null>(null)
  const [height, setHeight] = useState<number | null>(null)
  const [weight, setWeight] = useState<number | null>(null)

  const rng = new Rng(seed)
  const look = { ...ROSTER[sel].look, num: num ?? ROSTER[sel].look.num }
  const kit = teamKit(school)
  const base = createPlayer(
    rng,
    name.trim() || tr('이름 없음'),
    position,
    style,
  )
  const pool = custom ?? base.attrs
  const h = height ?? base.height
  const wt = weight ?? base.weight
  const mod = weightSpeedMod(h, wt)
  const player = {
    ...base,
    height: h,
    weight: wt,
    attrs: { ...pool, speed: clamp(pool.speed + mod, 20, 99) },
    look,
  }
  const left = START_TOTAL - ATTR_KEYS.reduce((s, k) => s + pool[k], 0)
  const [hMin, hMax] = heightRange(position)

  const choosePosition = (p: Position) => {
    setPosition(p)
    setStyle(STYLES[p][0].name)
    setCustom(null)
    setHeight(null)
    setWeight(null)
  }
  const chooseStyle = (s: string) => {
    setStyle(s)
    setCustom(null)
  }

  const last = step === STEPS.length - 1
  const canNext = step !== 1 || !!name.trim()

  return (
    <main className="create">
      <header>
        <p className="eyebrow">
          {step + 1} / {STEPS.length}
        </p>
        <h1>{tr(STEPS[step])}</h1>
      </header>

      {step === 0 && (
        <section className="panel panel-sunk pick">
          <div className="pick-head">
            <span className="tag gold">P1 SELECT</span>
            <h2>
              {tr(ROSTER[sel].name)}{' '}
              <label className="num-field">
                #
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={look.num}
                  aria-label={tr('등번호')}
                  onChange={(e) => {
                    const n = clamp(Math.round(+e.target.value) || 0, 0, 99)
                    // "07"처럼 숫자로는 같은 값이면 React 가 화면을 고치지 않아 앞자리 0이 남는다
                    e.target.value = String(n)
                    setNum(n)
                  }}
                />
              </label>
            </h2>
            <div className="pose-strip">
              {POSE_STRIP.map(([pose, label]) => (
                <figure key={pose}>
                  <PixelPlayer pose={pose} kit={kit} look={look} scale={2} />
                  <figcaption>{tr(label)}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="roster" role="group" aria-label={tr('외형 선택')}>
            {ROSTER.map((r, i) => (
              <button
                key={r.name}
                className="roster-card"
                aria-pressed={i === sel}
                onClick={() => {
                  setSel(i)
                  setNum(null)
                }}
              >
                {i === sel && <span className="tag gold">P1</span>}
                <PixelPlayer pose="idle" kit={kit} look={r.look} />
                <b>{tr(r.name)}</b>
                <small>#{r.look.num}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="panel">
          <label className="field">
            <span>{tr('선수 이름')}</span>
            <input
              value={name}
              maxLength={10}
              placeholder={tr('예: 김코트')}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="field">
            <span>{tr('포지션')}</span>
            <div className="chips">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  className={p === position ? 'chip on' : 'chip'}
                  onClick={() => choosePosition(p)}
                >
                  {p} <small>{tr(POSITION_LABELS[p])}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>{tr('플레이 스타일')}</span>
            <div className="chips">
              {STYLES[position].map((s) => (
                <button
                  key={s.name}
                  className={s.name === style ? 'chip on' : 'chip'}
                  onClick={() => chooseStyle(s.name)}
                >
                  {tr(s.name)}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>{tr('고등학교')}</span>
            <select value={school} onChange={(e) => setSchool(e.target.value)}>
              {HIGH_SCHOOLS.map((h) => (
                <option key={h.id} value={h.id}>
                  {tr(h.name)} ({tr(h.region === '경기' ? '경기도' : h.region)})
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="panel">
          <div className="row between">
            <h2>{player.name}</h2>
            <button className="ghost" onClick={() => setSeed(randomSeed())}>
              {tr('능력치 재분배')}
            </button>
          </div>
          <label className="field">
            <span>
              {tr('신장')} <b>{h}cm</b>
            </span>
            <input
              type="range"
              min={hMin}
              max={hMax}
              value={h}
              onChange={(e) => setHeight(+e.target.value)}
            />
          </label>
          <label className="field">
            <span>
              {tr('몸무게')} <b>{wt}kg</b>
              <small className="muted">
                {' '}
                · {tr('스피드')} {mod > 0 ? `+${mod}` : mod}
              </small>
            </span>
            <input
              type="range"
              min={WEIGHT_RANGE[0]}
              max={WEIGHT_RANGE[1]}
              value={wt}
              onChange={(e) => setWeight(+e.target.value)}
            />
          </label>
          <div className="kv">
            <span>{tr('오버롤')}</span>
            <b>{overall(player)}</b>
            <span>{tr('남은 포인트')}</span>
            <b>{left}</b>
          </div>
          <AttrBars
            attrs={player.attrs}
            keys={ATTR_KEYS}
            labels={ATTR_LABELS}
            adjust={{
              onChange: (k, d) => setCustom({ ...pool, [k]: pool[k] + d }),
              limits: (k) => ({
                up: left > 0 && pool[k] < ATTR_MAX,
                down: pool[k] > ATTR_MIN,
              }),
            }}
          />
          <p className="muted">
            {tr(
              '능력치는 {min}~{max} 사이에서 총합 {total} 포인트를 나눠 가져요.',
              {
                min: ATTR_MIN,
                max: ATTR_MAX,
                total: START_TOTAL,
              },
            )}
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="panel">
          <p className="muted">
            {tr(
              '첫 시즌에 집중해서 키울 능력치예요. 이후에는 매년 오프시즌에 다시 고를 수 있어요.',
            )}
          </p>
          <div className="options">
            <button
              className={focus ? 'option' : 'option on'}
              onClick={() => setFocus(undefined)}
            >
              <b>{tr('균형 성장')}</b>
              <small>{tr('모든 능력치를 고르게')}</small>
            </button>
            {ATTR_KEYS.map((k) => (
              <button
                key={k}
                className={k === focus ? 'option on' : 'option'}
                onClick={() => setFocus(k)}
              >
                <b>{tr(ATTR_LABELS[k])}</b>
                <small>
                  {tr('현재')} {Math.round(player.attrs[k])}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="row">
        <button
          className="ghost"
          onClick={() => (step ? setStep(step - 1) : onBack())}
        >
          {tr('이전')}
        </button>
        <button
          className="primary grow"
          disabled={!canNext}
          onClick={() =>
            last
              ? onStart(newGame(rng.state, player, school, focus))
              : setStep(step + 1)
          }
        >
          {last ? tr('고1 시즌 시작') : tr('다음')}
        </button>
      </div>
    </main>
  )
}

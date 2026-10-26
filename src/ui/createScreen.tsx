import { useState } from 'react'
import { HIGH_SCHOOLS } from '../data/schools'
import { newGame } from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  createPlayer,
  overall,
  POSITION_LABELS,
  potentialGrade,
  STYLES,
} from '../engine/player'
import { Rng } from '../engine/rng'
import type { GameState, Position } from '../engine/types'
import { AttrBars } from './attrBars'
import { PixelPlayer } from './pixelPlayer'
import { HAIRS, SKINS, teamKit } from './pose'

const POSITIONS = Object.keys(POSITION_LABELS) as Position[]
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]

export function CreateScreen({ onStart }: { onStart: (s: GameState) => void }) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState<Position>('PG')
  const [style, setStyle] = useState(STYLES.PG[0].name)
  const [school, setSchool] = useState(HIGH_SCHOOLS[0].id)
  const [seed, setSeed] = useState(randomSeed)
  const [skin, setSkin] = useState(0)
  const [hair, setHair] = useState(0)

  const rng = new Rng(seed)
  const player = {
    ...createPlayer(rng, name.trim() || '이름 없음', position, style),
    look: { skin, hair },
  }

  const choosePosition = (p: Position) => {
    setPosition(p)
    setStyle(STYLES[p][0].name)
  }

  return (
    <main className="create">
      <header className="hero">
        <p className="eyebrow">농구 커리어 시뮬레이션</p>
        <h1>코트에서 파이널까지</h1>
        <p className="muted">
          고교 농구부 벤치에서 시작해 KBL, 그리고 NBA 파이널 MVP까지.
        </p>
      </header>

      <section className="panel">
        <label className="field">
          <span>선수 이름</span>
          <input
            value={name}
            maxLength={10}
            placeholder="예: 김코트"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="field">
          <span>포지션</span>
          <div className="chips">
            {POSITIONS.map((p) => (
              <button
                key={p}
                className={p === position ? 'chip on' : 'chip'}
                onClick={() => choosePosition(p)}
              >
                {p} <small>{POSITION_LABELS[p]}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>플레이 스타일</span>
          <div className="chips">
            {STYLES[position].map((s) => (
              <button
                key={s.name}
                className={s.name === style ? 'chip on' : 'chip'}
                onClick={() => setStyle(s.name)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>외형</span>
          <div className="look">
            <PixelPlayer pose="idle" kit={teamKit(school)} look={player.look} />
            <div className="field">
              <div className="swatches" role="group" aria-label="피부색">
                <small className="muted">피부</small>
                {SKINS.map((c, i) => (
                  <button
                    key={c}
                    className={i === skin ? 'swatch on' : 'swatch'}
                    style={{ background: c }}
                    aria-label={`피부색 ${i + 1}`}
                    onClick={() => setSkin(i)}
                  />
                ))}
              </div>
              <div className="swatches" role="group" aria-label="머리색">
                <small className="muted">머리</small>
                {HAIRS.map((c, i) => (
                  <button
                    key={c}
                    className={i === hair ? 'swatch on' : 'swatch'}
                    style={{ background: c }}
                    aria-label={`머리색 ${i + 1}`}
                    onClick={() => setHair(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <label className="field">
          <span>고등학교</span>
          <select value={school} onChange={(e) => setSchool(e.target.value)}>
            {HIGH_SCHOOLS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.region})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel">
        <div className="row between">
          <h2>스카우팅 리포트</h2>
          <button className="ghost" onClick={() => setSeed(randomSeed())}>
            다시 뽑기
          </button>
        </div>
        <div className="kv">
          <span>신장</span>
          <b>{player.height}cm</b>
          <span>오버롤</span>
          <b>{overall(player)}</b>
          <span>잠재력 등급</span>
          <b>{potentialGrade(player.potential)}</b>
        </div>
        <AttrBars attrs={player.attrs} keys={ATTR_KEYS} labels={ATTR_LABELS} />
      </section>

      <button
        className="primary big"
        disabled={!name.trim()}
        onClick={() => onStart(newGame(rng.state, player, school))}
      >
        고1 시즌 시작
      </button>
    </main>
  )
}

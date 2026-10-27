import { useEffect, useState } from 'react'
import type { HallEntry } from '../engine/save'
import type { GameState } from '../engine/types'
import { PixelPlayer } from './pixelPlayer'
import { type Kit, type Pose, teamKit } from './pose'
import { iconURL } from './sprite'

// 벤치 → 파엠: 마일스톤마다 포즈·유니폼·캡션을 바꿔가며 순환 재생
const MILESTONES: { label: string; caption: string; pose: Pose; kit: Kit }[] = [
  {
    label: '벤치',
    caption: '고1, 벤치 끝자리에서 출전을 기다리고',
    pose: 'sad',
    kit: teamKit('yongsan'),
  },
  {
    label: '데뷔',
    caption: '첫 출전, 공을 잡고 코트를 누벼',
    pose: 'idle',
    kit: teamKit('yongsan'),
  },
  {
    label: '프로 입성',
    caption: 'KBL 드래프트 지명, 프로 무대에 입성하고',
    pose: 'cheer',
    kit: teamKit('kbl'),
  },
  {
    label: 'NBA',
    caption: '꿈에 그리던 NBA 진출, 세계 최고의 무대에서 슛',
    pose: 'shoot',
    kit: teamKit('nba'),
  },
  {
    label: '파엠',
    caption: '불가능이라 여겼던 파이널 MVP를 거머쥐다',
    pose: 'celebrate',
    kit: { jersey: '#f2c14e', number: '#1b2230' },
  },
]
const STEP_MS = 1800

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

function useMilestoneLoop() {
  // 모션 줄이기: 순환 없이 마지막 장면 고정
  const [i, setI] = useState(() =>
    reducedMotion() ? MILESTONES.length - 1 : 0,
  )
  useEffect(() => {
    if (reducedMotion()) return
    const id = setInterval(
      () => setI((n) => (n + 1) % MILESTONES.length),
      STEP_MS,
    )
    return () => clearInterval(id)
  }, [])
  return i
}

export function LandingScreen({
  state,
  hall,
  onContinue,
  onNew,
}: {
  state: GameState | null
  hall: HallEntry[]
  onContinue: () => void
  onNew: () => void
}) {
  const step = useMilestoneLoop()
  const m = MILESTONES[step]

  return (
    <main className="landing">
      <section className="panel">
        <p className="eyebrow">
          국내 고교 유망주가 꿈꾸는 NBA 입성, 그리고 파이널 MVP.
        </p>
        <h1 className="title">
          벤치에서
          <br />
          파엠까지
        </h1>
        <p className="muted">
          한 시즌의 활약과 선택이 쌓여 커리어가 돼요.
          <br />
          KBL 데뷔, 국가대표, NBA 파이널 MVP까지 도전해 보세요.
        </p>
      </section>

      <section className="panel center">
        <PixelPlayer
          key={step}
          pose={m.pose}
          kit={m.kit}
          look={state?.player.look}
        />
        <p className="muted caption" key={`c${step}`}>
          {m.caption}
        </p>
        <ol className="milestones">
          {MILESTONES.map((x, i) => (
            <li key={x.label} className={i <= step ? 'on' : undefined}>
              {x.label}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>명예의 전당</h2>
        {hall.length ? (
          <ol className="hall">
            {hall.map((e, i) => (
              <li key={`${e.name}-${e.year}-${i}`}>
                <b className="rank">{i + 1}</b>
                <PixelPlayer
                  pose="idle"
                  kit={teamKit(e.name)}
                  look={e.look}
                  scale={1}
                />
                <span className="grow">
                  {e.name} <small className="muted">{e.position}</small>
                </span>
                <span className="row nowrap">
                  <img className="px" src={iconURL('trophy')} alt="트로피" />
                  {e.trophies}
                </span>
                <b>OVR {e.peakOvr}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">
            아직 기록이 없어요. 커리어를 마치면 이 브라우저에 남습니다.
          </p>
        )}
      </section>

      <div className="cta">
        {state && (
          <button className="ghost big" onClick={onContinue}>
            이어하기
          </button>
        )}
        <button className="primary big" onClick={onNew}>
          새로운 인생 시작하기
        </button>
      </div>
    </main>
  )
}

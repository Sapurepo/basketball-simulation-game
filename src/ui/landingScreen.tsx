import { useEffect, useState } from 'react'
import type { HallEntry } from '../engine/save'
import type { GameState } from '../engine/types'
import { HallBoard } from './hallBoard'
import { PixelPlayer } from './pixelPlayer'
import { tr } from '../i18n'
import { type Kit, type Pose, teamKit } from './pose'

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
  onOpenRanking,
}: {
  state: GameState | null
  hall: HallEntry[]
  onContinue: () => void
  onNew: () => void
  onOpenRanking: () => void
}) {
  const step = useMilestoneLoop()
  const m = MILESTONES[step]

  return (
    <main className="landing">
      <section className="panel">
        <p className="eyebrow">
          {tr('국내 고교 유망주가 꿈꾸는 NBA 입성, 그리고 파이널 MVP.')}
        </p>
        <h1 className="title">
          {tr('벤치에서')}
          <br />
          {tr('파엠까지')}
        </h1>
        <p className="muted">
          {tr('한 시즌의 활약과 선택이 쌓여 커리어가 돼요.')}
          <br />
          {tr('KBL 데뷔, 국가대표, NBA 파이널 MVP까지 도전해 보세요.')}
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
          {tr(m.caption)}
        </p>
        <ol className="milestones">
          {MILESTONES.map((x, i) => (
            <li key={x.label} className={i <= step ? 'on' : undefined}>
              {tr(x.label)}
            </li>
          ))}
        </ol>
      </section>

      <HallBoard mine={hall} onOpenRanking={onOpenRanking} />

      <div className="cta">
        {state && (
          <button className="ghost big" onClick={onContinue}>
            {tr('이어하기')}
          </button>
        )}
        <button className="primary big" onClick={onNew}>
          {tr('새로운 인생 시작하기')}
        </button>
      </div>
    </main>
  )
}

import { useEffect, useState } from 'react'
import type { HallEntry } from '../engine/save'
import type { GameState } from '../engine/types'
import { HallBoard } from './hallBoard'
import { tr } from '../i18n'
import { useFrame } from './frame'
import { MilestoneScene } from './milestoneScene'
import { DEFAULT_LOOK } from './sprite'

// 벤치 → 파엠: 마일스톤마다 장면·캡션을 바꿔가며 순환 재생
const MILESTONES: { label: string; caption: string }[] = [
  {
    label: '벤치',
    caption: '고1, 벤치 끝자리에서 출전을 기다리고',
  },
  {
    label: '데뷔',
    caption: '첫 출전, 공을 잡고 코트를 누벼',
  },
  {
    label: '프로 입성',
    caption: 'KBL 드래프트 지명, 프로 무대에 입성하고',
  },
  {
    label: 'NBA',
    caption: '꿈에 그리던 NBA 진출, 세계 최고의 무대에서 슛',
  },
  {
    label: '파엠',
    caption: '불가능이라 여겼던 파이널 MVP를 거머쥐다',
  },
]
const STEP_MS = 3200
const TYPE_MS = 70

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

function useMilestoneLoop() {
  // 모션 줄이기: 순환 없이 마지막 장면 고정
  const [reduced] = useState(reducedMotion)
  const [step, setStep] = useState(reduced ? MILESTONES.length - 1 : 0)
  // 단계가 바뀔 때마다 타이머를 새로 잡아 직접 고른 단계도 한 박자 온전히 보여준다
  useEffect(() => {
    if (reduced) return
    const id = setTimeout(
      () => setStep((n) => (n + 1) % MILESTONES.length),
      STEP_MS,
    )
    return () => clearTimeout(id)
  }, [step, reduced])
  return { reduced, step, setStep }
}

// 한 글자씩 타이핑. 단계마다 key 로 새로 마운트해 처음부터 친다
function Typed({ text, instant }: { text: string; instant: boolean }) {
  const [n, setN] = useState(instant ? text.length : 0)
  useEffect(() => {
    if (n >= text.length) return
    const id = setTimeout(() => setN(n + 1), TYPE_MS)
    return () => clearTimeout(id)
  }, [n, text])
  return (
    <p className="caption">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, n) || '\u00a0'}</span>
      <span className="cursor" aria-hidden="true" />
    </p>
  )
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
  const { reduced, step, setStep } = useMilestoneLoop()
  const frame = useFrame()
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

      <section className="panel milestone">
        <MilestoneScene
          key={step}
          step={step}
          look={state?.player.look ?? DEFAULT_LOOK}
          frame={frame}
          reduced={reduced}
        />
        <div className="milestone-body">
          <Typed key={step} text={tr(m.caption)} instant={reduced} />
          <ol className="milestones">
            {MILESTONES.map((x, i) => (
              <li
                key={x.label}
                className={i < step ? 'done' : i === step ? 'now' : undefined}
              >
                <button
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => setStep(i)}
                >
                  {tr(x.label)}
                </button>
              </li>
            ))}
          </ol>
        </div>
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

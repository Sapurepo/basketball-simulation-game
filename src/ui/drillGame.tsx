import type { DrillKind, Look } from '../engine/types'
import { DribbleDrill } from './dribbleDrill'
import { PassDrill } from './passDrill'
import type { Kit } from './pose'
import { ShootDrill } from './shootDrill'

// 훈련 종류별 미니게임
export function DrillGame({
  kind,
  kit,
  look,
  onDone,
}: {
  kind: DrillKind
  kit: Kit
  look?: Look
  onDone: (made: number) => void
}) {
  if (kind === 'passDrill') return <PassDrill kit={kit} onDone={onDone} />
  if (kind === 'dribbleDrill')
    return <DribbleDrill kit={kit} look={look} onDone={onDone} />
  return <ShootDrill onDone={onDone} />
}

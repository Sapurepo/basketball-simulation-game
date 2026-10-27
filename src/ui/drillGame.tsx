import { DRILLS } from '../engine/events'
import type { Attributes, DrillKind, Look } from '../engine/types'
import { DribbleDrill } from './dribbleDrill'
import { PassDrill } from './passDrill'
import type { Kit } from './pose'
import { ShootDrill } from './shootDrill'

// 훈련 종류별 미니게임. 게이지 훈련은 해당 능력치가 높을수록 초록 구간이 넓다
export function DrillGame({
  kind,
  kit,
  look,
  attrs,
  onDone,
}: {
  kind: DrillKind
  kit: Kit
  look?: Look
  attrs: Attributes
  onDone: (made: number) => void
}) {
  const skill = attrs[DRILLS[kind].attr]
  if (kind === 'passDrill')
    return <PassDrill kit={kit} skill={skill} onDone={onDone} />
  if (kind === 'dribbleDrill')
    return <DribbleDrill kit={kit} look={look} onDone={onDone} />
  return <ShootDrill skill={skill} onDone={onDone} />
}

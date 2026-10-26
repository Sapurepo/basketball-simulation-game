import type { Rng } from './rng'
import type { StatLine } from './types'

type Kind =
  | 'made2'
  | 'miss2'
  | 'made3'
  | 'miss3'
  | 'ft'
  | 'reb'
  | 'ast'
  | 'stl'
  | 'blk'
  | 'mate'
  | 'opp'

interface Ev {
  t: number
  kind: Kind
  pts: number
  // 자유투 묶음: [성공, 시도]
  ft?: [number, number]
}

const TEXT: Record<Exclude<Kind, 'mate' | 'opp' | 'ft'>, string[]> = {
  made2: [
    '{p}, 돌파 후 레이업 성공!',
    '{p}, 미드레인지 점퍼가 그물을 가릅니다.',
    '{p}, 포스트업에서 훅슛 성공.',
    '{p}, 속공 마무리!',
  ],
  miss2: [
    '{p}의 레이업, 림을 돌아 나옵니다.',
    '{p}, 점퍼가 짧았습니다.',
    '{p}, 블록에 막힙니다.',
  ],
  made3: [
    '{p}, 탑에서 3점슛! 들어갑니다!',
    '{p}, 코너 3점 성공!',
    '{p}, 스텝백 3점! 깔끔합니다.',
    '{p}, 딥쓰리 꽂아 넣습니다!',
  ],
  miss3: ['{p}의 3점슛, 빗나갑니다.', '{p}의 3점 시도, 림을 맞고 튑니다.'],
  reb: ['{p}, 리바운드 잡아냅니다.', '{p}, 공격 리바운드 따냅니다!'],
  ast: [
    '{p}의 노룩 패스, 동료가 마무리합니다.',
    '{p}, 킥아웃 패스로 어시스트.',
    '{p}의 앨리웁 패스! 어시스트 기록.',
  ],
  stl: ['{p}, 패스 길목을 읽고 스틸!', '{p}, 가로채기 성공!'],
  blk: ['{p}, 블록슛! 그대로 쳐냅니다!', '{p}, 림 프로텍팅! 블록 기록.'],
}

function chunks(rng: Rng, total: number): number[] {
  const out: number[] = []
  let left = total
  while (left > 0) {
    const c = left >= 3 && rng.chance(0.3) ? 3 : left >= 2 ? 2 : 1
    out.push(c)
    left -= c
  }
  return out
}

export function generatePbp(
  rng: Rng,
  name: string,
  myTeam: string,
  opp: string,
  box: StatLine,
  myScore: number,
  oppScore: number,
  quarterMinutes: number,
): string[] {
  const qSec = quarterMinutes * 60
  const total = qSec * 4
  const t = () => rng.int(0, total - 1)
  const evs: Ev[] = []
  const push = (kind: Kind, n: number, pts = 0) => {
    for (let i = 0; i < n; i++) evs.push({ t: t(), kind, pts })
  }

  const two = box.fgm - box.tpm
  push('made2', two, 2)
  push('miss2', box.fga - box.tpa - two)
  push('made3', box.tpm, 3)
  push('miss3', box.tpa - box.tpm)
  push('reb', box.reb)
  push('stl', box.stl)
  push('blk', box.blk)
  let ftLeft = box.fta
  let ftMadeLeft = box.ftm
  while (ftLeft > 0) {
    const a = Math.min(2, ftLeft)
    const m = Math.min(a, ftMadeLeft)
    evs.push({ t: t(), kind: 'ft', pts: m, ft: [m, a] })
    ftLeft -= a
    ftMadeLeft -= m
  }
  // 어시스트는 동료 득점 2점을 함께 소비한다
  let matePts = myScore - box.pts
  const ast = Math.min(box.ast, Math.floor(matePts / 2))
  push('ast', ast, 2)
  matePts -= ast * 2
  for (const c of chunks(rng, matePts))
    evs.push({ t: t(), kind: 'mate', pts: c })
  for (const c of chunks(rng, oppScore))
    evs.push({ t: t(), kind: 'opp', pts: c })
  evs.sort((a, b) => a.t - b.t)

  const lines: string[] = [`${myTeam} vs ${opp} — 경기 시작!`]
  let me = 0
  let op = 0
  let q = 1
  const clock = (sec: number) => {
    const left = qSec - (sec % qSec)
    const m = Math.floor(left / 60)
    const s = left % 60
    return `${Math.floor(sec / qSec) + 1}Q ${m}:${String(s).padStart(2, '0')}`
  }
  for (const e of evs) {
    const eq = Math.floor(e.t / qSec) + 1
    while (q < eq) {
      lines.push(`— ${q}쿼터 종료 (${me}-${op}) —`)
      q++
    }
    if (e.kind === 'opp') {
      op += e.pts
      continue
    }
    me += e.pts
    if (e.kind === 'mate') continue
    let text: string
    if (e.kind === 'ft') {
      const [m, a] = e.ft!
      text = `{p}, 자유투 ${a}개 중 ${m}개 성공.`
    } else {
      text = rng.pick(TEXT[e.kind])
    }
    const late = e.t >= total - 60 && Math.abs(me - op) <= 3 && e.pts >= 2
    lines.push(
      `[${clock(e.t)}] ${text.replace('{p}', name)} (${me}-${op})${late ? ' ★ 승부처!' : ''}`,
    )
  }
  while (q <= 4) {
    lines.push(`— ${q}쿼터 종료 (${me}-${op}) —`)
    q++
  }
  lines.push(
    `경기 종료. ${myTeam} ${myScore} : ${oppScore} ${opp} — ${name} ${box.pts}득점 ${box.reb}리바운드 ${box.ast}어시스트`,
  )
  return lines
}

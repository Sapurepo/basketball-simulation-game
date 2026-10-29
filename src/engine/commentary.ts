import { T } from '../i18n'
import type { Rng } from './rng'
import type { Cast, Play, PlayKind, StatLine } from './types'

type Kind = Exclude<PlayKind, 'start' | 'qend' | 'end'>

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

// 슛 시도 문장: 결과를 미리 말하지 않는다
const PRE2 = [
  '{p}, 공을 잡고 공격을 시작합니다',
  '{p}, 수비수를 앞에 두고 기회를 엿봅니다',
  '{p}, 페인트존으로 파고듭니다',
]
const PRE3 = [
  '{p}, 3점 라인 밖에서 슛',
  '{p}, 스텝백 3점 시도',
  '{p}, 코너에서 3점을 노립니다',
]
// 동료·상대 득점은 팀 단위로 중계한다 (득점 1~3점)
const TEAM_TEXT = ['{t}, 자유투로 1점.', '{t}, 2점 득점.', '{t}, 3점슛 성공!']

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

export function generateCast(
  rng: Rng,
  name: string,
  myTeam: string,
  opp: string,
  box: StatLine,
  myScore: number,
  oppScore: number,
  quarterMinutes: number,
): Cast {
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

  let me = 0
  let op = 0
  let q = 1
  const plays: Play[] = [
    {
      t: 0,
      kind: 'start',
      pts: 0,
      me,
      op,
      text: { k: '{a} vs {b} — 경기 시작!', v: { a: T(myTeam), b: T(opp) } },
    },
  ]
  const quarterEnd = () => {
    plays.push({
      t: q * qSec,
      kind: 'qend',
      pts: 0,
      me,
      op,
      text: { k: '— {q}쿼터 종료 ({me}-{op}) —', v: { q, me, op } },
    })
    q++
  }
  // 시도 문장은 시각으로 고른다 (공유 난수를 더 쓰면 시즌 결과가 바뀐다)
  const at = (list: string[], sec: number) => list[sec % list.length]
  for (const e of evs) {
    while (q < Math.floor(e.t / qSec) + 1) quarterEnd()
    if (e.kind === 'opp') op += e.pts
    else me += e.pts
    const play: Play = { t: e.t, kind: e.kind, pts: e.pts, me, op, text: '' }
    // 중계 문장은 템플릿 안에 템플릿: text 의 {p} 는 선수 이름을 원문 그대로 넣는다
    if (e.kind === 'mate' || e.kind === 'opp') {
      play.text = {
        k: TEAM_TEXT[e.pts - 1],
        v: { t: T(e.kind === 'opp' ? opp : myTeam) },
      }
      // 3점과 마지막 2분만 중계하고 나머지는 점수·시계에만 반영한다
      if (e.pts < 3 && e.t < total - 120) play.quiet = true
    } else if (e.kind === 'ft') {
      const [m, a] = e.ft!
      play.text = {
        k: '{p}, 자유투 {a}개 중 {m}개 성공.',
        v: { p: name, a, m },
      }
      play.pre = { k: '{p}, 자유투 라인에 섭니다', v: { p: name } }
    } else {
      play.text = { k: rng.pick(TEXT[e.kind]), v: { p: name } }
      const pre =
        e.kind === 'made2' || e.kind === 'miss2'
          ? at(PRE2, e.t)
          : e.kind === 'made3' || e.kind === 'miss3'
            ? at(PRE3, e.t)
            : e.kind === 'ast'
              ? '{p}, 패스할 곳을 찾습니다'
              : null
      if (pre) play.pre = { k: pre, v: { p: name } }
    }
    if (e.t >= total - 60 && Math.abs(me - op) <= 3 && e.pts >= 2)
      play.hot = true
    plays.push(play)
  }
  // 4쿼터 종료는 경기 종료 장면이 대신한다
  while (q < 4) quarterEnd()
  plays.push({
    t: total,
    kind: 'end',
    pts: 0,
    me,
    op,
    text: {
      k: '경기 종료. {a} {as} : {bs} {b} — {p} {pts}득점 {reb}리바운드 {ast}어시스트',
      v: {
        a: T(myTeam),
        as: myScore,
        bs: oppScore,
        b: T(opp),
        p: name,
        pts: box.pts,
        reb: box.reb,
        ast: box.ast,
      },
    },
  })
  return { team: myTeam, quarterMinutes, plays }
}

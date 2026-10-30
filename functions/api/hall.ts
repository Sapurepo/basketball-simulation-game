import {
  HALL_PERIODS,
  HALL_TOP,
  type HallPeriod,
  periodStart,
  validateHall,
} from '../../src/engine/hallEntry'

// 공용 명예의 전당 API (Cloudflare Pages Function, D1 바인딩 DB)
// GET  /api/hall?sort=ovr|fmvp|titles|earnings|minutes|pts|ast&size=N → { rows(순위 포함), total }, 상위 100명까지
// GET  /api/hall?sort=…&best=1 → 포지션별 1위 (베스트 5), rank 는 전체 순위
//      &league=KBL|NBA 는 그 리그를 한 시즌이라도 뛴 선수만 (total 도 그 기준)
//      &period=day|week|month 는 KST 기준 오늘·이번 주·이번 달에 등록된 기록만 (순위·total 도 그 안에서)
// POST /api/hall { entry, token }       → Turnstile 확인 후 등록

// ponytail: 쓰는 메서드만 최소 타입으로 둔다. 더 쓰면 @cloudflare/workers-types 도입
interface D1Stmt {
  bind(...v: unknown[]): D1Stmt
  all<T>(): Promise<{ results: T[] }>
  first<T>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number } }>
}
interface Env {
  DB: { prepare(sql: string): D1Stmt }
  TURNSTILE_SECRET: string
}
type Ctx = {
  request: Request
  env: Env
  waitUntil(p: Promise<unknown>): void
}

// IP 하나당 1시간 등록 수, IP 해시 보관 시간
const RATE_LIMIT = 5
const HOUR = 3_600_000
const IP_HASH_TTL = 24 * HOUR

// 이전 행(마이그레이션 전 등록)은 새 열이 NULL 이라 그 정렬에서는 뒤로 보낸다
const ORDER = {
  ovr: 'peak_ovr DESC, fmvp DESC, created_at',
  fmvp: 'fmvp DESC, peak_ovr DESC, created_at',
  titles: 'kbl_titles DESC NULLS LAST, peak_ovr DESC, created_at',
  earnings: 'earnings DESC NULLS LAST, peak_ovr DESC, created_at',
  minutes: 'minutes DESC NULLS LAST, peak_ovr DESC, created_at',
  pts: 'pts DESC NULLS LAST, peak_ovr DESC, created_at',
  ast: 'ast DESC NULLS LAST, peak_ovr DESC, created_at',
}
type Sort = keyof typeof ORDER
const SORTS = Object.keys(ORDER) as Sort[]
const LEAGUES = ['', 'KBL', 'NBA'] as const
type League = (typeof LEAGUES)[number]
const isLeague = (v: string): v is League =>
  (LEAGUES as readonly string[]).includes(v)
const isPeriod = (v: string): v is HallPeriod =>
  (HALL_PERIODS as string[]).includes(v)

const json = (body: unknown, status = 200, cacheControl?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(cacheControl && { 'cache-control': cacheControl }),
    },
  })

// 조회는 전체 스캔(COUNT·윈도)이라 정렬·종류별 상위 100명을 엣지에 1분 담아 두고 size 는 잘라서 준다.
// 등록되면 지워서 방금 올린 기록이 바로 보이게 한다 (캐시는 데이터센터마다 따로라 같은 곳만)
const CACHE_TTL = 60
const edge = () => (caches as unknown as { default: Cache }).default
const cacheKey = (
  request: Request,
  sort: Sort,
  league: League,
  period: HallPeriod,
  best: boolean,
) =>
  new Request(
    new URL(
      `/api/hall?sort=${sort}&league=${league}&period=${period}${best ? '&best=1' : ''}`,
      request.url,
    ),
  )
type HallBody = { total: number; rows: unknown[] }

export async function onRequestGet(ctx: Ctx) {
  const { request, env } = ctx
  const url = new URL(request.url)
  const sortParam = url.searchParams.get('sort') ?? ''
  const sort: Sort = (SORTS as string[]).includes(sortParam)
    ? (sortParam as Sort)
    : 'ovr'
  const leagueParam = url.searchParams.get('league') ?? ''
  const league: League = isLeague(leagueParam) ? leagueParam : ''
  const periodParam = url.searchParams.get('period') ?? ''
  const period: HallPeriod = isPeriod(periodParam) ? periodParam : 'all'
  const size = Math.max(
    1,
    Math.min(
      HALL_TOP,
      Math.floor(Number(url.searchParams.get('size'))) || HALL_TOP,
    ),
  )
  const best = !!url.searchParams.get('best')
  const key = cacheKey(request, sort, league, period, best)
  const hit = await edge().match(key)
  const body: HallBody = hit
    ? await hit.json()
    : await queryHall(env, sort, league, period, best)
  if (!hit)
    ctx.waitUntil(
      edge().put(key, json(body, 200, `public, s-maxage=${CACHE_TTL}`)),
    )
  return json(best ? body : { ...body, rows: body.rows.slice(0, size) })
}

async function queryHall(
  env: Env,
  sort: Sort,
  league: League,
  period: HallPeriod,
  best: boolean,
): Promise<HallBody> {
  const cols = `id, name, position, look, peak_ovr AS peakOvr, fmvp, trophies, seasons,
    retired_year AS retiredYear, kbl_titles AS kblTitles, earnings, minutes, pts, ast`
  // 기간 시작은 서버가 계산한 숫자라 그대로 넣는다 (캐시 1분이라 자정 경계는 최대 1분 늦다)
  const conds = [
    ...(league ? [`${league === 'NBA' ? 'nba' : 'kbl'} = 1`] : []),
    ...(period === 'all'
      ? []
      : [`created_at >= ${periodStart(period, Date.now())}`]),
  ]
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  // 베스트 5: 전체 순위를 매긴 뒤 포지션마다 가장 앞선 한 명
  const sql = best
    ? `SELECT ${cols}, rank FROM (
         SELECT *, ROW_NUMBER() OVER (ORDER BY ${ORDER[sort]}) AS rank,
           ROW_NUMBER() OVER (PARTITION BY position ORDER BY ${ORDER[sort]}) AS pos_rank
         FROM hall ${where})
       WHERE pos_rank = 1 ORDER BY rank`
    : `SELECT ${cols}, ROW_NUMBER() OVER (ORDER BY ${ORDER[sort]}) AS rank
       FROM hall ${where} ORDER BY ${ORDER[sort]} LIMIT ${HALL_TOP}`
  const [{ results }, count] = await Promise.all([
    env.DB.prepare(sql).all<
      Record<string, unknown> & { look: string | null }
    >(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM hall ${where}`).first<{
      n: number
    }>(),
  ])
  return {
    total: count?.n ?? 0,
    rows: results.map((r) => ({
      ...r,
      look: r.look ? JSON.parse(r.look) : null,
    })),
  }
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function onRequestPost({ request, env }: Ctx) {
  const body = (await request.json().catch(() => null)) as {
    entry?: unknown
    token?: unknown
  } | null
  if (!body || typeof body.token !== 'string')
    return json({ error: '형식 오류' }, 400)

  const ip = request.headers.get('CF-Connecting-IP') ?? ''
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', body.token)
  form.append('remoteip', ip)
  const check = (await (
    await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
  ).json()) as { success: boolean }
  if (!check.success) return json({ error: '봇 확인에 실패했어요' }, 403)

  const entry = validateHall(body.entry)
  if (typeof entry === 'string') return json({ error: entry }, 400)

  const now = Date.now()
  // IP 는 원문 대신 시크릿을 섞은 해시로만, 하루 지나면 지운다 (등록 횟수 제한 용도)
  const ipHash = await sha256(ip + env.TURNSTILE_SECRET)
  await env.DB.prepare(
    `UPDATE hall SET ip_hash = '' WHERE ip_hash != '' AND created_at < ?`,
  )
    .bind(now - IP_HASH_TTL)
    .run()
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM hall WHERE ip_hash = ? AND created_at > ?',
  )
    .bind(ipHash, now - HOUR)
    .first<{ n: number }>()
  if ((recent?.n ?? 0) >= RATE_LIMIT)
    return json({ error: '잠시 후 다시 등록해 주세요' }, 429)

  // 같은 커리어는 한 번만 (id 기본키)
  const { meta } = await env.DB.prepare(
    `INSERT OR IGNORE INTO hall (id, name, position, look, peak_ovr, fmvp, trophies,
       seasons, retired_year, ip_hash, created_at, kbl, nba, kbl_titles, earnings, minutes, pts, ast)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      entry.id,
      entry.name,
      entry.position,
      entry.look ? JSON.stringify(entry.look) : null,
      entry.peakOvr,
      entry.fmvp,
      entry.trophies,
      entry.seasons,
      entry.retiredYear,
      ipHash,
      now,
      entry.kbl ? 1 : 0,
      entry.nba ? 1 : 0,
      entry.kblTitles,
      entry.earnings,
      entry.minutes,
      entry.pts,
      entry.ast,
    )
    .run()
  if (meta.changes)
    await Promise.all(
      SORTS.flatMap((sort) =>
        LEAGUES.flatMap((league) =>
          HALL_PERIODS.flatMap((period) =>
            [false, true].map((best) =>
              edge().delete(cacheKey(request, sort, league, period, best)),
            ),
          ),
        ),
      ),
    )
  return json(
    { ok: true, duplicate: meta.changes === 0 },
    meta.changes ? 201 : 200,
  )
}

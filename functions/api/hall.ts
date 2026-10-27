import { HALL_PAGE_SIZE, validateHall } from '../../src/engine/hallEntry'

// 공용 명예의 전당 API (Cloudflare Pages Function, D1 바인딩 DB)
// GET  /api/hall?sort=ovr|fmvp&page=N&size=M → { rows(순위 포함), total }, 기본 50명씩
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
type Ctx = { request: Request; env: Env }

// IP 하나당 1시간 등록 수, IP 해시 보관 시간
const RATE_LIMIT = 5
const HOUR = 3_600_000
const IP_HASH_TTL = 24 * HOUR

const ORDER = {
  ovr: 'peak_ovr DESC, fmvp DESC, created_at',
  fmvp: 'fmvp DESC, peak_ovr DESC, created_at',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export async function onRequestGet({ request, env }: Ctx) {
  const url = new URL(request.url)
  const q = (k: string) => Number(url.searchParams.get(k)) || 0
  const sort = url.searchParams.get('sort') === 'fmvp' ? 'fmvp' : 'ovr'
  const size = Math.max(
    1,
    Math.min(HALL_PAGE_SIZE, q('size') || HALL_PAGE_SIZE),
  )
  const offset = Math.max(0, Math.min(10_000, q('page'))) * size
  const [{ results }, count] = await Promise.all([
    env.DB.prepare(
      `SELECT id, name, position, look, peak_ovr AS peakOvr, fmvp, trophies, seasons,
         retired_year AS retiredYear FROM hall ORDER BY ${ORDER[sort]} LIMIT ? OFFSET ?`,
    )
      .bind(size, offset)
      .all<Record<string, unknown> & { look: string | null }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM hall').first<{ n: number }>(),
  ])
  return json({
    total: count?.n ?? 0,
    rows: results.map((r, i) => ({
      ...r,
      rank: offset + i + 1,
      look: r.look ? JSON.parse(r.look) : null,
    })),
  })
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
       seasons, retired_year, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    )
    .run()
  return json(
    { ok: true, duplicate: meta.changes === 0 },
    meta.changes ? 201 : 200,
  )
}

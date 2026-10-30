// 도메인 이사: 이전 주소(bench-to-mvp.pages.dev)의 세이브·내 기록을 새 주소로 넘긴다.
// localStorage 는 주소마다 따로라서, 이전 주소에서 데이터를 gzip+base64url 로 묶어
// 새 주소의 URL 해시(#move=...)로 보낸다. 해시는 서버로 전송되지 않는다.
export const SITE = 'https://imthefinalmvp.app'
export const OLD_HOST = 'bench-to-mvp.pages.dev'
const KEYS = { save: 'basketball-career-v1', hall: 'basketball-hall-v1' }
const PREFIX = '#move='

export const isOldHost = () => location.hostname === OLD_HOST

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  t: CompressionStream | DecompressionStream,
) {
  const stream = new Blob([bytes]).stream().pipeThrough(t)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function pack(data: object) {
  const bytes = await pipe(
    new TextEncoder().encode(JSON.stringify(data)),
    new CompressionStream('gzip'),
  )
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function unpack(text: string): Promise<unknown> {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  const out = await pipe(bytes, new DecompressionStream('gzip'))
  return JSON.parse(new TextDecoder().decode(out))
}

// 이전 주소: 세이브와 내 기록을 담은 새 주소 링크
export async function moveURL() {
  const data = {
    save: localStorage.getItem(KEYS.save),
    hall: localStorage.getItem(KEYS.hall),
  }
  return data.save || data.hall
    ? `${SITE}/${PREFIX}${await pack(data)}`
    : `${SITE}/`
}

export const hasMove = () => location.hash.startsWith(PREFIX)
// 새 주소: 해시로 넘어온 데이터를 저장하고 주소에서 지운다. 앱을 그리기 전에 한 번 부른다
export async function receiveMove(
  check: (save: string) => void,
  confirmReplace: () => boolean,
) {
  if (!location.hash.startsWith(PREFIX)) return
  const text = location.hash.slice(PREFIX.length)
  history.replaceState(null, '', location.pathname + location.search)
  try {
    const data = (await unpack(text)) as { save?: unknown; hall?: unknown }
    if (typeof data.save === 'string') {
      check(data.save) // 올바른 세이브가 아니면 던진다
      if (!localStorage.getItem(KEYS.save) || confirmReplace())
        localStorage.setItem(KEYS.save, data.save)
    }
    if (typeof data.hall === 'string') {
      // 내 기록은 합치고, 같은 커리어는 한 번만 (id 가 없던 예전 기록은 이름+연도)
      type Entry = { id?: string; name?: string; year?: number }
      const key = (e: Entry) => e.id ?? `${e.name}-${e.year}`
      const mine = JSON.parse(
        localStorage.getItem(KEYS.hall) ?? '[]',
      ) as Entry[]
      const moved = JSON.parse(data.hall) as Entry[]
      if (!Array.isArray(moved)) throw new Error('내 기록 형식 오류')
      const seen = new Set(mine.map(key))
      const merged = [...mine, ...moved.filter((e) => !seen.has(key(e)))]
      localStorage.setItem(KEYS.hall, JSON.stringify(merged))
    }
  } catch {
    // 손상된 링크는 무시하고 평소처럼 시작
  }
}

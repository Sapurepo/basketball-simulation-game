import { useEffect, useRef, useState } from 'react'
import { toHallPayload } from '../engine/hallEntry'
import type { GameState } from '../engine/types'

// Turnstile 사이트 키(공개값). 로컬 호스트는 Cloudflare 테스트 키(항상 통과)
const SITE_KEY = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? '1x00000000000000000000AA'
  : '0x4AAAAAAFnu6-xfX-I9ER19'
const SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string
      remove(id: string): void
    }
  }
}

// 스크립트는 한 번만 불러온다
let loading: Promise<void> | null = null
const loadTurnstile = () =>
  (loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('봇 확인을 불러오지 못했어요'))
    }
    document.head.append(s)
  }))

function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let id = ''
    let alive = true
    loadTurnstile()
      .then(() => {
        if (!alive || !ref.current || !window.turnstile) return
        id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
      })
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
      if (id) window.turnstile?.remove(id)
    }
  }, [onToken])
  return error ? <p className="error">{error}</p> : <div ref={ref} />
}

// 은퇴 화면: 공용 명예의 전당에 동의를 받고 등록
export function HallSubmit({
  state,
  onPosted,
}: {
  state: GameState
  onPosted: () => void
}) {
  const [agree, setAgree] = useState(false)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // 토큰은 한 번만 쓸 수 있어 실패하면 위젯을 새로 그린다
  const [attempt, setAttempt] = useState(0)

  if (state.hallPosted)
    return <p className="muted">공용 명예의 전당에 이름을 올렸어요.</p>

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/hall', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entry: toHallPayload(state), token }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? '등록하지 못했어요')
      onPosted()
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록하지 못했어요')
      setToken('')
      setAttempt((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="hall-submit">
      <h3>공용 명예의 전당 등록</h3>
      <p className="muted">
        선수 이름, 포지션, 외형, 최고 OVR, 파이널 MVP 횟수, 트로피 수, 시즌 수,
        은퇴 연도가 모든 플레이어에게 공개됩니다. 자세한 내용은
        개인정보처리방침을 확인해 주세요.
      </p>
      <label className="row">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        위 기록을 공개 등록하는 데 동의합니다.
      </label>
      {agree && <Turnstile key={attempt} onToken={setToken} />}
      {error && <p className="error">{error}</p>}
      <button
        className="primary"
        disabled={!agree || !token || busy}
        onClick={submit}
      >
        {busy ? '등록 중…' : '명예의 전당에 등록'}
      </button>
    </div>
  )
}

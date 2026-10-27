import { useState } from 'react'
import { isOldHost, moveURL, SITE } from './domainMove'

// 이전 주소에서만: 새 주소로 이사 안내와 세이브를 들고 가는 버튼
export function MoveBanner() {
  const [busy, setBusy] = useState(false)
  if (!isOldHost()) return null
  const go = async () => {
    setBusy(true)
    location.href = await moveURL().catch(() => `${SITE}/`)
  }
  return (
    <div className="move-banner" role="status">
      <p>
        <b>새 주소로 이사했어요.</b> 진행 중인 커리어와 내 기록을 그대로 가지고{' '}
        <b>{new URL(SITE).host}</b>에서 이어서 플레이하세요.
      </p>
      <button className="primary" disabled={busy} onClick={go}>
        {busy ? '옮기는 중…' : '새 주소로 이동'}
      </button>
    </div>
  )
}

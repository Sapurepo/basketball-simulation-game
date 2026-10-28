import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { parseSave } from './engine/save'
import { langReady, tr } from './i18n'
import { receiveMove } from './ui/domainMove'
import { ErrorBoundary } from './ui/errorBoundary'

// 이전 주소에서 넘어온 세이브가 있으면 먼저 저장한 뒤 그린다 (App 이 처음 읽을 때 반영되도록)
// (확인 문구도 번역되도록 첫 언어 카탈로그를 먼저 받는다)
void langReady
  .then(() =>
    receiveMove(parseSave, () =>
      window.confirm(
        tr(
          '새 주소에 이미 진행 중인 커리어가 있어요. 이전 주소의 커리어로 바꿀까요?',
        ),
      ),
    ),
  )
  .finally(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    ),
  )

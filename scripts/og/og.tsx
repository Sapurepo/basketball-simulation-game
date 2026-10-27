import { createRoot } from 'react-dom/client'
import { DEFAULT_LOOK, H, iconURL, spriteURL, W } from '../../src/ui/sprite'

// 김도윤(기본 외형)이 우승컵을 든 장면. 파비콘과 같은 남색 유니폼
const spec = { ...DEFAULT_LOOK, jersey: '#23306b', trim: '#f2c14e' }
const hero = spriteURL(spec, 'trophy', 0)
const STEPS = ['벤치', '데뷔', '프로 입성', 'NBA', '파엠']

const og = (
  <main className="og">
    <section className="copy">
      <p className="eyebrow">농구 커리어 시뮬레이션</p>
      <h1>
        벤치에서
        <br />
        파엠까지
      </h1>
      <p className="lead">고교 농구부 벤치에서 KBL, NBA 파이널 MVP까지</p>
      <ol className="steps">
        {STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </section>
    <img className="hero" src={hero} width={W * 9} height={H * 9} alt="" />
    <img className="ball" src={iconURL('ball')} width={66} height={66} alt="" />
  </main>
)

// ?icon 이면 홈 화면 아이콘(180×180): 우승컵 든 선수 상반신
const icon = (
  <main className="icon">
    <img src={hero} width={W * 6} height={H * 6} alt="" />
  </main>
)

createRoot(document.getElementById('root')!).render(
  location.search.includes('icon') ? icon : og,
)

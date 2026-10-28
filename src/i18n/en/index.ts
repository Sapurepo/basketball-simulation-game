import type { Catalog } from '../index'
import engine from './engine'
import names from './names'
import ui from './ui'

// 동적 라벨: 정규식 → 템플릿. {1}, {2} 캡처는 다시 번역된다
const patterns: [RegExp, string][] = [
  [/^현재 버전 (.+)$/, 'Current version {1}'],
  [/^시즌 베스트 \((.+)\)$/, 'Season best ({1})'],
  [/^(.+) (\d+)차전$/, '{1} Game {2}'],
  [/^(동부|서부|정규리그|정규시즌|D리그) (\d+)위$/, '{1} #{2}'],
  [/^대회 최고 성적 (.+)$/, 'Best finish: {1}'],
  [/^(.+) (16강|8강|준결승|결승)$/, '{1} {2}'],
  [/^(.+) D리그$/, '{1} D-League'],
  [/^(\d{4}) 아시안게임 (.+)$/, '{1} Asian Games {2}'],
  [/^(.+) 우승$/, '{1} Champions'],
  [/^(.+) 득점상$/, '{1} Scoring Title'],
  [/^(.+) MVP$/, '{1} MVP'],
  [/^(.+) 탈락$/, 'Out in the {1}'],
]

const en: Catalog = { text: { ...ui, ...engine, ...names }, patterns }
export default en

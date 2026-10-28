import type { Catalog } from '../index'
import engine from './engine'
import names from './names'
import ui from './ui'

const patterns: [RegExp, string][] = [
  [/^현재 버전 (.+)$/, '現在のバージョン {1}'],
  [/^시즌 베스트 \((.+)\)$/, 'シーズンベスト（{1}）'],
  [/^(.+) (\d+)차전$/, '{1} 第{2}戦'],
  [/^(동부|서부|정규리그|정규시즌|D리그) (\d+)위$/, '{1} {2}位'],
  [/^대회 최고 성적 (.+)$/, '大会最高成績 {1}'],
  [/^(.+) (16강|8강|준결승|결승)$/, '{1} {2}'],
  [/^(.+) D리그$/, '{1} Dリーグ'],
  [/^(\d{4}) 아시안게임 (.+)$/, '{1}年アジア大会 {2}'],
  [/^(.+) 우승$/, '{1} 優勝'],
  [/^(.+) 득점상$/, '{1} 得点王'],
  [/^(.+) MVP$/, '{1} MVP'],
  [/^(.+) 탈락$/, '{1}敗退'],
]

const ja: Catalog = { text: { ...ui, ...engine, ...names }, patterns }
export default ja

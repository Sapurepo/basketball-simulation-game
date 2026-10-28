import { describe, expect, test } from 'vitest'
import { ITEMS } from '../data/items'
import { newGame } from '../engine/game'
import { createPlayer } from '../engine/player'
import { Rng } from '../engine/rng'
import { parseSave } from '../engine/save'
import { clampPos, patchPlace, placeOf, resetPlace, WINDOW_POS } from './layout'
import { artSize } from './shopArt'

describe('무대 배치', () => {
  test('배치가 없으면 아이템 기본 자리, 커튼은 창문에 붙는다', () => {
    expect(placeOf(undefined, 'sofa')).toEqual({
      x: 0,
      y: 44,
      flip: false,
      hidden: false,
    })
    expect(placeOf(undefined, 'window')).toMatchObject({
      x: WINDOW_POS[0],
      y: WINDOW_POS[1],
    })
    const moved = patchPlace(undefined, 'window', { x: 30, y: 12 })
    expect(placeOf(moved, 'curtain')).toMatchObject({ x: 24, y: 8 })
  })

  test('창문·시계는 벽, 러그는 바닥 앞, 가구는 바닥선에 걸친다', () => {
    const [, wh] = artSize('window')
    expect(clampPos('window', 50, 70)[1]).toBe(30)
    expect(clampPos('window', 50, 0)[1]).toBe(8)
    expect(clampPos('window', 50, 20)[1] + wh).toBeLessThan(60)

    const [, ch] = artSize('clock')
    expect(clampPos('clock', 10, 70)[1]).toBe(56 - ch)

    const [, rh] = artSize('rug')
    expect(clampPos('rug', 10, 0)[1]).toBe(60)
    expect(clampPos('rug', 10, 99)[1]).toBe(80 - rh)

    const [sw, sh] = artSize('sofa')
    expect(clampPos('sofa', 10, 0)[1]).toBe(58 - sh)
    expect(clampPos('sofa', 10, 99)[1]).toBe(84 - sh)
    // 가로로는 폭의 1/3까지만 무대 밖으로
    expect(clampPos('sofa', -99, 50)[0]).toBe(-Math.floor(sw / 3))
    expect(clampPos('sofa', 999, 50)[0]).toBe(110 - Math.ceil((sw * 2) / 3))
  })

  test('기본 자리는 놓일 수 있는 자리 안에 있다', () => {
    for (const it of ITEMS.filter((i) => i.pos && i.id !== 'curtain')) {
      const [x, y] = it.pos!
      expect(clampPos(it.id, x, y), it.id).toEqual([x, y])
    }
  })

  test('제자리로는 위치·반전만 지우고 보관 여부는 남긴다', () => {
    let l = patchPlace(undefined, 'bed', { x: 3, y: 40, flip: true })
    expect(resetPlace(l, 'bed').bed).toBeUndefined()
    l = patchPlace(l, 'bed', { hidden: true })
    expect(resetPlace(l, 'bed').bed).toEqual({ hidden: true })
  })

  test('배치는 저장 파일에 남고, 배치가 없던 저장 파일도 그대로 열린다', () => {
    const rng = new Rng(3)
    const s = newGame(
      3,
      createPlayer(rng, 'a', 'PG', '플레이메이커'),
      'yongsan',
    )
    expect(parseSave(JSON.stringify(s)).layout).toBeUndefined()
    const layout = patchPlace(undefined, 'car', { x: 40, flip: true })
    expect(parseSave(JSON.stringify({ ...s, layout })).layout).toEqual(layout)
  })
})

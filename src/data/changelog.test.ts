import { expect, it } from 'vitest'
import pkg from '../../package.json'
import { CHANGELOG } from './changelog'

it('최신 공지 버전은 package.json 과 같다', () => {
  expect(CHANGELOG[0].version).toBe(pkg.version)
})

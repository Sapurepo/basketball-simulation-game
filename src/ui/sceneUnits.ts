import type { CSSProperties } from 'react'

// 픽셀 장면(110×72 논리 픽셀) 좌표를 컨테이너 너비(cqw)로. 랜딩 마일스톤·은퇴식 장면이 함께 쓴다
export const u = (n: number) => `calc(100cqw * ${n} / 110)`
export const at = (
  x: number,
  y: number,
  w: number,
  h: number,
  st?: CSSProperties,
): CSSProperties => ({
  position: 'absolute',
  left: u(x),
  top: u(y),
  width: u(w),
  height: u(h),
  ...st,
})
export const FRAME = `0 0 0 ${u(0.75)} #1a1715`
export const DIM: CSSProperties = { filter: 'brightness(.55) saturate(.75)' }

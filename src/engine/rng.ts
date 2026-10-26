// mulberry32. 상태를 GameState.rng 에 저장해 세이브/로드 후에도 결과가 재현된다.
export class Rng {
  state: number
  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next()
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  chance(p: number): boolean {
    return this.next() < p
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  normal(mean = 0, sd = 1): number {
    const u = 1 - this.next()
    const v = this.next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  poisson(lambda: number): number {
    // ponytail: Knuth 방식, lambda 가 수십 이하인 박스스코어 용도로 충분
    const l = Math.exp(-lambda)
    let k = 0
    let p = 1
    do {
      k++
      p *= this.next()
    } while (p > l)
    return k - 1
  }

  binomial(n: number, p: number): number {
    let k = 0
    for (let i = 0; i < n; i++) if (this.next() < p) k++
    return k
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

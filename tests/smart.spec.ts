import { describe, expect, it } from 'vitest'
import { evaluateSmart } from '../src/core/evaluate.ts'

describe('evaluateSmart', () => {
  it('marks a concrete, measurable, time-bound north star green', () => {
    expect(evaluateSmart('在 2026 年 Q4 前，将插件安装成功率提升到 80%，并每周复盘一次。')).toMatchObject({
      status: 'green',
      score: 5,
      checks: {
        specific: true,
        measurable: true,
        achievable: true,
        relevant: true,
        timeBound: true,
      },
    })
  })

  it('marks a meaningful but underspecified north star yellow', () => {
    expect(evaluateSmart('让插件更好用')).toMatchObject({
      status: 'yellow',
      checks: { specific: true, relevant: true },
    })
    expect(evaluateSmart('让插件更好用').score).toBeLessThan(5)
  })

  it('marks an empty or non-actionable north star red', () => {
    expect(evaluateSmart('')).toMatchObject({ status: 'red', score: 0 })
    expect(evaluateSmart('梦想')).toMatchObject({ status: 'red' })
  })
})

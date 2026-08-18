import { describe, expect, it } from 'vitest'
import { evaluateNorthstar, NORTHSTAR_DIMENSIONS } from '../src/core/evaluate.ts'

describe('evaluateNorthstar', () => {
  it('scores the six dimensions in the requested priority order', () => {
    expect(NORTHSTAR_DIMENSIONS.map(dimension => dimension.key)).toEqual([
      'userValue', 'coreBehavior', 'businessRelevance', 'leadingness', 'controllability', 'measurability',
    ])
    expect(NORTHSTAR_DIMENSIONS.map(dimension => dimension.weight)).toEqual([6, 5, 4, 3, 2, 1])
  })

  it('gives a strong outcome-oriented statement a high score', () => {
    const result = evaluateNorthstar('在 2026 年 Q4 前，通过提升新用户完成关键任务的比例到 80%，降低获客成本 20%，打造比竞品更快的体验。')
    expect(result.status).toBe('green')
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.dimensions.userValue).toBeGreaterThan(0)
    expect(result.dimensions.coreBehavior).toBeGreaterThan(0)
    expect(result.dimensions.businessRelevance).toBeGreaterThan(0)
    expect(result.dimensions.measurability).toBeGreaterThan(0)
  })

  it('keeps vague statements scoreable without blocking the switch', () => {
    expect(evaluateNorthstar('让插件更好用')).toMatchObject({ status: 'orange' })
    expect(evaluateNorthstar('').status).toBe('gray')
    expect(evaluateNorthstar('梦想').status).toBe('red')
  })
})

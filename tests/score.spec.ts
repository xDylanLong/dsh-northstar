import { describe, expect, it } from 'vitest'
import { evaluateNorthstar, NORTHSTAR_DIMENSIONS, parseNorthstarAiEvaluation } from '../src/core/evaluate.ts'

describe('evaluateNorthstar', () => {
  it('scores the six dimensions in the requested priority order', () => {
    expect(NORTHSTAR_DIMENSIONS.map(dimension => dimension.key)).toEqual([
      'userValue', 'coreBehavior', 'businessRelevance', 'leadingness', 'controllability', 'measurability',
    ])
    expect(NORTHSTAR_DIMENSIONS.map(dimension => dimension.weight)).toEqual([6, 5, 4, 3, 2, 1])
  })

  it('does not derive a score from the statement before an explicit AI evaluation', () => {
    expect(evaluateNorthstar('获取 1,000 名目标 DSH 用户安装并使用 dsh-northstar')).toMatchObject({
      status: 'gray',
      score: 0,
      source: 'unrated',
    })
    expect(evaluateNorthstar('').status).toBe('gray')
  })

  it('normalizes the AI score from the prioritized dimension scores', () => {
    const result = parseNorthstarAiEvaluation(JSON.stringify({
      score: 1,
      dimensions: {
        userValue: 5,
        coreBehavior: 4,
        businessRelevance: 3,
        leadingness: 2,
        controllability: 1,
        measurability: 0,
      },
      summary: '维度评分可用。',
    }), 123)
    expect(result.score).toBe(67)
    expect(result.evaluatedAt).toBe(123)
  })
})

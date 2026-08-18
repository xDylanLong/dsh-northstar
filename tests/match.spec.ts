import { describe, expect, it } from 'vitest'
import { evaluateTaskMatch } from '../src/core/evaluate.ts'

describe('evaluateTaskMatch', () => {
  it('aligns a task that shares the north-star outcome', () => {
    expect(evaluateTaskMatch('在 2026 年 Q4 前，将插件安装成功率提升到 80%', '请分析插件安装成功率并提出提升方案')).toMatchObject({
      status: 'green',
    })
  })

  it('keeps a related but weakly evidenced task yellow', () => {
    expect(evaluateTaskMatch('提升插件安装成功率', '帮我整理一份插件市场竞品清单')).toMatchObject({
      status: 'yellow',
    })
  })

  it('marks an unrelated task red', () => {
    expect(evaluateTaskMatch('提升插件安装成功率', '写一首关于春天的诗')).toMatchObject({
      status: 'red',
    })
  })
})

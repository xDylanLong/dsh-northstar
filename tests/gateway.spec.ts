import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { NorthstarGateway } from '../src/index.ts'

describe('NorthstarGateway', () => {
  it('runs the north-star check in the real agent/pre-step waterfall before model entry', async () => {
    let settings = { enabled: true, statement: '提升插件安装成功率到 80%，在 Q4 前完成' }
    const scope = {
      get: () => settings,
      update: async (patch: object) => { settings = { ...settings, ...patch as typeof settings } },
      replace: async (next: object) => { settings = next as typeof settings },
    }
    const ctx = new Context()
    ctx.provide('settings', { register: () => scope } as never)
    const stream = vi.fn()
    ctx.provide('llm', { stream } as never)
    const fiber = ctx.plugin(NorthstarGateway)
    await fiber.await()

    const userMessage = {
      role: 'user' as const,
      content: [{ type: 'text' as const, text: '请分析插件安装成功率并提出提升方案' }],
      source: { kind: 'user' as const },
    }
    const decision = await ctx.events.waterfall(
      'agent/pre-step',
      { messages: [userMessage], signal: new AbortController().signal },
      async () => ({ kind: 'enter' as const, messages: [userMessage] }),
    )

    expect(decision.kind).toBe('enter')
    expect(decision.messages).toHaveLength(2)
    expect(decision.messages[1]?.content[0]).toMatchObject({ type: 'text', text: expect.stringContaining('北极星指标') })
    expect(stream).not.toHaveBeenCalled()
    await fiber.dispose()
  })

  it('calls the current default model only when the user explicitly evaluates the indicator', async () => {
    let settings = { enabled: true, statement: '获取 1,000 名目标 DSH 用户安装并使用 dsh-northstar' }
    const scope = {
      get: () => settings,
      update: async (patch: object) => { settings = { ...settings, ...patch as typeof settings } },
      replace: async (next: object) => { settings = next as typeof settings },
    }
    const stream = vi.fn(() => (async function* () {
      yield { type: 'block-end' as const, index: 0, block: { type: 'text' as const, text: JSON.stringify({
        score: 86,
        dimensions: {
          userValue: 4,
          coreBehavior: 4,
          businessRelevance: 5,
          leadingness: 3,
          controllability: 4,
          measurability: 5,
        },
        summary: '目标用户和行为明确。',
        suggestion: '补充时间范围和用户价值结果。',
      }) } }
      yield { type: 'finish' as const, reason: { kind: 'stop' as const } }
    })())
    const ctx = new Context()
    ctx.provide('settings', { register: () => scope } as never)
    ctx.provide('llm', { stream } as never)
    ctx.provide('agentDefaultModel', {
      currentSelection: () => ({ provider: 'deepseek-official', model: 'deepseek-v4-flash' }),
    } as never)
    const fiber = ctx.plugin(NorthstarGateway)
    await fiber.await()

    const gateway = ctx.get('northstar') as never as {
      state: () => Promise<unknown>
      evaluate: (statement: string) => Promise<unknown>
    }
    const before = await gateway.state()
    expect(before).toMatchObject({ evaluation: { source: 'unrated' } })
    expect(stream).not.toHaveBeenCalled()

    const state = await gateway.evaluate(settings.statement)
    expect(stream).toHaveBeenCalledTimes(1)
    expect(stream).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'deepseek-official',
      model: 'deepseek-v4-flash',
      maxTokens: 1400,
    }))
    expect(state).toMatchObject({
      evaluation: {
        source: 'ai',
        score: 82,
        status: 'green',
        suggestion: '补充时间范围和用户价值结果。',
      },
    })
    await fiber.dispose()
  })
})

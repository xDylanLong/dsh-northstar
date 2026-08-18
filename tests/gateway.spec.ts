import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { NorthstarGateway } from '../src/index.ts'

describe('NorthstarGateway', () => {
  it('runs the north-star check in the real agent/pre-step waterfall before model entry', async () => {
    let settings = { enabled: true, statement: '提升插件安装成功率到 80%，在 Q4 前完成' }
    const scope = {
      get: () => settings,
      update: async (patch: object) => { settings = { ...settings, ...patch as typeof settings } },
    }
    const ctx = new Context()
    ctx.provide('settings', { register: () => scope } as never)
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
    expect(decision.messages[1]?.content[0]).toMatchObject({ type: 'text', text: expect.stringContaining('北极星指标检查') })
    await fiber.dispose()
  })
})

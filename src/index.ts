import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { PreStepDecision } from '@deepseek-ai/dsh-agent'
import { BlockAssembler, createUserMessage, deepFreeze } from '@deepseek-ai/dsh-llm'
import type { FinishReason, GenerateOptions, StreamChunk } from '@deepseek-ai/dsh-llm'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { evaluateNorthstar, parseNorthstarAiEvaluation } from './core/evaluate.ts'
import type { NorthstarEvaluation } from './core/evaluate.ts'
import type { NorthstarSettings, NorthstarState } from './types.ts'
import { TYPERT_REMOTE } from './remote.ts'

export const NORTHSTAR_SETTINGS_NAMESPACE = settingsNamespace('northstar')
const NorthstarEvaluationSchema = z.object({
  status: z.union(['gray', 'red', 'orange', 'yellow', 'blue', 'green'] as const),
  score: z.number(),
  dimensions: z.object({
    userValue: z.number(),
    coreBehavior: z.number(),
    businessRelevance: z.number(),
    leadingness: z.number(),
    controllability: z.number(),
    measurability: z.number(),
  }),
  summary: z.string(),
  source: z.union(['unrated', 'ai'] as const),
  suggestion: z.union([z.string(), z.const(undefined)]),
  evaluatedAt: z.union([z.number(), z.const(undefined)]),
})
export const NorthstarSettingsSchema: z<NorthstarSettings> = z.object({
  enabled: z.boolean(),
  statement: z.string(),
  evaluation: z.union([z.const(undefined), NorthstarEvaluationSchema]),
})

const DEFAULT_SETTINGS: NorthstarSettings = { enabled: false, statement: '' }
const EVALUATION_SYSTEM_PROMPT = [
  '你是北极星指标评审器。请评估用户提供的指标是否能够牵引产品和任务。',
  '按以下优先级综合评分：用户价值 > 核心行为 > 商业关联 > 领先性 > 可影响性 > 可衡量性。',
  '每个维度给 0 到 5 分，总分给 0 到 100 分。不要因为出现关键词就加分，要根据完整语义判断。',
  '只返回一个 JSON 对象，不要 Markdown，不要解释 JSON 以外的内容。',
  'JSON 格式：{"score":0,"dimensions":{"userValue":0,"coreBehavior":0,"businessRelevance":0,"leadingness":0,"controllability":0,"measurability":0},"summary":"一句话总结","suggestion":"一句话改进建议"}',
].join('\n')

type ModelRoute = { readonly provider: string; readonly model: string }
type LlmRuntime = { readonly stream: (options: GenerateOptions) => AsyncIterable<StreamChunk> }
type DefaultModelService = { readonly currentSelection: () => Partial<ModelRoute> }

function messageText(message: { content: readonly { type?: string; text?: string }[] }): string {
  return message.content
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text ?? '')
    .join('\n')
    .trim()
}

function finishError(finish: FinishReason): Error | undefined {
  switch (finish.kind) {
    case 'stop': return undefined
    case 'error':
    case 'aborted': return new Error(finish.failure.message)
    case 'max-tokens': return new Error('DeepSeek 评估结果超过输出长度限制')
    case 'tool-calls': return new Error('DeepSeek 评估时意外请求了工具')
    default: return new Error(`DeepSeek 评估返回了不支持的结束状态：${String((finish as { kind?: unknown }).kind)}`)
  }
}

function checkNotice(statement: string, task: string, evaluation: NorthstarEvaluation): string {
  const rating = evaluation.source === 'ai'
    ? `用户最近主动评估为 ${evaluation.score}/100（${evaluation.summary}）。`
    : '这个指标还没有经过 DeepSeek 评估。'
  const suggestion = evaluation.suggestion === undefined ? '' : `评估建议：${evaluation.suggestion}\n`
  return [
    '北极星指标上下文：',
    `指标：${statement}`,
    rating,
    suggestion,
    `当前任务：${task}`,
    '请先判断当前任务是否直接服务这个北极星指标。若存在偏离，先明确指出偏离点并询问用户是否要调整任务；若一致，再围绕北极星指标执行，避免扩展到无关工作。',
  ].filter(Boolean).join('\n')
}

/** Host service for local persistence, explicit AI rating, and pre-model guidance. */
export class NorthstarGateway extends TypertRemoteService {
  private settingsScope: SettingsScope<NorthstarSettings> | undefined

  constructor(ctx: Context) {
    super(ctx, 'northstar')
    ctx.inject(['settings'], (settingsCtx) => {
      this.settingsScope = settingsCtx.settings.register(NORTHSTAR_SETTINGS_NAMESPACE, NorthstarSettingsSchema, {
        base: DEFAULT_SETTINGS,
      })
    })
    ctx.on('agent/pre-step', async ({ messages, signal }, next): Promise<PreStepDecision> => {
      const settings = this.readSettings()
      if (!settings.enabled || settings.statement.trim() === '') return next()
      const task = messages
        .filter(message => message.source.kind === 'user')
        .map(messageText)
        .filter(Boolean)
        .join('\n')
      if (task === '') return next()
      signal.throwIfAborted()
      const downstream = await next()
      if (downstream.kind !== 'enter') return downstream
      const evaluation = settings.evaluation ?? evaluateNorthstar(settings.statement)
      const guard = createUserMessage({
        content: [{ type: 'text', text: checkNotice(settings.statement, task, evaluation) }],
        source: { kind: 'plugin', plugin: 'dsh-northstar', form: 'notice', summary: 'north-star guidance' },
      })
      return { kind: 'enter', messages: [...downstream.messages, guard] }
    })
  }

  async state(): Promise<NorthstarState> {
    return this.snapshot()
  }

  async save(settings: NorthstarSettings): Promise<NorthstarState> {
    const statement = settings.statement.trim()
    if (statement.length > 2000) throw new Error('北极星指标不能超过 2000 个字符')
    if (this.settingsScope === undefined) throw new Error('本地设置服务尚未就绪')
    const current = this.readSettings()
    if (current.statement === statement) {
      await this.settingsScope.update({ enabled: settings.enabled })
    } else {
      await this.settingsScope.replace({ enabled: settings.enabled, statement })
    }
    return this.snapshot()
  }

  /** Send one explicit, short auxiliary request through the current default model. */
  async evaluate(statement: string): Promise<NorthstarState> {
    const normalized = statement.trim()
    if (normalized === '') throw new Error('请先填写北极星指标，再点击评估指标')
    if (this.settingsScope === undefined) throw new Error('本地设置服务尚未就绪')
    const llm = this.ctx.get('llm') as LlmRuntime | undefined
    const defaultModel = this.ctx.get('agentDefaultModel') as DefaultModelService | undefined
    const route = defaultModel?.currentSelection()
    if (llm === undefined || route?.provider === undefined || route.model === undefined) {
      throw new Error('当前没有可用的 DeepSeek 模型')
    }
    const message = createUserMessage({
      content: [{ type: 'text', text: `请评估下面这条北极星指标：\n<northstar>\n${normalized}\n</northstar>` }],
      source: { kind: 'plugin', plugin: 'dsh-northstar' },
    })
    const options = deepFreeze({
      provider: route.provider,
      model: route.model,
      system: EVALUATION_SYSTEM_PROMPT,
      messages: [message],
      temperature: 0,
      maxTokens: 1400,
    })
    const assembler = new BlockAssembler()
    for await (const chunk of llm.stream(options)) assembler.push(chunk)
    const error = finishError(assembler.finish)
    if (error !== undefined) throw error
    const blocks = assembler.blocks()
    const raw = blocks
      .filter((block): block is Extract<(typeof blocks)[number], { type: 'text' }> => block.type === 'text')
      .map(block => block.text)
      .join('')
    const evaluation = parseNorthstarAiEvaluation(raw)
    const current = this.readSettings()
    await this.settingsScope.replace({ enabled: current.enabled, statement: normalized, evaluation })
    return this.snapshot()
  }

  private readSettings(): NorthstarSettings {
    return this.settingsScope?.get() ?? DEFAULT_SETTINGS
  }

  private snapshot(): NorthstarState {
    const settings = this.readSettings()
    return {
      settings,
      evaluation: settings.evaluation ?? evaluateNorthstar(settings.statement),
    }
  }
}

export { TYPERT_REMOTE }
export * from './core/evaluate.ts'
export type * from './types.ts'
export default NorthstarGateway

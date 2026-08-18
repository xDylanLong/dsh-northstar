import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { PreStepDecision } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { evaluateNorthstar, evaluateTaskMatch, type TaskMatchEvaluation } from './core/evaluate.ts'
import type { NorthstarSettings, NorthstarState } from './types.ts'
import { TYPERT_REMOTE } from './remote.ts'

export const NORTHSTAR_SETTINGS_NAMESPACE = settingsNamespace('northstar')
export const NorthstarSettingsSchema: z<NorthstarSettings> = z.object({
  enabled: z.boolean(),
  statement: z.string(),
})

const DEFAULT_SETTINGS: NorthstarSettings = { enabled: false, statement: '' }

function messageText(message: { content: readonly { type?: string; text?: string }[] }): string {
  return message.content
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text ?? '')
    .join('\n')
    .trim()
}

function checkNotice(statement: string, task: string, evaluation: ReturnType<typeof evaluateNorthstar>, match: TaskMatchEvaluation): string {
  if (evaluation.status === 'red' || evaluation.status === 'orange') {
    return `北极星指标评分：${evaluation.score}/100（${evaluation.summary}）。先提醒用户当前指标仍需补强，再结合用户任务给出建议；不要把评分不足误当成已对齐目标。当前指标：${statement}`
  }
  if (match.status === 'red') {
    return `北极星指标门禁：当前任务与北极星指标没有明确关联（${match.summary}）。不要把它当作已对齐任务执行；请先指出偏离，并询问用户是否要修改任务或更新北极星指标。北极星指标：${statement}；当前任务：${task}`
  }
  return `北极星指标检查：${match.summary}。回答时优先服务北极星指标，避免扩展到无关工作。北极星指标：${statement}`
}

/** Host service for local persistence and the pre-model north-star check. */
export class NorthstarGateway extends TypertRemoteService {
  private settingsScope: SettingsScope<NorthstarSettings> | undefined
  private lastCheck: NonNullable<NorthstarState['lastCheck']> | undefined

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
      const evaluation = evaluateNorthstar(settings.statement)
      const match = evaluateTaskMatch(settings.statement, task)
      this.lastCheck = { task, match, checkedAt: Date.now() }
      const downstream = await next()
      if (downstream.kind !== 'enter') return downstream
      const guard = createUserMessage({
        content: [{ type: 'text', text: checkNotice(settings.statement, task, evaluation, match) }],
        source: { kind: 'plugin', plugin: 'dsh-northstar', form: 'notice', summary: `north-star ${match.status}` },
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
    await this.settingsScope.update({ enabled: settings.enabled, statement })
    return this.snapshot()
  }

  async check(task: string): Promise<NorthstarState> {
    const settings = this.readSettings()
    const match = evaluateTaskMatch(settings.statement, task)
    this.lastCheck = { task, match, checkedAt: Date.now() }
    return this.snapshot()
  }

  private readSettings(): NorthstarSettings {
    return this.settingsScope?.get() ?? DEFAULT_SETTINGS
  }

  private snapshot(): NorthstarState {
    const settings = this.readSettings()
    return {
      settings,
      evaluation: evaluateNorthstar(settings.statement),
      ...(this.lastCheck === undefined ? {} : { lastCheck: this.lastCheck }),
    }
  }
}

export { TYPERT_REMOTE }
export * from './core/evaluate.ts'
export type * from './types.ts'
export default NorthstarGateway

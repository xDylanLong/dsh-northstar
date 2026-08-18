import type { SmartEvaluation, TaskMatchEvaluation } from './core/evaluate.ts'

export interface NorthstarSettings {
  readonly enabled: boolean
  readonly statement: string
}

export interface NorthstarState {
  readonly settings: NorthstarSettings
  readonly smart: SmartEvaluation
  readonly lastCheck?: {
    readonly task: string
    readonly match: TaskMatchEvaluation
    readonly checkedAt: number
  }
}

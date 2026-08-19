import type { NorthstarEvaluation } from './core/evaluate.ts'

export interface NorthstarSettings {
  readonly enabled: boolean
  readonly statement: string
  readonly evaluation?: NorthstarEvaluation
}

export interface NorthstarState {
  readonly settings: NorthstarSettings
  readonly evaluation: NorthstarEvaluation
}

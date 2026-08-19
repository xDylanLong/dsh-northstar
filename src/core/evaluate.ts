export type NorthstarStatus = 'green' | 'yellow' | 'red'
export type NorthstarScoreStatus = 'gray' | 'red' | 'orange' | 'yellow' | 'blue' | 'green'
export type NorthstarEvaluationSource = 'unrated' | 'ai'

export type NorthstarDimensionKey =
  | 'userValue'
  | 'coreBehavior'
  | 'businessRelevance'
  | 'leadingness'
  | 'controllability'
  | 'measurability'

export interface NorthstarDimensionDefinition {
  readonly key: NorthstarDimensionKey
  readonly label: string
  readonly weight: number
}

export const NORTHSTAR_DIMENSIONS: readonly NorthstarDimensionDefinition[] = [
  { key: 'userValue', label: '用户价值', weight: 6 },
  { key: 'coreBehavior', label: '核心行为', weight: 5 },
  { key: 'businessRelevance', label: '商业关联', weight: 4 },
  { key: 'leadingness', label: '领先性', weight: 3 },
  { key: 'controllability', label: '可影响性', weight: 2 },
  { key: 'measurability', label: '可衡量性', weight: 1 },
]

export type NorthstarDimensionScores = Readonly<Record<NorthstarDimensionKey, number>>

export interface NorthstarEvaluation {
  readonly status: NorthstarScoreStatus
  readonly score: number
  readonly dimensions: NorthstarDimensionScores
  readonly summary: string
  readonly source: NorthstarEvaluationSource
  readonly suggestion?: string
  readonly evaluatedAt?: number
}

const EMPTY_DIMENSIONS: NorthstarDimensionScores = {
  userValue: 0,
  coreBehavior: 0,
  businessRelevance: 0,
  leadingness: 0,
  controllability: 0,
  measurability: 0,
}

const SCORE_STATUS_SUMMARY: Record<NorthstarScoreStatus, string> = {
  gray: '点击“评估指标”获取 DeepSeek 评分',
  red: '指标暂未形成清晰牵引',
  orange: '已有方向，但价值链条还不完整',
  yellow: '具备基础方向，建议补充关键结果',
  blue: '方向较强，已经具备较好的牵引力',
  green: '高质量北极星，能够形成明确牵引',
}

function scoreStatus(score: number): NorthstarScoreStatus {
  if (score < 20) return 'red'
  if (score < 40) return 'orange'
  if (score < 60) return 'yellow'
  if (score < 80) return 'blue'
  return 'green'
}

/** Return the unrated state; indicator text is never scored locally. */
export function evaluateNorthstar(statement: string): NorthstarEvaluation {
  const hasStatement = statement.trim().length > 0
  return {
    status: 'gray',
    score: 0,
    dimensions: EMPTY_DIMENSIONS,
    summary: hasStatement ? SCORE_STATUS_SUMMARY.gray : '还没有设置北极星指标',
    source: 'unrated',
  }
}

export interface NorthstarAiEvaluationPayload {
  readonly score: number
  readonly dimensions: NorthstarDimensionScores
  readonly summary: string
  readonly suggestion?: string
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/iu, '').replace(/\s*```$/u, '')
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('DeepSeek 返回的评估结果不是有效 JSON')
    return JSON.parse(trimmed.slice(start, end + 1)) as unknown
  }
}

/** Parse and normalize the strict JSON returned by the user-selected model. */
export function parseNorthstarAiEvaluation(raw: string, evaluatedAt = Date.now()): NorthstarEvaluation {
  const value = parseJsonObject(raw)
  if (value === null || typeof value !== 'object') throw new Error('DeepSeek 评估结果缺少 JSON 对象')
  const record = value as Record<string, unknown>
  const dimensionsValue = record.dimensions
  if (dimensionsValue === null || typeof dimensionsValue !== 'object') {
    throw new Error('DeepSeek 评估结果缺少六个维度')
  }
  const dimensionsRecord = dimensionsValue as Record<string, unknown>
  const dimensions = Object.fromEntries(NORTHSTAR_DIMENSIONS.map(({ key }) => {
    const score = dimensionsRecord[key]
    if (!finiteNumber(score) || score < 0 || score > 5) throw new Error(`DeepSeek 评估结果的${key}维度无效`)
    return [key, Math.round(score)]
  })) as NorthstarDimensionScores
  if (!finiteNumber(record.score) || record.score < 0 || record.score > 100) {
    throw new Error('DeepSeek 评估结果的总分无效')
  }
  if (typeof record.summary !== 'string' || record.summary.trim() === '') {
    throw new Error('DeepSeek 评估结果缺少总结')
  }
  const weightedTotal = NORTHSTAR_DIMENSIONS.reduce((total, { key, weight }) => total + dimensions[key] * weight, 0)
  const maxWeightedTotal = NORTHSTAR_DIMENSIONS.reduce((total, { weight }) => total + 5 * weight, 0)
  const score = Math.round((weightedTotal / maxWeightedTotal) * 100)
  const suggestion = record.suggestion === undefined
    ? undefined
    : typeof record.suggestion === 'string' ? record.suggestion.trim() : undefined
  return {
    status: scoreStatus(score),
    score,
    dimensions,
    summary: record.summary.trim(),
    source: 'ai',
    ...(suggestion === undefined || suggestion.length === 0 ? {} : { suggestion }),
    evaluatedAt,
  }
}

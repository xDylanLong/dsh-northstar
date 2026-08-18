export type NorthstarStatus = 'green' | 'yellow' | 'red'
export type NorthstarScoreStatus = 'gray' | 'red' | 'orange' | 'yellow' | 'blue' | 'green'

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
  /** Relative weight; the order and weights encode the product priority. */
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
  /** Weighted score normalized to 0-100. */
  readonly score: number
  /** Each dimension is scored from 0 to 5 before weighting. */
  readonly dimensions: NorthstarDimensionScores
  readonly summary: string
}

export interface TaskMatchEvaluation {
  readonly status: NorthstarStatus
  readonly score: number
  readonly overlap: readonly string[]
  readonly summary: string
}

const DIMENSION_PATTERNS: Record<NorthstarDimensionKey, readonly RegExp[]> = {
  userValue: [
    /用户|客户|体验|需求|问题|价值|满意|留存|任务|好用/u,
    /完成|成功率|比例|提升|降低|增长|减少|解决|帮助/u,
    /新用户|关键用户|核心用户|使用体验/u,
  ],
  coreBehavior: [
    /做|建|开发|完成|提升|降低|增加|减少|达到|保持|实现|交付|发布|验证|复盘|让|改善|优化|建立|分析|修复|整理|写|制作|将|提高/u,
    /完成|使用|激活|留存|转化|购买|注册|提交|交付|复盘|验证/u,
    /关键行为|核心行为|主要动作|核心任务/u,
  ],
  businessRelevance: [
    /收入|营收|获客|成本|转化|付费|销售|商业|市场|利润|增长|留存|订单|客单价|现金流/u,
    /客户|用户|产品|渠道|竞争|经营|效率|资源/u,
    /商业价值|业务结果|市场份额|单位经济|复购/u,
  ],
  leadingness: [
    /领先|竞品|差异|优势|更快|更好|创新|第一|独特|壁垒|突破|标杆|前沿/u,
    /速度|效率|质量|体验|技术|能力/u,
    /超过|优于|领先于|形成优势|建立壁垒/u,
  ],
  controllability: [
    /通过|建立|开发|优化|设计|交付|执行|推动|完善|改进|提升|降低|增加|减少|实现/u,
    /团队|产品|流程|内容|渠道|功能|服务|运营/u,
    /可以影响|可控|主动|行动|实验|迭代/u,
  ],
  measurability: [
    /\d|%|百分比|数量|次数|频率|成功率|转化率|时长|分钟|小时|天|周|月|季度|用户|收入|成本|评分|分/u,
    /指标|目标值|基线|数据|比例|达到|提升|降低|增长|减少/u,
    /今天|明天|本周|下周|本月|月底|季度|半年|年底|之前|以后|持续|每周|每日|每月|q[1-4]/iu,
  ],
}
const VAGUE_ONLY = /^(梦想|变好|更好|成功|做好|优秀|增长|长期愿景)$/u

const SCORE_STATUS_SUMMARY: Record<NorthstarScoreStatus, string> = {
  gray: '还没有设置北极星指标',
  red: '缺少清晰的用户结果和行动方向',
  orange: '已有方向，但价值链条还不完整',
  yellow: '具备基础方向，建议补充关键结果',
  blue: '方向较强，已经具备较好的牵引力',
  green: '高质量北极星，能够形成明确牵引',
}

function dimensionScore(text: string, patterns: readonly RegExp[]): number {
  return Math.min(5, patterns.reduce((score, pattern) => score + (pattern.test(text) ? 2 : 0), 0))
}

function scoreStatus(text: string, score: number): NorthstarScoreStatus {
  if (text.length === 0) return 'gray'
  if (score < 20) return 'red'
  if (score < 40) return 'orange'
  if (score < 60) return 'yellow'
  if (score < 80) return 'blue'
  return 'green'
}

/** Evaluate a saved statement with a local, weighted six-dimension score. */
export function evaluateNorthstar(statement: string): NorthstarEvaluation {
  const text = statement.trim()
  const dimensions = Object.fromEntries(
    NORTHSTAR_DIMENSIONS.map(({ key }) => [key, dimensionScore(text, DIMENSION_PATTERNS[key])]),
  ) as NorthstarDimensionScores
  const weightedTotal = NORTHSTAR_DIMENSIONS.reduce((total, { key, weight }) => total + dimensions[key] * weight, 0)
  const maxTotal = NORTHSTAR_DIMENSIONS.reduce((total, { weight }) => total + 5 * weight, 0)
  const score = Math.round((weightedTotal / maxTotal) * 100)
  const status = scoreStatus(text, score)

  return {
    status: text.length > 0 && VAGUE_ONLY.test(text) ? 'red' : status,
    score,
    dimensions,
    summary: text.length > 0 && VAGUE_ONLY.test(text) ? SCORE_STATUS_SUMMARY.red : SCORE_STATUS_SUMMARY[status],
  }
}

const STOP_WORDS = new Set([
  '请', '帮我', '帮忙', '一下', '一个', '进行', '关于', '有关', '以及', '并且', '然后', '这个', '那个',
  '分析', '提出', '方案', '整理', '实现', '完成', '如何', '什么', '哪些', '需要', '希望', '能够',
  '今天', '明天', '本周', '本月', '之前', '以后', '我们', '你们', '用户', '需求',
])

function tokens(text: string): readonly string[] {
  const normalized = text.toLocaleLowerCase().replace(/[^\p{L}\p{N}%]+/gu, '')
  const result = new Set<string>()
  for (const match of normalized.matchAll(/[a-z][a-z0-9%]{1,}|\d+[a-z%]*|[\u3400-\u9fff]{2,}/giu)) {
    const token = match[0]
    if (/^[\u3400-\u9fff]+$/u.test(token)) {
      for (let index = 0; index < token.length - 1; index += 1) {
        const pair = token.slice(index, index + 2)
        if (!STOP_WORDS.has(pair)) result.add(pair)
      }
    } else if (!STOP_WORDS.has(token)) {
      result.add(token)
    }
  }
  return [...result]
}

/** Compare meaningful local text fragments; semantic model judging can be layered later. */
export function evaluateTaskMatch(northstar: string, task: string): TaskMatchEvaluation {
  const northstarTokens = tokens(northstar)
  const taskTokens = new Set(tokens(task))
  const overlap = northstarTokens.filter(token => taskTokens.has(token))
  const score = northstarTokens.length === 0 ? 0 : overlap.length / northstarTokens.length
  const status: NorthstarStatus = overlap.length >= 2 || score >= 0.2 ? 'green' : overlap.length === 1 ? 'yellow' : 'red'

  return {
    status,
    score,
    overlap,
    summary: status === 'green'
      ? '任务与北极星指标一致'
      : status === 'yellow'
        ? '任务可能相关，但匹配证据不足'
        : '没有找到与北极星指标的明确关联',
  }
}

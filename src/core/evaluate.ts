export type NorthstarStatus = 'green' | 'yellow' | 'red'

export interface SmartChecks {
  readonly specific: boolean
  readonly measurable: boolean
  readonly achievable: boolean
  readonly relevant: boolean
  readonly timeBound: boolean
}

export interface SmartEvaluation {
  readonly status: NorthstarStatus
  readonly score: number
  readonly checks: SmartChecks
  readonly summary: string
}

export interface TaskMatchEvaluation {
  readonly status: NorthstarStatus
  readonly score: number
  readonly overlap: readonly string[]
  readonly summary: string
}

const ACTION_WORDS = /做|建|开发|完成|提升|降低|增加|减少|达到|保持|实现|交付|发布|验证|复盘|让|改善|优化|建立|分析|修复|整理|写|制作|将|提高/u
const MEASUREMENT_WORDS = /\d|%|百分比|数量|次数|频率|成功率|转化率|时长|分钟|小时|天|周|月|季度|用户|收入|成本|评分|分/u
const TIME_WORDS = /今天|明天|本周|下周|本月|月底|季度|半年|年底|之前|以后|持续|每周|每日|每月|\d+\s*(天|周|月|季度|年)|q[1-4]/iu
const VAGUE_ONLY = /^(梦想|变好|更好|成功|做好|优秀|增长|长期愿景)$/u

/** Evaluate only the text the user saved; no network or model call is needed. */
export function evaluateSmart(statement: string): SmartEvaluation {
  const text = statement.trim()
  if (text.length === 0) {
    return {
      status: 'red',
      score: 0,
      checks: { specific: false, measurable: false, achievable: false, relevant: false, timeBound: false },
      summary: '还没有设置北极星指标',
    }
  }

  const checks: SmartChecks = {
    specific: text.length >= 4 && !VAGUE_ONLY.test(text) && (ACTION_WORDS.test(text) || text.length >= 8),
    measurable: MEASUREMENT_WORDS.test(text),
    achievable: ACTION_WORDS.test(text) && text.length <= 160,
    relevant: text.length >= 4 && !VAGUE_ONLY.test(text),
    timeBound: TIME_WORDS.test(text),
  }
  const score = Object.values(checks).filter(Boolean).length
  const status: NorthstarStatus = !checks.specific || score <= 1 ? 'red' : score === 5 ? 'green' : 'yellow'
  const missing = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => ({ specific: '具体', measurable: '可衡量', achievable: '可达成', relevant: '相关', timeBound: '有时限' }[name]))

  return {
    status,
    score,
    checks,
    summary: status === 'green' ? '符合 SMART' : `还缺少：${missing.join('、')}`,
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

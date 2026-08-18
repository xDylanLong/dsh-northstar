import { z } from 'zod'

const SmartChecksSchema = z.object({
  specific: z.boolean(), measurable: z.boolean(), achievable: z.boolean(), relevant: z.boolean(), timeBound: z.boolean(),
}).strict()
const SmartEvaluationSchema = z.object({
  status: z.enum(['green', 'yellow', 'red']), score: z.number(), checks: SmartChecksSchema, summary: z.string(),
}).strict()
const TaskMatchSchema = z.object({
  status: z.enum(['green', 'yellow', 'red']), score: z.number(), overlap: z.array(z.string()), summary: z.string(),
}).strict()
const SettingsSchema = z.object({ enabled: z.boolean(), statement: z.string() }).strict()

export const NorthstarSettingsSchema = SettingsSchema
export const TaskCheckSchema = z.object({
  task: z.string(), match: TaskMatchSchema, checkedAt: z.number(),
}).strict()
export const NorthstarStateSchema = z.object({
  settings: SettingsSchema,
  smart: SmartEvaluationSchema,
  lastCheck: TaskCheckSchema.optional(),
}).strict()

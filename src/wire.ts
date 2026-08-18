import { z } from 'zod'

const NorthstarEvaluationSchema = z.object({
  status: z.enum(['gray', 'red', 'orange', 'yellow', 'blue', 'green']),
  score: z.number(),
  dimensions: z.object({
    userValue: z.number(), coreBehavior: z.number(), businessRelevance: z.number(),
    leadingness: z.number(), controllability: z.number(), measurability: z.number(),
  }).strict(),
  summary: z.string(),
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
  evaluation: NorthstarEvaluationSchema,
  lastCheck: TaskCheckSchema.optional(),
}).strict()

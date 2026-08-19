import { z } from 'zod'

const NorthstarEvaluationSchema = z.object({
  status: z.enum(['gray', 'red', 'orange', 'yellow', 'blue', 'green']),
  score: z.number(),
  dimensions: z.object({
    userValue: z.number(), coreBehavior: z.number(), businessRelevance: z.number(),
    leadingness: z.number(), controllability: z.number(), measurability: z.number(),
  }).strict(),
  summary: z.string(),
  source: z.enum(['unrated', 'ai']),
  suggestion: z.string().optional(),
  evaluatedAt: z.number().optional(),
}).strict()
const SettingsSchema = z.object({ enabled: z.boolean(), statement: z.string(), evaluation: NorthstarEvaluationSchema.optional() }).strict()

export const NorthstarSettingsSchema = SettingsSchema
export const NorthstarStateSchema = z.object({
  settings: SettingsSchema,
  evaluation: NorthstarEvaluationSchema,
}).strict()

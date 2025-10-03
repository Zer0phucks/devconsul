/**
 * Zod Validation Schemas for Cron Jobs
 */

import { z } from "zod";
import { CronJobType } from "@prisma/client";

/**
 * Cron frequency enum
 */
export const cronFrequencySchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]);

/**
 * Base time configuration
 */
export const timeConfigSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  timezone: z.string().min(1).default("UTC"),
});

/**
 * Weekly configuration
 */
export const weeklyConfigSchema = timeConfigSchema.extend({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday
});

/**
 * Monthly configuration
 */
export const monthlyConfigSchema = timeConfigSchema.extend({
  dayOfMonth: z.number().int().min(1).max(31),
});

/**
 * Custom cron expression configuration
 */
export const customConfigSchema = z.object({
  expression: z.string().min(1),
  timezone: z.string().min(1).default("UTC"),
});

/**
 * Create cron job schema
 */
export const createCronJobSchema = z.object({
  projectId: z.string().cuid(),
  type: z.nativeEnum(CronJobType),
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  frequency: cronFrequencySchema,
  timeConfig: z.union([
    timeConfigSchema,
    weeklyConfigSchema,
    monthlyConfigSchema,
    customConfigSchema,
  ]),
  isEnabled: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().int().min(0).max(3600).default(300),
  jobConfig: z.record(z.any()).optional(),
});

/**
 * Update cron job schema
 */
export const updateCronJobSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  frequency: cronFrequencySchema.optional(),
  timeConfig: z
    .union([
      timeConfigSchema,
      weeklyConfigSchema,
      monthlyConfigSchema,
      customConfigSchema,
    ])
    .optional(),
  isEnabled: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  retryDelay: z.number().int().min(0).max(3600).optional(),
  jobConfig: z.record(z.any()).optional(),
});

/**
 * Toggle cron job schema
 */
export const toggleCronJobSchema = z.object({
  isEnabled: z.boolean(),
});

/**
 * Trigger job schema
 */
export const triggerJobSchema = z.object({
  jobId: z.string().cuid(),
});

/**
 * Get executions query schema
 */
export const getExecutionsSchema = z.object({
  jobId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Type exports
 */
export type CreateCronJobInput = z.infer<typeof createCronJobSchema>;
export type UpdateCronJobInput = z.infer<typeof updateCronJobSchema>;
export type ToggleCronJobInput = z.infer<typeof toggleCronJobSchema>;
export type TriggerJobInput = z.infer<typeof triggerJobSchema>;
export type GetExecutionsQuery = z.infer<typeof getExecutionsSchema>;

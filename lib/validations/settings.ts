import { z } from "zod"

// Platform configuration schema
export const platformConfigSchema = z.object({
  type: z.enum(["BLOG", "NEWSLETTER", "TWITTER", "LINKEDIN", "FACEBOOK", "REDDIT"]),
  generateEnabled: z.boolean(),
  publishEnabled: z.boolean(),
  isConnected: z.boolean(),
})

export const platformsConfigSchema = z.array(platformConfigSchema)

// Frequency and scheduling schema
export const frequencySchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  timezone: z.string().min(1, "Timezone is required"),
})

// Brand voice schema
export const brandVoiceSchema = z.object({
  tone: z.enum(["professional", "casual", "technical", "friendly", "authoritative"]),
  targetAudience: z.string().max(100, "Target audience must be 100 characters or less"),
  messagingThemes: z.array(z.string().max(50)).max(10, "Maximum 10 themes allowed"),
  customInstructions: z.string().max(500, "Custom instructions must be 500 characters or less").optional(),
})

// Activity filters schema
export const activityFiltersSchema = z.object({
  enabledEvents: z.array(z.enum(["commits", "pull_requests", "issues", "releases"])),
  contributorFilter: z.string(), // "all" or specific username
  branchFilter: z.enum(["main", "all", "custom"]),
  customBranch: z.string().optional(),
})

// Complete settings schema (for API requests)
export const contentSettingsSchema = z.object({
  platforms: platformsConfigSchema,
  schedule: frequencySchema,
  brandVoice: brandVoiceSchema,
  activityFilters: activityFiltersSchema,
})

// Partial update schema (for optimistic updates)
export const partialSettingsSchema = contentSettingsSchema.partial()

// Type exports
export type PlatformConfig = z.infer<typeof platformConfigSchema>
export type PlatformsConfig = z.infer<typeof platformsConfigSchema>
export type FrequencyConfig = z.infer<typeof frequencySchema>
export type BrandVoiceConfig = z.infer<typeof brandVoiceSchema>
export type ActivityFiltersConfig = z.infer<typeof activityFiltersSchema>
export type ContentSettings = z.infer<typeof contentSettingsSchema>
export type PartialSettings = z.infer<typeof partialSettingsSchema>

// Default settings
export const defaultSettings: ContentSettings = {
  platforms: [
    { type: "BLOG", generateEnabled: true, publishEnabled: false, isConnected: false },
    { type: "NEWSLETTER", generateEnabled: true, publishEnabled: false, isConnected: false },
    { type: "TWITTER", generateEnabled: true, publishEnabled: false, isConnected: false },
    { type: "LINKEDIN", generateEnabled: true, publishEnabled: false, isConnected: false },
    { type: "FACEBOOK", generateEnabled: false, publishEnabled: false, isConnected: false },
    { type: "REDDIT", generateEnabled: false, publishEnabled: false, isConnected: false },
  ],
  schedule: {
    frequency: "weekly",
    time: "09:00",
    timezone: "UTC",
  },
  brandVoice: {
    tone: "professional",
    targetAudience: "",
    messagingThemes: [],
    customInstructions: "",
  },
  activityFilters: {
    enabledEvents: ["commits", "pull_requests", "issues", "releases"],
    contributorFilter: "all",
    branchFilter: "main",
    customBranch: "",
  },
}

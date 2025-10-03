import { z } from "zod";
import { ContentStatus, PlatformType } from "@prisma/client";

// Content query schema
export const contentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  platform: z.nativeEnum(PlatformType).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "publishedAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ContentQuery = z.infer<typeof contentQuerySchema>;

// Content with publication info
export const contentWithPublicationsSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  body: z.string(),
  status: z.nativeEnum(ContentStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date().nullable(),
  scheduledFor: z.date().nullable(),
  isAIGenerated: z.boolean(),
  aiModel: z.string().nullable(),
  version: z.number(),
  publications: z.array(z.object({
    id: z.string(),
    platformId: z.string(),
    platformType: z.nativeEnum(PlatformType),
    platformName: z.string(),
    status: z.string(),
    publishedAt: z.date().nullable(),
    platformUrl: z.string().nullable(),
  })),
});

export type ContentWithPublications = z.infer<typeof contentWithPublicationsSchema>;

// Content detail with versions
export const contentDetailSchema = contentWithPublicationsSchema.extend({
  rawContent: z.string(),
  tags: z.array(z.string()),
  categories: z.array(z.string()),
  coverImage: z.string().nullable(),
  aiPrompt: z.string().nullable(),
  aiMetadata: z.any().nullable(),
  parentId: z.string().nullable(),
  versions: z.array(z.object({
    id: z.string(),
    version: z.number(),
    createdAt: z.date(),
    title: z.string(),
  })),
});

export type ContentDetail = z.infer<typeof contentDetailSchema>;

// Platform icon mapping
export const platformIcons = {
  HASHNODE: "Hash",
  DEVTO: "Code",
  MEDIUM: "BookOpen",
  LINKEDIN: "Linkedin",
  TWITTER: "Twitter",
  FACEBOOK: "Facebook",
  REDDIT: "MessageCircle",
  RSS_FEED: "Rss",
  NEWSLETTER: "Mail",
  RESEND: "Send",
  SENDGRID: "Mail",
  MAILCHIMP: "Mail",
  WORDPRESS: "FileText",
  GHOST: "Ghost",
  WEBHOOK: "Webhook",
} as const;

// Platform colors
export const platformColors = {
  HASHNODE: "blue",
  DEVTO: "gray",
  MEDIUM: "green",
  LINKEDIN: "blue",
  TWITTER: "sky",
  FACEBOOK: "blue",
  REDDIT: "orange",
  RSS_FEED: "orange",
  NEWSLETTER: "purple",
  RESEND: "violet",
  SENDGRID: "blue",
  MAILCHIMP: "yellow",
  WORDPRESS: "blue",
  GHOST: "gray",
  WEBHOOK: "gray",
} as const;

// Status badge colors
export const statusColors = {
  DRAFT: "gray",
  SCHEDULED: "blue",
  PUBLISHED: "green",
  FAILED: "red",
  ARCHIVED: "gray",
} as const;

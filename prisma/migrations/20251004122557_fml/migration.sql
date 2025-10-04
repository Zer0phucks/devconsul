/*
  Warnings:

  - You are about to drop the `kv_store` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('HASHNODE', 'DEVTO', 'MEDIUM', 'LINKEDIN', 'TWITTER', 'FACEBOOK', 'REDDIT', 'RSS_FEED', 'NEWSLETTER', 'RESEND', 'SENDGRID', 'MAILCHIMP', 'WORDPRESS', 'GHOST', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('GITHUB_MARKDOWN', 'GITHUB_MDX', 'AI_GENERATED', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "SettingsScope" AS ENUM ('USER', 'PROJECT', 'PLATFORM');

-- CreateEnum
CREATE TYPE "CronJobType" AS ENUM ('SYNC_GITHUB', 'PUBLISH_CONTENT', 'GENERATE_CONTENT', 'CLEANUP', 'ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CronJobStatus" AS ENUM ('IDLE', 'RUNNING', 'COMPLETED', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "AuditResource" AS ENUM ('USER', 'PROJECT', 'PLATFORM', 'CONTENT', 'SETTINGS', 'CRON_JOB', 'EMAIL_CAMPAIGN');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('RESEND', 'SENDGRID', 'MAILCHIMP');

-- CreateEnum
CREATE TYPE "EmailRecipientStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('NEWSLETTER', 'ANNOUNCEMENT', 'DIGEST', 'PLAIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TemplatePlatform" AS ENUM ('BLOG', 'EMAIL', 'NEWSLETTER', 'TWITTER', 'LINKEDIN', 'FACEBOOK', 'REDDIT', 'HASHNODE', 'DEVTO', 'MEDIUM', 'WORDPRESS', 'GHOST', 'ALL');

-- CreateEnum
CREATE TYPE "PromptCategory" AS ENUM ('TECHNICAL_UPDATE', 'FEATURE_ANNOUNCEMENT', 'BUG_FIX', 'RELEASE_NOTES', 'TUTORIAL', 'CASE_STUDY', 'WEEKLY_DIGEST', 'MONTHLY_SUMMARY', 'PRODUCT_UPDATE', 'COMMUNITY_UPDATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ImageRole" AS ENUM ('FEATURED', 'HERO', 'INLINE', 'THUMBNAIL', 'OG_IMAGE', 'TWITTER_CARD', 'EMAIL_HEADER', 'BANNER');

-- CreateEnum
CREATE TYPE "ImageJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'PUBLISHED', 'FAILED', 'CANCELLED', 'EXPIRED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ConflictType" AS ENUM ('SAME_TIME', 'OVERLAPPING', 'RATE_LIMIT', 'RESOURCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('EXECUTIVE_SUMMARY', 'CONTENT_PERFORMANCE', 'COST_ANALYSIS', 'MONTHLY_DIGEST', 'WEEKLY_DIGEST', 'REPOSITORY_INSIGHTS', 'PUBLISHING_ANALYTICS', 'PLATFORM_BREAKDOWN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'JSON', 'HTML', 'ICAL', 'ZIP');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailReportType" AS ENUM ('WEEKLY_SUMMARY', 'MONTHLY_DIGEST', 'BUDGET_ALERT', 'PERFORMANCE_HIGHLIGHTS', 'PUBLISHING_FAILURES', 'SCHEDULE_CONFLICTS', 'CUSTOM_METRICS');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('CONTENT_HISTORY', 'ANALYTICS_SNAPSHOT', 'SCHEDULED_CALENDAR', 'IMAGE_LIBRARY', 'PLATFORM_DATA', 'FULL_BACKUP');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InsightPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NewsworthyType" AS ENUM ('MAJOR_RELEASE', 'FEATURE_RELEASE', 'BREAKING_CHANGE', 'SECURITY_FIX', 'CRITICAL_BUGFIX', 'PERFORMANCE_IMPROVEMENT', 'MILESTONE', 'FIRST_RELEASE', 'MAJOR_REFACTOR', 'DOCUMENTATION', 'COLLABORATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EventImpact" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "MetricPeriodType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CostService" AS ENUM ('OPENAI_TEXT', 'OPENAI_IMAGE', 'ANTHROPIC_TEXT', 'TWITTER_API', 'LINKEDIN_API', 'FACEBOOK_API', 'REDDIT_API', 'MAILCHIMP_API', 'SENDGRID_API', 'RESEND_API', 'MEDIUM_API', 'HASHNODE_API', 'DEVTO_API', 'WORDPRESS_API', 'GHOST_API', 'VERCEL_BLOB', 'CLOUDFLARE_R2', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('CONTENT_GENERATED', 'CONTENT_PUBLISHED', 'CONTENT_SCHEDULED', 'CONTENT_FAILED', 'PLATFORM_CONNECTED', 'PLATFORM_DISCONNECTED', 'IMAGE_GENERATED', 'EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'API_CALL', 'COST_INCURRED', 'USER_ACTION', 'SYSTEM_EVENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'ESCALATED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES');

-- CreateEnum
CREATE TYPE "SafetyCheckType" AS ENUM ('BLACKLIST', 'PROFANITY', 'AI_MODERATION', 'PII', 'CREDENTIALS', 'BRAND_SAFETY', 'COMPLIANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WHITELIST_ADDED');

-- CreateEnum
CREATE TYPE "SafetyAction" AS ENUM ('BLOCK', 'WARN', 'AUTO_FIX', 'FLAG_FOR_REVIEW', 'NONE');

-- CreateEnum
CREATE TYPE "BlacklistCategory" AS ENUM ('PROFANITY', 'COMPETITOR', 'SENSITIVE', 'ILLEGAL', 'SPAM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VersionChangeType" AS ENUM ('CREATED', 'EDITED', 'AI_REGENERATED', 'APPROVED', 'REJECTED', 'AUTO_SAVED', 'BRANCHED', 'MERGED', 'ROLLBACK');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('VIEWER', 'EDITOR', 'REVIEWER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "ErrorLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL');

-- CreateEnum
CREATE TYPE "ErrorStatus" AS ENUM ('NEW', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'WONT_FIX', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "TestRunType" AS ENUM ('DRY_RUN', 'VALIDATION_ONLY', 'CONNECTIVITY', 'CONTENT_GENERATION', 'SCHEDULING', 'FULL_FLOW');

-- CreateEnum
CREATE TYPE "TestRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('PLATFORM_CONNECTION', 'AUTH_TOKEN', 'CONTENT_FORMAT', 'CHARACTER_LIMITS', 'IMAGE_SIZE', 'LINK_VALIDITY', 'HASHTAG_CHECK', 'RATE_LIMIT', 'COST_ESTIMATE', 'SCHEDULING', 'PROFANITY', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "ValidationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RepositoryActivityType" AS ENUM ('COMMITS', 'PULL_REQUESTS', 'ISSUES', 'RELEASES', 'CONTRIBUTORS', 'CODE_CHANGES', 'MILESTONES');

-- CreateEnum
CREATE TYPE "TestReportType" AS ENUM ('DRY_RUN_SUMMARY', 'VALIDATION_REPORT', 'DIFF_REPORT', 'COMPREHENSIVE', 'EXECUTIVE');

-- DropTable
DROP TABLE "public"."kv_store";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preferences" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "githubRepoUrl" TEXT,
    "githubRepoOwner" TEXT,
    "githubRepoName" TEXT,
    "githubBranch" TEXT DEFAULT 'main',
    "githubWebhookId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "tags" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "PlatformType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "config" JSONB,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastConnectedAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "totalPublished" INTEGER NOT NULL DEFAULT 0,
    "lastPublishedAt" TIMESTAMP(3),

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "sourcePath" TEXT,
    "sourceCommitSha" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "htmlContent" TEXT,
    "tags" TEXT[],
    "categories" TEXT[],
    "coverImage" TEXT,
    "canonicalUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "aiMetadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_publications" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "platformPostId" TEXT,
    "platformUrl" TEXT,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "platformMetadata" JSONB,

    CONSTRAINT "content_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scope" "SettingsScope" NOT NULL DEFAULT 'PROJECT',
    "contentPreferences" JSONB,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "publishDelay" INTEGER,
    "contentFilters" JSONB,
    "cronFrequency" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "publishingSchedule" JSONB,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "notificationEvents" TEXT[],
    "customSettings" JSONB,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CronJobType" NOT NULL,
    "schedule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "CronJobStatus" NOT NULL DEFAULT 'IDLE',
    "lastRunAt" TIMESTAMP(3),
    "lastSuccess" TIMESTAMP(3),
    "lastFailure" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 300,
    "config" JSONB,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_executions" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "error" TEXT,
    "stackTrace" TEXT,
    "triggeredBy" TEXT,
    "metadata" JSONB,
    "itemsProcessed" INTEGER,
    "itemsSuccess" INTEGER,
    "itemsFailed" INTEGER,
    "output" JSONB,

    CONSTRAINT "cron_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "resource" "AuditResource" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "projectId" TEXT,
    "platformId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "replyTo" TEXT,
    "templateId" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "emailProvider" "EmailProvider" NOT NULL DEFAULT 'RESEND',
    "platformId" TEXT,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "customFields" JSONB,
    "token" TEXT NOT NULL,
    "status" "EmailRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bounceType" TEXT,
    "errorMsg" TEXT,

    CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_unsubscribes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "projectId" TEXT,
    "campaignId" TEXT,
    "token" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resubscribedAt" TIMESTAMP(3),

    CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "type" "EmailTemplateType" NOT NULL DEFAULT 'CUSTOM',
    "variables" TEXT[],
    "category" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platform" "TemplatePlatform" NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "variables" TEXT[],
    "tags" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "effectivenessScore" DOUBLE PRECISION,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_library" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PromptCategory" NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "templateId" TEXT,
    "variables" TEXT[],
    "platform" "TemplatePlatform" NOT NULL,
    "contentType" TEXT,
    "tone" TEXT,
    "targetLength" INTEGER,
    "tags" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "averageRating" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "averageTokenUsage" INTEGER,

    CONSTRAINT "prompt_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_template_history" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" TEXT,
    "promptId" TEXT,
    "variables" JSONB NOT NULL,
    "platform" "TemplatePlatform" NOT NULL,
    "generatedContent" TEXT NOT NULL,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "editDistance" INTEGER,
    "timeToEdit" INTEGER,
    "wasPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "engagementScore" DOUBLE PRECISION,
    "userRating" INTEGER,

    CONSTRAINT "content_template_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "aspectRatio" DOUBLE PRECISION NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'vercel-blob',
    "alt" TEXT,
    "caption" TEXT,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "categories" TEXT[],
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "aiRevisedPrompt" TEXT,
    "aiQuality" TEXT,
    "aiStyle" TEXT,
    "generatedAt" TIMESTAMP(3),
    "platformVersions" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "originalSize" INTEGER,
    "optimizedAt" TIMESTAMP(3),

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_images" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "ImageRole" NOT NULL DEFAULT 'INLINE',
    "platformType" "PlatformType",
    "platformUrl" TEXT,
    "position" INTEGER,
    "settings" JSONB,

    CONSTRAINT "content_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_images" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "ImageRole" NOT NULL DEFAULT 'EMAIL_HEADER',
    "position" INTEGER,
    "settings" JSONB,

    CONSTRAINT "email_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_generation_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "prompts" TEXT[],
    "model" TEXT NOT NULL DEFAULT 'dall-e-3',
    "quality" TEXT NOT NULL DEFAULT 'standard',
    "style" TEXT NOT NULL DEFAULT 'vivid',
    "size" TEXT NOT NULL DEFAULT '1024x1024',
    "status" "ImageJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errors" JSONB,
    "imageIds" TEXT[],

    CONSTRAINT "image_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_content" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "localTime" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "recurringConfig" JSONB,
    "recurringUntil" TIMESTAMP(3),
    "lastOccurrence" TIMESTAMP(3),
    "platforms" TEXT[],
    "publishDelay" INTEGER DEFAULT 0,
    "queueStatus" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "queuedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 5,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 300,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "error" TEXT,
    "errorDetails" JSONB,
    "conflictsWith" TEXT[],
    "conflictNote" TEXT,
    "inngestJobId" TEXT,
    "inngestEventId" TEXT,
    "metadata" JSONB,
    "notes" TEXT,

    CONSTRAINT "scheduled_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalQueued" INTEGER NOT NULL DEFAULT 0,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalCancelled" INTEGER NOT NULL DEFAULT 0,
    "avgWaitTime" INTEGER,
    "avgProcessingTime" INTEGER,
    "peakQueueLength" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "platformStats" JSONB,

    CONSTRAINT "queue_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_conflicts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schedule1Id" TEXT NOT NULL,
    "schedule2Id" TEXT NOT NULL,
    "conflictType" "ConflictType" NOT NULL,
    "conflictTime" TIMESTAMP(3) NOT NULL,
    "conflictReason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "severity" "ConflictSeverity" NOT NULL DEFAULT 'WARNING',

    CONSTRAINT "schedule_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_configs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "ReportType" NOT NULL,
    "outputFormat" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "sections" TEXT[],
    "metrics" TEXT[],
    "charts" TEXT[],
    "dateRange" JSONB,
    "platformFilters" TEXT[],
    "contentFilters" JSONB,
    "customFilters" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedulePattern" TEXT,
    "deliveryMethod" TEXT,
    "deliveryConfig" JSONB,
    "lastGeneratedAt" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3),
    "branding" JSONB,
    "template" TEXT,
    "options" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "category" TEXT,

    CONSTRAINT "report_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_history" (
    "id" TEXT NOT NULL,
    "configId" TEXT,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportType" "ReportType" NOT NULL,
    "outputFormat" "ReportFormat" NOT NULL,
    "reportName" TEXT NOT NULL,
    "description" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationTime" INTEGER,
    "dataFrom" TIMESTAMP(3) NOT NULL,
    "dataTo" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "recordCount" INTEGER,
    "platformsCount" INTEGER,
    "contentCount" INTEGER,
    "summary" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "errorDetails" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "deliveryMethod" TEXT,
    "deliveryStatus" TEXT,
    "recipients" JSONB,
    "inngestJobId" TEXT,

    CONSTRAINT "report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_report_subscriptions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportType" "EmailReportType" NOT NULL,
    "frequency" TEXT NOT NULL,
    "deliveryDay" INTEGER,
    "deliveryTime" TEXT NOT NULL DEFAULT '09:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recipients" TEXT[],
    "ccRecipients" TEXT[],
    "includeMetrics" TEXT[],
    "platformFilters" TEXT[],
    "minThreshold" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3),
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "inngestScheduleId" TEXT,

    CONSTRAINT "email_report_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exportType" "ExportType" NOT NULL,
    "outputFormat" "ReportFormat" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "filters" JSONB,
    "options" JSONB,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalRecords" INTEGER,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "error" TEXT,
    "errorDetails" JSONB,
    "inngestJobId" TEXT,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_insights" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" "InsightPeriod" NOT NULL DEFAULT 'DAILY',
    "totalCommits" INTEGER NOT NULL DEFAULT 0,
    "totalPullRequests" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "totalReleases" INTEGER NOT NULL DEFAULT 0,
    "commitStats" JSONB,
    "prStats" JSONB,
    "issueStats" JSONB,
    "contributorCount" INTEGER NOT NULL DEFAULT 0,
    "topContributors" JSONB,
    "contributorDiversity" DOUBLE PRECISION,
    "languageStats" JSONB,
    "fileChangeFrequency" JSONB,
    "hotspots" JSONB,
    "branchStats" JSONB,
    "commitVelocity" DOUBLE PRECISION,
    "prMergeRate" DOUBLE PRECISION,
    "issueResolutionRate" DOUBLE PRECISION,
    "healthScore" INTEGER DEFAULT 0,
    "healthFactors" JSONB,
    "healthTrends" JSONB,
    "newsworthyItems" JSONB,
    "heatmapData" JSONB,
    "cacheExpiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "repository_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_stats" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "githubId" INTEGER,
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalCommits" INTEGER NOT NULL DEFAULT 0,
    "totalPRs" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalReleases" INTEGER NOT NULL DEFAULT 0,
    "linesAdded" INTEGER NOT NULL DEFAULT 0,
    "linesDeleted" INTEGER NOT NULL DEFAULT 0,
    "filesChanged" INTEGER NOT NULL DEFAULT 0,
    "firstContribution" TIMESTAMP(3),
    "lastContribution" TIMESTAMP(3),
    "activeStreaks" JSONB,
    "contributionDays" INTEGER NOT NULL DEFAULT 0,
    "prsMerged" INTEGER NOT NULL DEFAULT 0,
    "prsReviewed" INTEGER NOT NULL DEFAULT 0,
    "avgPRSize" DOUBLE PRECISION,
    "avgReviewTime" DOUBLE PRECISION,
    "issuesOpened" INTEGER NOT NULL DEFAULT 0,
    "issuesClosed" INTEGER NOT NULL DEFAULT 0,
    "issuesCommented" INTEGER NOT NULL DEFAULT 0,
    "languageBreakdown" JSONB,
    "impactScore" INTEGER DEFAULT 0,
    "impactFactors" JSONB,
    "activityByDay" JSONB,
    "activityByHour" JSONB,
    "peakActivityTime" TEXT,

    CONSTRAINT "contributor_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsworthy_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventType" "NewsworthyType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "htmlUrl" TEXT,
    "eventData" JSONB NOT NULL,
    "newsworthinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiReasoning" TEXT NOT NULL,
    "aiModel" TEXT,
    "category" TEXT[],
    "impact" "EventImpact" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "userRating" INTEGER,
    "userDismissed" BOOLEAN NOT NULL DEFAULT false,
    "userBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "wasPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedTo" TEXT[],

    CONSTRAINT "newsworthy_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" "MetricPeriodType" NOT NULL DEFAULT 'DAILY',
    "totalGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalGeneratedTokens" INTEGER NOT NULL DEFAULT 0,
    "totalGeneratedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generationSuccessRate" DOUBLE PRECISION,
    "totalPublished" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalScheduled" INTEGER NOT NULL DEFAULT 0,
    "publishSuccessRate" DOUBLE PRECISION,
    "blogPosts" INTEGER NOT NULL DEFAULT 0,
    "emailCampaigns" INTEGER NOT NULL DEFAULT 0,
    "socialPosts" INTEGER NOT NULL DEFAULT 0,
    "newslettersSent" INTEGER NOT NULL DEFAULT 0,
    "platformBreakdown" JSONB,
    "openaiGenerations" INTEGER NOT NULL DEFAULT 0,
    "anthropicGenerations" INTEGER NOT NULL DEFAULT 0,
    "openaiTokens" INTEGER NOT NULL DEFAULT 0,
    "anthropicTokens" INTEGER NOT NULL DEFAULT 0,
    "openaiCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anthropicCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgContentPerDay" DOUBLE PRECISION,
    "avgContentPerWeek" DOUBLE PRECISION,
    "avgContentPerMonth" DOUBLE PRECISION,
    "avgEditDistance" DOUBLE PRECISION,
    "avgTimeToPublish" INTEGER,

    CONSTRAINT "content_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "contentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "platformType" "PlatformType" NOT NULL,
    "views" INTEGER DEFAULT 0,
    "likes" INTEGER DEFAULT 0,
    "shares" INTEGER DEFAULT 0,
    "comments" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "impressions" INTEGER DEFAULT 0,
    "engagementRate" DOUBLE PRECISION,
    "clickThroughRate" DOUBLE PRECISION,
    "followers" INTEGER,
    "subscribers" INTEGER,
    "followerGrowth" INTEGER,
    "platformSpecificMetrics" JSONB,
    "contentPublicationId" TEXT,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_tracking" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "service" "CostService" NOT NULL,
    "operation" TEXT NOT NULL,
    "resourceType" TEXT,
    "tokensUsed" INTEGER,
    "imagesGenerated" INTEGER,
    "apiCalls" INTEGER,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metadata" JSONB,
    "billingPeriod" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_summary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" "MetricPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "aiTextCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiImageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformApiCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailServiceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openaiCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anthropicCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vercelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resendCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sendgridCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mailchimpCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cloudflareR2Cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalImagesGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalApiCalls" INTEGER NOT NULL DEFAULT 0,
    "avgCostPerContent" DOUBLE PRECISION,
    "avgCostPerPublish" DOUBLE PRECISION,
    "budgetLimit" DOUBLE PRECISION,
    "budgetUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetPercent" DOUBLE PRECISION,

    CONSTRAINT "cost_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_performance" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentTitle" TEXT,
    "platform" "PlatformType" NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "rankOverall" INTEGER,
    "rankInCategory" INTEGER,
    "rankOnPlatform" INTEGER,
    "firstDayViews" INTEGER,
    "firstWeekViews" INTEGER,
    "peakEngagementDate" TIMESTAMP(3),

    CONSTRAINT "content_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "AnalyticsEventType" NOT NULL,
    "eventName" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "contentId" TEXT,
    "platformId" TEXT,
    "metadata" JSONB,
    "value" DOUBLE PRECISION,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMsg" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_approvals" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedTo" TEXT[],
    "assignedAt" TIMESTAMP(3),
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ApprovalPriority" NOT NULL DEFAULT 'MEDIUM',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "decision" "ApprovalDecision",
    "requestNotes" TEXT,
    "feedback" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "escalatedTo" TEXT,
    "escalationReason" TEXT,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "autoApprovalRule" TEXT,
    "history" JSONB,
    "metadata" JSONB,

    CONSTRAINT "content_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_comments" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "mentions" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "approval_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_safety_checks" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkType" "SafetyCheckType" NOT NULL,
    "checkVersion" TEXT,
    "safetyScore" INTEGER NOT NULL DEFAULT 100,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "severity" "SafetySeverity" NOT NULL DEFAULT 'INFO',
    "violations" JSONB,
    "flaggedTerms" TEXT[],
    "aiModerationResult" JSONB,
    "aiCategories" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "action" "SafetyAction",
    "actionAt" TIMESTAMP(3),
    "actionBy" TEXT,
    "isFalsePositive" BOOLEAN NOT NULL DEFAULT false,
    "falsePositiveReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "content_safety_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist_terms" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "term" TEXT NOT NULL,
    "category" "BlacklistCategory" NOT NULL,
    "severity" "SafetySeverity" NOT NULL DEFAULT 'WARNING',
    "isRegex" BOOLEAN NOT NULL DEFAULT false,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "matchWholeWord" BOOLEAN NOT NULL DEFAULT false,
    "action" "SafetyAction" NOT NULL DEFAULT 'WARN',
    "reason" TEXT,
    "addedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "blacklist_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whitelist_terms" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "term" TEXT NOT NULL,
    "category" TEXT,
    "isRegex" BOOLEAN NOT NULL DEFAULT false,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "addedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,

    CONSTRAINT "whitelist_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "versionLabel" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "rawContent" TEXT NOT NULL,
    "htmlContent" TEXT,
    "tags" TEXT[],
    "categories" TEXT[],
    "coverImage" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "changeType" "VersionChangeType" NOT NULL,
    "changeReason" TEXT,
    "diffSummary" JSONB,
    "wordCount" INTEGER,
    "charCount" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "status" "ContentStatus",
    "branchName" TEXT,
    "parentVersionId" TEXT,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'EDITOR',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_approval_rules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "lastAppliedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "auto_approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "step1Completed" BOOLEAN NOT NULL DEFAULT false,
    "step1Data" JSONB,
    "step2Completed" BOOLEAN NOT NULL DEFAULT false,
    "step2Data" JSONB,
    "step3Completed" BOOLEAN NOT NULL DEFAULT false,
    "step3Data" JSONB,
    "step4Completed" BOOLEAN NOT NULL DEFAULT false,
    "step4Data" JSONB,
    "step5Completed" BOOLEAN NOT NULL DEFAULT false,
    "step5Data" JSONB,
    "step6Completed" BOOLEAN NOT NULL DEFAULT false,
    "step6Data" JSONB,
    "step7Completed" BOOLEAN NOT NULL DEFAULT false,
    "step7Data" JSONB,
    "step8Completed" BOOLEAN NOT NULL DEFAULT false,
    "step8Data" JSONB,
    "lastActiveStep" INTEGER NOT NULL DEFAULT 1,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canResume" BOOLEAN NOT NULL DEFAULT true,
    "skippedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "tourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tourStartedAt" TIMESTAMP(3),
    "tourCompletedAt" TIMESTAMP(3),
    "tourSkippedAt" TIMESTAMP(3),
    "tourProgress" JSONB,
    "metadata" JSONB,

    CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentryEventId" TEXT,
    "errorHash" TEXT NOT NULL,
    "fingerprint" TEXT[],
    "level" "ErrorLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "stackTrace" TEXT,
    "errorType" TEXT,
    "errorCode" TEXT,
    "userId" TEXT,
    "projectId" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "release" TEXT,
    "url" TEXT,
    "method" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "context" JSONB,
    "tags" TEXT[],
    "breadcrumbs" JSONB,
    "status" "ErrorStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "relatedIssue" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_patterns" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "errorHash" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 0,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "canAutoRecover" BOOLEAN NOT NULL DEFAULT false,
    "recoveryCode" TEXT,
    "alertThreshold" INTEGER NOT NULL DEFAULT 10,
    "alertCooldown" INTEGER NOT NULL DEFAULT 3600,
    "lastAlertAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "severity" "ErrorLevel" NOT NULL DEFAULT 'ERROR',

    CONSTRAINT "error_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "testType" "TestRunType" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "contentId" TEXT,
    "platformIds" TEXT[],
    "status" "TestRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "passedChecks" INTEGER NOT NULL DEFAULT 0,
    "failedChecks" INTEGER NOT NULL DEFAULT 0,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "recommendations" TEXT[],
    "error" TEXT,
    "errorDetails" JSONB,
    "config" JSONB,
    "metadata" JSONB,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_results" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationType" "ValidationType" NOT NULL,
    "platformId" TEXT,
    "platformType" "PlatformType",
    "contentId" TEXT,
    "passed" BOOLEAN NOT NULL,
    "severity" "ValidationSeverity" NOT NULL,
    "checkName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expected" TEXT,
    "actual" TEXT,
    "suggestion" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "stackTrace" TEXT,
    "autoFixable" BOOLEAN NOT NULL DEFAULT false,
    "autoFixCode" TEXT,
    "fixApplied" BOOLEAN NOT NULL DEFAULT false,
    "fixedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_diffs" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "fromSha" TEXT,
    "toSha" TEXT,
    "activityType" "RepositoryActivityType"[],
    "totalChanges" INTEGER NOT NULL DEFAULT 0,
    "newCommits" INTEGER NOT NULL DEFAULT 0,
    "newPullRequests" INTEGER NOT NULL DEFAULT 0,
    "newIssues" INTEGER NOT NULL DEFAULT 0,
    "newReleases" INTEGER NOT NULL DEFAULT 0,
    "newContributors" INTEGER NOT NULL DEFAULT 0,
    "commitStats" JSONB,
    "topContributors" JSONB,
    "filesAdded" TEXT[],
    "filesModified" TEXT[],
    "filesDeleted" TEXT[],
    "prStats" JSONB,
    "issueStats" JSONB,
    "diffData" JSONB,
    "heatmap" JSONB,
    "newsworthyItems" JSONB,
    "highlights" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "repository_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_reports" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportType" "TestReportType" NOT NULL,
    "reportFormat" "ReportFormat" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationTime" INTEGER,
    "fileUrl" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "summary" JSONB,
    "recordCount" INTEGER,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveryMethod" TEXT,
    "recipients" JSONB,
    "metadata" JSONB,

    CONSTRAINT "test_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_publications" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platformType" "PlatformType" NOT NULL,
    "platformName" TEXT NOT NULL,
    "simulatedTitle" TEXT NOT NULL,
    "simulatedBody" TEXT NOT NULL,
    "simulatedExcerpt" TEXT,
    "simulatedImages" JSONB,
    "wouldSucceed" BOOLEAN NOT NULL,
    "estimatedTime" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "errors" TEXT[],
    "warnings" TEXT[],
    "simulatedResponse" JSONB,
    "simulatedUrl" TEXT,
    "titleLength" INTEGER,
    "bodyLength" INTEGER,
    "exceedsLimits" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "mock_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_metrics" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "totalDurationMs" BIGINT NOT NULL DEFAULT 0,
    "minDurationMs" INTEGER NOT NULL DEFAULT 0,
    "maxDurationMs" INTEGER NOT NULL DEFAULT 0,
    "lastExecutionAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "baselineAvgMs" DOUBLE PRECISION NOT NULL,
    "baselineP95Ms" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dead_letter_queue" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dead_letter_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "projects_githubRepoOwner_githubRepoName_idx" ON "projects"("githubRepoOwner", "githubRepoName");

-- CreateIndex
CREATE INDEX "platforms_projectId_idx" ON "platforms"("projectId");

-- CreateIndex
CREATE INDEX "platforms_type_idx" ON "platforms"("type");

-- CreateIndex
CREATE INDEX "platforms_isConnected_idx" ON "platforms"("isConnected");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_projectId_type_key" ON "platforms"("projectId", "type");

-- CreateIndex
CREATE INDEX "content_projectId_idx" ON "content"("projectId");

-- CreateIndex
CREATE INDEX "content_status_idx" ON "content"("status");

-- CreateIndex
CREATE INDEX "content_publishedAt_idx" ON "content"("publishedAt");

-- CreateIndex
CREATE INDEX "content_scheduledFor_idx" ON "content"("scheduledFor");

-- CreateIndex
CREATE INDEX "content_sourceCommitSha_idx" ON "content"("sourceCommitSha");

-- CreateIndex
CREATE INDEX "content_createdAt_idx" ON "content"("createdAt");

-- CreateIndex
CREATE INDEX "content_publications_contentId_idx" ON "content_publications"("contentId");

-- CreateIndex
CREATE INDEX "content_publications_platformId_idx" ON "content_publications"("platformId");

-- CreateIndex
CREATE INDEX "content_publications_status_idx" ON "content_publications"("status");

-- CreateIndex
CREATE INDEX "content_publications_publishedAt_idx" ON "content_publications"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_publications_contentId_platformId_key" ON "content_publications"("contentId", "platformId");

-- CreateIndex
CREATE INDEX "settings_userId_idx" ON "settings"("userId");

-- CreateIndex
CREATE INDEX "settings_projectId_idx" ON "settings"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_userId_projectId_scope_key" ON "settings"("userId", "projectId", "scope");

-- CreateIndex
CREATE INDEX "cron_jobs_projectId_idx" ON "cron_jobs"("projectId");

-- CreateIndex
CREATE INDEX "cron_jobs_isEnabled_idx" ON "cron_jobs"("isEnabled");

-- CreateIndex
CREATE INDEX "cron_jobs_status_idx" ON "cron_jobs"("status");

-- CreateIndex
CREATE INDEX "cron_jobs_nextRunAt_idx" ON "cron_jobs"("nextRunAt");

-- CreateIndex
CREATE INDEX "cron_jobs_type_idx" ON "cron_jobs"("type");

-- CreateIndex
CREATE INDEX "cron_executions_jobId_idx" ON "cron_executions"("jobId");

-- CreateIndex
CREATE INDEX "cron_executions_status_idx" ON "cron_executions"("status");

-- CreateIndex
CREATE INDEX "cron_executions_startedAt_idx" ON "cron_executions"("startedAt");

-- CreateIndex
CREATE INDEX "cron_executions_createdAt_idx" ON "cron_executions"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "email_campaigns_projectId_idx" ON "email_campaigns"("projectId");

-- CreateIndex
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");

-- CreateIndex
CREATE INDEX "email_campaigns_scheduledAt_idx" ON "email_campaigns"("scheduledAt");

-- CreateIndex
CREATE INDEX "email_campaigns_sentAt_idx" ON "email_campaigns"("sentAt");

-- CreateIndex
CREATE INDEX "email_campaigns_emailProvider_idx" ON "email_campaigns"("emailProvider");

-- CreateIndex
CREATE UNIQUE INDEX "email_recipients_token_key" ON "email_recipients"("token");

-- CreateIndex
CREATE INDEX "email_recipients_campaignId_idx" ON "email_recipients"("campaignId");

-- CreateIndex
CREATE INDEX "email_recipients_email_idx" ON "email_recipients"("email");

-- CreateIndex
CREATE INDEX "email_recipients_token_idx" ON "email_recipients"("token");

-- CreateIndex
CREATE INDEX "email_recipients_status_idx" ON "email_recipients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "email_unsubscribes_email_key" ON "email_unsubscribes"("email");

-- CreateIndex
CREATE INDEX "email_unsubscribes_email_idx" ON "email_unsubscribes"("email");

-- CreateIndex
CREATE INDEX "email_unsubscribes_isActive_idx" ON "email_unsubscribes"("isActive");

-- CreateIndex
CREATE INDEX "email_unsubscribes_projectId_idx" ON "email_unsubscribes"("projectId");

-- CreateIndex
CREATE INDEX "email_templates_projectId_idx" ON "email_templates"("projectId");

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "email_templates_isPublic_idx" ON "email_templates"("isPublic");

-- CreateIndex
CREATE INDEX "templates_projectId_idx" ON "templates"("projectId");

-- CreateIndex
CREATE INDEX "templates_userId_idx" ON "templates"("userId");

-- CreateIndex
CREATE INDEX "templates_platform_idx" ON "templates"("platform");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_isDefault_idx" ON "templates"("isDefault");

-- CreateIndex
CREATE INDEX "templates_isPublic_idx" ON "templates"("isPublic");

-- CreateIndex
CREATE INDEX "templates_usageCount_idx" ON "templates"("usageCount");

-- CreateIndex
CREATE INDEX "prompt_library_projectId_idx" ON "prompt_library"("projectId");

-- CreateIndex
CREATE INDEX "prompt_library_userId_idx" ON "prompt_library"("userId");

-- CreateIndex
CREATE INDEX "prompt_library_category_idx" ON "prompt_library"("category");

-- CreateIndex
CREATE INDEX "prompt_library_platform_idx" ON "prompt_library"("platform");

-- CreateIndex
CREATE INDEX "prompt_library_isDefault_idx" ON "prompt_library"("isDefault");

-- CreateIndex
CREATE INDEX "prompt_library_isPublic_idx" ON "prompt_library"("isPublic");

-- CreateIndex
CREATE INDEX "prompt_library_templateId_idx" ON "prompt_library"("templateId");

-- CreateIndex
CREATE INDEX "content_template_history_templateId_idx" ON "content_template_history"("templateId");

-- CreateIndex
CREATE INDEX "content_template_history_contentId_idx" ON "content_template_history"("contentId");

-- CreateIndex
CREATE INDEX "content_template_history_platform_idx" ON "content_template_history"("platform");

-- CreateIndex
CREATE INDEX "content_template_history_createdAt_idx" ON "content_template_history"("createdAt");

-- CreateIndex
CREATE INDEX "images_userId_idx" ON "images"("userId");

-- CreateIndex
CREATE INDEX "images_projectId_idx" ON "images"("projectId");

-- CreateIndex
CREATE INDEX "images_isAIGenerated_idx" ON "images"("isAIGenerated");

-- CreateIndex
CREATE INDEX "images_createdAt_idx" ON "images"("createdAt");

-- CreateIndex
CREATE INDEX "images_tags_idx" ON "images"("tags");

-- CreateIndex
CREATE INDEX "content_images_contentId_idx" ON "content_images"("contentId");

-- CreateIndex
CREATE INDEX "content_images_imageId_idx" ON "content_images"("imageId");

-- CreateIndex
CREATE INDEX "content_images_platformType_idx" ON "content_images"("platformType");

-- CreateIndex
CREATE UNIQUE INDEX "content_images_contentId_imageId_role_key" ON "content_images"("contentId", "imageId", "role");

-- CreateIndex
CREATE INDEX "email_images_campaignId_idx" ON "email_images"("campaignId");

-- CreateIndex
CREATE INDEX "email_images_imageId_idx" ON "email_images"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "email_images_campaignId_imageId_role_key" ON "email_images"("campaignId", "imageId", "role");

-- CreateIndex
CREATE INDEX "image_generation_jobs_userId_idx" ON "image_generation_jobs"("userId");

-- CreateIndex
CREATE INDEX "image_generation_jobs_projectId_idx" ON "image_generation_jobs"("projectId");

-- CreateIndex
CREATE INDEX "image_generation_jobs_status_idx" ON "image_generation_jobs"("status");

-- CreateIndex
CREATE INDEX "image_generation_jobs_createdAt_idx" ON "image_generation_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "scheduled_content_contentId_idx" ON "scheduled_content"("contentId");

-- CreateIndex
CREATE INDEX "scheduled_content_projectId_idx" ON "scheduled_content"("projectId");

-- CreateIndex
CREATE INDEX "scheduled_content_scheduledFor_idx" ON "scheduled_content"("scheduledFor");

-- CreateIndex
CREATE INDEX "scheduled_content_queueStatus_idx" ON "scheduled_content"("queueStatus");

-- CreateIndex
CREATE INDEX "scheduled_content_status_idx" ON "scheduled_content"("status");

-- CreateIndex
CREATE INDEX "scheduled_content_priority_idx" ON "scheduled_content"("priority");

-- CreateIndex
CREATE INDEX "scheduled_content_timezone_idx" ON "scheduled_content"("timezone");

-- CreateIndex
CREATE INDEX "scheduled_content_isRecurring_idx" ON "scheduled_content"("isRecurring");

-- CreateIndex
CREATE INDEX "queue_metrics_projectId_idx" ON "queue_metrics"("projectId");

-- CreateIndex
CREATE INDEX "queue_metrics_periodStart_idx" ON "queue_metrics"("periodStart");

-- CreateIndex
CREATE INDEX "queue_metrics_periodEnd_idx" ON "queue_metrics"("periodEnd");

-- CreateIndex
CREATE INDEX "schedule_conflicts_projectId_idx" ON "schedule_conflicts"("projectId");

-- CreateIndex
CREATE INDEX "schedule_conflicts_schedule1Id_idx" ON "schedule_conflicts"("schedule1Id");

-- CreateIndex
CREATE INDEX "schedule_conflicts_schedule2Id_idx" ON "schedule_conflicts"("schedule2Id");

-- CreateIndex
CREATE INDEX "schedule_conflicts_conflictTime_idx" ON "schedule_conflicts"("conflictTime");

-- CreateIndex
CREATE INDEX "schedule_conflicts_resolved_idx" ON "schedule_conflicts"("resolved");

-- CreateIndex
CREATE INDEX "report_configs_projectId_idx" ON "report_configs"("projectId");

-- CreateIndex
CREATE INDEX "report_configs_userId_idx" ON "report_configs"("userId");

-- CreateIndex
CREATE INDEX "report_configs_reportType_idx" ON "report_configs"("reportType");

-- CreateIndex
CREATE INDEX "report_configs_isScheduled_idx" ON "report_configs"("isScheduled");

-- CreateIndex
CREATE INDEX "report_configs_nextScheduledAt_idx" ON "report_configs"("nextScheduledAt");

-- CreateIndex
CREATE INDEX "report_history_configId_idx" ON "report_history"("configId");

-- CreateIndex
CREATE INDEX "report_history_projectId_idx" ON "report_history"("projectId");

-- CreateIndex
CREATE INDEX "report_history_userId_idx" ON "report_history"("userId");

-- CreateIndex
CREATE INDEX "report_history_reportType_idx" ON "report_history"("reportType");

-- CreateIndex
CREATE INDEX "report_history_status_idx" ON "report_history"("status");

-- CreateIndex
CREATE INDEX "report_history_generatedAt_idx" ON "report_history"("generatedAt");

-- CreateIndex
CREATE INDEX "report_history_expiresAt_idx" ON "report_history"("expiresAt");

-- CreateIndex
CREATE INDEX "email_report_subscriptions_projectId_idx" ON "email_report_subscriptions"("projectId");

-- CreateIndex
CREATE INDEX "email_report_subscriptions_userId_idx" ON "email_report_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "email_report_subscriptions_reportType_idx" ON "email_report_subscriptions"("reportType");

-- CreateIndex
CREATE INDEX "email_report_subscriptions_isActive_idx" ON "email_report_subscriptions"("isActive");

-- CreateIndex
CREATE INDEX "email_report_subscriptions_nextScheduledAt_idx" ON "email_report_subscriptions"("nextScheduledAt");

-- CreateIndex
CREATE INDEX "export_jobs_projectId_idx" ON "export_jobs"("projectId");

-- CreateIndex
CREATE INDEX "export_jobs_userId_idx" ON "export_jobs"("userId");

-- CreateIndex
CREATE INDEX "export_jobs_exportType_idx" ON "export_jobs"("exportType");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "export_jobs_createdAt_idx" ON "export_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "export_jobs_expiresAt_idx" ON "export_jobs"("expiresAt");

-- CreateIndex
CREATE INDEX "repository_insights_projectId_idx" ON "repository_insights"("projectId");

-- CreateIndex
CREATE INDEX "repository_insights_periodStart_periodEnd_idx" ON "repository_insights"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "repository_insights_periodType_idx" ON "repository_insights"("periodType");

-- CreateIndex
CREATE INDEX "repository_insights_healthScore_idx" ON "repository_insights"("healthScore");

-- CreateIndex
CREATE INDEX "repository_insights_cacheExpiresAt_idx" ON "repository_insights"("cacheExpiresAt");

-- CreateIndex
CREATE INDEX "contributor_stats_projectId_idx" ON "contributor_stats"("projectId");

-- CreateIndex
CREATE INDEX "contributor_stats_githubLogin_idx" ON "contributor_stats"("githubLogin");

-- CreateIndex
CREATE INDEX "contributor_stats_periodStart_periodEnd_idx" ON "contributor_stats"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "contributor_stats_impactScore_idx" ON "contributor_stats"("impactScore");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_stats_projectId_githubLogin_periodStart_periodE_key" ON "contributor_stats"("projectId", "githubLogin", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "newsworthy_events_projectId_idx" ON "newsworthy_events"("projectId");

-- CreateIndex
CREATE INDEX "newsworthy_events_eventType_idx" ON "newsworthy_events"("eventType");

-- CreateIndex
CREATE INDEX "newsworthy_events_eventDate_idx" ON "newsworthy_events"("eventDate");

-- CreateIndex
CREATE INDEX "newsworthy_events_newsworthinessScore_idx" ON "newsworthy_events"("newsworthinessScore");

-- CreateIndex
CREATE INDEX "newsworthy_events_impact_idx" ON "newsworthy_events"("impact");

-- CreateIndex
CREATE INDEX "newsworthy_events_wasPublished_idx" ON "newsworthy_events"("wasPublished");

-- CreateIndex
CREATE INDEX "content_metrics_projectId_idx" ON "content_metrics"("projectId");

-- CreateIndex
CREATE INDEX "content_metrics_periodStart_idx" ON "content_metrics"("periodStart");

-- CreateIndex
CREATE INDEX "content_metrics_periodEnd_idx" ON "content_metrics"("periodEnd");

-- CreateIndex
CREATE INDEX "content_metrics_periodType_idx" ON "content_metrics"("periodType");

-- CreateIndex
CREATE UNIQUE INDEX "content_metrics_projectId_periodStart_periodEnd_periodType_key" ON "content_metrics"("projectId", "periodStart", "periodEnd", "periodType");

-- CreateIndex
CREATE INDEX "platform_metrics_projectId_idx" ON "platform_metrics"("projectId");

-- CreateIndex
CREATE INDEX "platform_metrics_platformId_idx" ON "platform_metrics"("platformId");

-- CreateIndex
CREATE INDEX "platform_metrics_contentId_idx" ON "platform_metrics"("contentId");

-- CreateIndex
CREATE INDEX "platform_metrics_platformType_idx" ON "platform_metrics"("platformType");

-- CreateIndex
CREATE INDEX "platform_metrics_periodStart_idx" ON "platform_metrics"("periodStart");

-- CreateIndex
CREATE INDEX "platform_metrics_periodEnd_idx" ON "platform_metrics"("periodEnd");

-- CreateIndex
CREATE INDEX "cost_tracking_projectId_idx" ON "cost_tracking"("projectId");

-- CreateIndex
CREATE INDEX "cost_tracking_userId_idx" ON "cost_tracking"("userId");

-- CreateIndex
CREATE INDEX "cost_tracking_service_idx" ON "cost_tracking"("service");

-- CreateIndex
CREATE INDEX "cost_tracking_billingPeriod_idx" ON "cost_tracking"("billingPeriod");

-- CreateIndex
CREATE INDEX "cost_tracking_createdAt_idx" ON "cost_tracking"("createdAt");

-- CreateIndex
CREATE INDEX "cost_summary_projectId_idx" ON "cost_summary"("projectId");

-- CreateIndex
CREATE INDEX "cost_summary_periodStart_idx" ON "cost_summary"("periodStart");

-- CreateIndex
CREATE INDEX "cost_summary_periodEnd_idx" ON "cost_summary"("periodEnd");

-- CreateIndex
CREATE INDEX "cost_summary_periodType_idx" ON "cost_summary"("periodType");

-- CreateIndex
CREATE UNIQUE INDEX "cost_summary_projectId_periodStart_periodEnd_periodType_key" ON "cost_summary"("projectId", "periodStart", "periodEnd", "periodType");

-- CreateIndex
CREATE INDEX "content_performance_contentId_idx" ON "content_performance"("contentId");

-- CreateIndex
CREATE INDEX "content_performance_projectId_idx" ON "content_performance"("projectId");

-- CreateIndex
CREATE INDEX "content_performance_platform_idx" ON "content_performance"("platform");

-- CreateIndex
CREATE INDEX "content_performance_performanceScore_idx" ON "content_performance"("performanceScore");

-- CreateIndex
CREATE INDEX "content_performance_createdAt_idx" ON "content_performance"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_performance_contentId_platform_key" ON "content_performance"("contentId", "platform");

-- CreateIndex
CREATE INDEX "analytics_events_projectId_idx" ON "analytics_events"("projectId");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_contentId_idx" ON "analytics_events"("contentId");

-- CreateIndex
CREATE INDEX "analytics_events_platformId_idx" ON "analytics_events"("platformId");

-- CreateIndex
CREATE INDEX "user_analytics_userId_idx" ON "user_analytics"("userId");

-- CreateIndex
CREATE INDEX "user_analytics_projectId_idx" ON "user_analytics"("projectId");

-- CreateIndex
CREATE INDEX "user_analytics_sessionId_idx" ON "user_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "user_analytics_createdAt_idx" ON "user_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "user_analytics_action_idx" ON "user_analytics"("action");

-- CreateIndex
CREATE INDEX "content_approvals_contentId_idx" ON "content_approvals"("contentId");

-- CreateIndex
CREATE INDEX "content_approvals_projectId_idx" ON "content_approvals"("projectId");

-- CreateIndex
CREATE INDEX "content_approvals_status_idx" ON "content_approvals"("status");

-- CreateIndex
CREATE INDEX "content_approvals_priority_idx" ON "content_approvals"("priority");

-- CreateIndex
CREATE INDEX "content_approvals_requestedBy_idx" ON "content_approvals"("requestedBy");

-- CreateIndex
CREATE INDEX "content_approvals_assignedTo_idx" ON "content_approvals"("assignedTo");

-- CreateIndex
CREATE INDEX "content_approvals_requestedAt_idx" ON "content_approvals"("requestedAt");

-- CreateIndex
CREATE INDEX "content_approvals_escalatedAt_idx" ON "content_approvals"("escalatedAt");

-- CreateIndex
CREATE INDEX "approval_comments_approvalId_idx" ON "approval_comments"("approvalId");

-- CreateIndex
CREATE INDEX "approval_comments_userId_idx" ON "approval_comments"("userId");

-- CreateIndex
CREATE INDEX "approval_comments_createdAt_idx" ON "approval_comments"("createdAt");

-- CreateIndex
CREATE INDEX "content_safety_checks_contentId_idx" ON "content_safety_checks"("contentId");

-- CreateIndex
CREATE INDEX "content_safety_checks_projectId_idx" ON "content_safety_checks"("projectId");

-- CreateIndex
CREATE INDEX "content_safety_checks_checkType_idx" ON "content_safety_checks"("checkType");

-- CreateIndex
CREATE INDEX "content_safety_checks_passed_idx" ON "content_safety_checks"("passed");

-- CreateIndex
CREATE INDEX "content_safety_checks_severity_idx" ON "content_safety_checks"("severity");

-- CreateIndex
CREATE INDEX "content_safety_checks_reviewStatus_idx" ON "content_safety_checks"("reviewStatus");

-- CreateIndex
CREATE INDEX "content_safety_checks_createdAt_idx" ON "content_safety_checks"("createdAt");

-- CreateIndex
CREATE INDEX "blacklist_terms_projectId_idx" ON "blacklist_terms"("projectId");

-- CreateIndex
CREATE INDEX "blacklist_terms_category_idx" ON "blacklist_terms"("category");

-- CreateIndex
CREATE INDEX "blacklist_terms_severity_idx" ON "blacklist_terms"("severity");

-- CreateIndex
CREATE INDEX "blacklist_terms_isActive_idx" ON "blacklist_terms"("isActive");

-- CreateIndex
CREATE INDEX "blacklist_terms_term_idx" ON "blacklist_terms"("term");

-- CreateIndex
CREATE INDEX "whitelist_terms_projectId_idx" ON "whitelist_terms"("projectId");

-- CreateIndex
CREATE INDEX "whitelist_terms_isActive_idx" ON "whitelist_terms"("isActive");

-- CreateIndex
CREATE INDEX "whitelist_terms_term_idx" ON "whitelist_terms"("term");

-- CreateIndex
CREATE INDEX "content_versions_contentId_idx" ON "content_versions"("contentId");

-- CreateIndex
CREATE INDEX "content_versions_projectId_idx" ON "content_versions"("projectId");

-- CreateIndex
CREATE INDEX "content_versions_version_idx" ON "content_versions"("version");

-- CreateIndex
CREATE INDEX "content_versions_createdBy_idx" ON "content_versions"("createdBy");

-- CreateIndex
CREATE INDEX "content_versions_createdAt_idx" ON "content_versions"("createdAt");

-- CreateIndex
CREATE INDEX "content_versions_branchName_idx" ON "content_versions"("branchName");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_contentId_version_key" ON "content_versions"("contentId", "version");

-- CreateIndex
CREATE INDEX "team_members_projectId_idx" ON "team_members"("projectId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE INDEX "team_members_role_idx" ON "team_members"("role");

-- CreateIndex
CREATE INDEX "team_members_isActive_idx" ON "team_members"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_projectId_userId_key" ON "team_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "auto_approval_rules_projectId_idx" ON "auto_approval_rules"("projectId");

-- CreateIndex
CREATE INDEX "auto_approval_rules_isActive_idx" ON "auto_approval_rules"("isActive");

-- CreateIndex
CREATE INDEX "auto_approval_rules_priority_idx" ON "auto_approval_rules"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_progress_userId_key" ON "onboarding_progress"("userId");

-- CreateIndex
CREATE INDEX "onboarding_progress_userId_idx" ON "onboarding_progress"("userId");

-- CreateIndex
CREATE INDEX "onboarding_progress_isCompleted_idx" ON "onboarding_progress"("isCompleted");

-- CreateIndex
CREATE INDEX "onboarding_progress_currentStep_idx" ON "onboarding_progress"("currentStep");

-- CreateIndex
CREATE INDEX "onboarding_progress_lastActiveAt_idx" ON "onboarding_progress"("lastActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "error_logs_sentryEventId_key" ON "error_logs"("sentryEventId");

-- CreateIndex
CREATE INDEX "error_logs_errorHash_idx" ON "error_logs"("errorHash");

-- CreateIndex
CREATE INDEX "error_logs_level_idx" ON "error_logs"("level");

-- CreateIndex
CREATE INDEX "error_logs_status_idx" ON "error_logs"("status");

-- CreateIndex
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");

-- CreateIndex
CREATE INDEX "error_logs_projectId_idx" ON "error_logs"("projectId");

-- CreateIndex
CREATE INDEX "error_logs_environment_idx" ON "error_logs"("environment");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_lastSeenAt_idx" ON "error_logs"("lastSeenAt");

-- CreateIndex
CREATE INDEX "error_logs_assignedTo_idx" ON "error_logs"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "error_patterns_errorHash_key" ON "error_patterns"("errorHash");

-- CreateIndex
CREATE INDEX "error_patterns_errorHash_idx" ON "error_patterns"("errorHash");

-- CreateIndex
CREATE INDEX "error_patterns_isActive_idx" ON "error_patterns"("isActive");

-- CreateIndex
CREATE INDEX "error_patterns_lastSeen_idx" ON "error_patterns"("lastSeen");

-- CreateIndex
CREATE INDEX "test_runs_projectId_idx" ON "test_runs"("projectId");

-- CreateIndex
CREATE INDEX "test_runs_userId_idx" ON "test_runs"("userId");

-- CreateIndex
CREATE INDEX "test_runs_testType_idx" ON "test_runs"("testType");

-- CreateIndex
CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

-- CreateIndex
CREATE INDEX "test_runs_contentId_idx" ON "test_runs"("contentId");

-- CreateIndex
CREATE INDEX "test_runs_createdAt_idx" ON "test_runs"("createdAt");

-- CreateIndex
CREATE INDEX "test_runs_completedAt_idx" ON "test_runs"("completedAt");

-- CreateIndex
CREATE INDEX "validation_results_testRunId_idx" ON "validation_results"("testRunId");

-- CreateIndex
CREATE INDEX "validation_results_projectId_idx" ON "validation_results"("projectId");

-- CreateIndex
CREATE INDEX "validation_results_validationType_idx" ON "validation_results"("validationType");

-- CreateIndex
CREATE INDEX "validation_results_platformId_idx" ON "validation_results"("platformId");

-- CreateIndex
CREATE INDEX "validation_results_contentId_idx" ON "validation_results"("contentId");

-- CreateIndex
CREATE INDEX "validation_results_passed_idx" ON "validation_results"("passed");

-- CreateIndex
CREATE INDEX "validation_results_severity_idx" ON "validation_results"("severity");

-- CreateIndex
CREATE INDEX "validation_results_createdAt_idx" ON "validation_results"("createdAt");

-- CreateIndex
CREATE INDEX "repository_diffs_testRunId_idx" ON "repository_diffs"("testRunId");

-- CreateIndex
CREATE INDEX "repository_diffs_projectId_idx" ON "repository_diffs"("projectId");

-- CreateIndex
CREATE INDEX "repository_diffs_fromDate_toDate_idx" ON "repository_diffs"("fromDate", "toDate");

-- CreateIndex
CREATE INDEX "repository_diffs_createdAt_idx" ON "repository_diffs"("createdAt");

-- CreateIndex
CREATE INDEX "repository_diffs_expiresAt_idx" ON "repository_diffs"("expiresAt");

-- CreateIndex
CREATE INDEX "test_reports_testRunId_idx" ON "test_reports"("testRunId");

-- CreateIndex
CREATE INDEX "test_reports_projectId_idx" ON "test_reports"("projectId");

-- CreateIndex
CREATE INDEX "test_reports_userId_idx" ON "test_reports"("userId");

-- CreateIndex
CREATE INDEX "test_reports_reportType_idx" ON "test_reports"("reportType");

-- CreateIndex
CREATE INDEX "test_reports_status_idx" ON "test_reports"("status");

-- CreateIndex
CREATE INDEX "test_reports_createdAt_idx" ON "test_reports"("createdAt");

-- CreateIndex
CREATE INDEX "test_reports_expiresAt_idx" ON "test_reports"("expiresAt");

-- CreateIndex
CREATE INDEX "mock_publications_testRunId_idx" ON "mock_publications"("testRunId");

-- CreateIndex
CREATE INDEX "mock_publications_contentId_idx" ON "mock_publications"("contentId");

-- CreateIndex
CREATE INDEX "mock_publications_platformId_idx" ON "mock_publications"("platformId");

-- CreateIndex
CREATE INDEX "mock_publications_projectId_idx" ON "mock_publications"("projectId");

-- CreateIndex
CREATE INDEX "mock_publications_platformType_idx" ON "mock_publications"("platformType");

-- CreateIndex
CREATE INDEX "mock_publications_wouldSucceed_idx" ON "mock_publications"("wouldSucceed");

-- CreateIndex
CREATE INDEX "mock_publications_createdAt_idx" ON "mock_publications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_metrics_jobId_key" ON "job_metrics"("jobId");

-- CreateIndex
CREATE INDEX "job_metrics_jobId_idx" ON "job_metrics"("jobId");

-- CreateIndex
CREATE INDEX "job_metrics_lastExecutionAt_idx" ON "job_metrics"("lastExecutionAt");

-- CreateIndex
CREATE UNIQUE INDEX "performance_baselines_jobId_key" ON "performance_baselines"("jobId");

-- CreateIndex
CREATE INDEX "performance_baselines_jobId_idx" ON "performance_baselines"("jobId");

-- CreateIndex
CREATE INDEX "dead_letter_queue_jobId_idx" ON "dead_letter_queue"("jobId");

-- CreateIndex
CREATE INDEX "dead_letter_queue_status_idx" ON "dead_letter_queue"("status");

-- CreateIndex
CREATE INDEX "dead_letter_queue_createdAt_idx" ON "dead_letter_queue"("createdAt");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_resolved_idx" ON "alerts"("resolved");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platforms" ADD CONSTRAINT "platforms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cron_executions" ADD CONSTRAINT "cron_executions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "cron_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_library" ADD CONSTRAINT "prompt_library_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_library" ADD CONSTRAINT "prompt_library_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "prompt_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_template_history" ADD CONSTRAINT "content_template_history_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_images" ADD CONSTRAINT "email_images_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_images" ADD CONSTRAINT "email_images_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_content" ADD CONSTRAINT "scheduled_content_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_configId_fkey" FOREIGN KEY ("configId") REFERENCES "report_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_comments" ADD CONSTRAINT "approval_comments_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "content_approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_safety_checks" ADD CONSTRAINT "content_safety_checks_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_diffs" ADD CONSTRAINT "repository_diffs_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_reports" ADD CONSTRAINT "test_reports_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_publications" ADD CONSTRAINT "mock_publications_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

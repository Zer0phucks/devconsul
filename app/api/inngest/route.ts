/**
 * Inngest Webhook Handler
 *
 * Serves Inngest functions and handles event delivery
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { contentGenerationJob } from "@/lib/inngest/functions/content-generation";
import {
  scheduledPublishCron,
  projectPublishJob,
  itemPublishJob,
  manualPublishJob,
  cancelPublishJob,
  rescheduleJob,
} from "@/lib/inngest/functions/scheduled-publish";
import {
  generateReportJob,
  exportDataJob,
  sendEmailReportJob,
  scheduleEmailReportsCron,
} from "@/lib/inngest/functions/report-generation";
import {
  deadLetterQueueCron,
  healthCheckCron,
  performanceMetricsCron,
  metricsCleanupCron,
} from "@/lib/inngest/functions/monitoring-cron";

/**
 * Register all Inngest functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Content generation
    contentGenerationJob,

    // Scheduled publishing
    scheduledPublishCron,
    projectPublishJob,
    itemPublishJob,
    manualPublishJob,
    cancelPublishJob,
    rescheduleJob,

    // Report generation
    generateReportJob,
    exportDataJob,
    sendEmailReportJob,
    scheduleEmailReportsCron,

    // Monitoring and performance
    deadLetterQueueCron,
    healthCheckCron,
    performanceMetricsCron,
    metricsCleanupCron,
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

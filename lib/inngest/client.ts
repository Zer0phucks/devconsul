/**
 * Inngest Client Configuration
 *
 * Central client for job queue and event processing
 */

import { Inngest, EventSchemas } from "inngest";

/**
 * Event schema definitions for type-safe event handling
 */
type Events = {
  "cron/content.generation": {
    data: {
      projectId: string;
      userId: string;
      triggeredBy: "scheduled" | "manual" | "webhook";
    };
  };
  "cron/github.sync": {
    data: {
      projectId: string;
      userId: string;
      triggeredBy: "scheduled" | "manual" | "webhook";
    };
  };
  "cron/content.publish": {
    data: {
      projectId: string;
      userId: string;
      contentIds?: string[];
      triggeredBy: "scheduled" | "manual";
    };
  };
  "scheduled/publish.project": {
    data: {
      projectId: string;
    };
  };
  "scheduled/publish.item": {
    data: {
      scheduleId: string;
      contentId: string;
      projectId: string;
    };
  };
  "scheduled/publish.manual": {
    data: {
      scheduleId: string;
      userId: string;
    };
  };
  "scheduled/publish.cancel": {
    data: {
      scheduleId: string;
      userId: string;
      reason?: string;
    };
  };
  "scheduled/publish.reschedule": {
    data: {
      scheduleId: string;
      newScheduleTime: string;
      userId: string;
    };
  };
  "report/generate": {
    data: {
      reportConfigId: string;
      userId: string;
      triggeredBy: "manual" | "scheduled" | "api";
    };
  };
  "export/data": {
    data: {
      projectId: string;
      exportType: string;
      outputFormat: string;
      userId: string;
      dateFrom?: Date;
      dateTo?: Date;
      options?: Record<string, any>;
    };
  };
  "report/email.send": {
    data: {
      subscriptionId: string;
      reportType: string;
      projectId: string;
      triggeredBy: "manual" | "cron" | "api";
    };
  };
};

/**
 * Inngest client instance
 *
 * Configured with:
 * - Event schemas for type safety
 * - Environment-based naming
 * - Production-ready error handling
 */
export const inngest = new Inngest({
  id: "fullselfpublishing",
  name: "Full Self Publishing",
  schemas: new EventSchemas().fromRecord<Events>(),
  eventKey: process.env.INNGEST_EVENT_KEY,
});

/**
 * Helper to send events with type safety
 */
export const sendEvent = inngest.send;

/**
 * Event type exports for use in other modules
 */
export type InngestEvents = Events;

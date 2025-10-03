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

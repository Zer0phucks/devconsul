/**
 * Inngest Webhook Handler
 *
 * Serves Inngest functions and handles event delivery
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { contentGenerationJob } from "@/lib/inngest/functions/content-generation";

/**
 * Register all Inngest functions
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    contentGenerationJob,
    // Add more job functions here as they're created
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

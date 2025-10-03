/**
 * Optimized Inngest Function Wrappers
 *
 * Wraps Inngest functions with:
 * - Performance tracking
 * - Job deduplication
 * - Circuit breaker integration
 * - Metrics collection
 * - Error handling
 */

import { inngest } from "./client";
import {
  getJobConfig,
  calculateRetryDelay,
  isDuplicateJob,
  markJobStarted,
  markJobCompleted,
  getCircuitBreaker,
  moveToDeadLetterQueue,
} from "@/lib/monitoring/job-optimizer";
import { recordJobExecution } from "@/lib/monitoring/metrics-collector";
import { trackJobPerformance } from "@/lib/monitoring/performance-tracker";

/**
 * Create optimized Inngest function with monitoring
 */
export function createOptimizedFunction<T extends any>(
  config: {
    id: string;
    name: string;
    eventName: string;
    handler: (params: T) => Promise<any>;
  }
) {
  const jobConfig = getJobConfig(config.id);

  return inngest.createFunction(
    {
      id: config.id,
      name: config.name,
      retries: jobConfig.maxRetries,
      concurrency: {
        limit: jobConfig.concurrency,
      },
    },
    { event: config.eventName },
    async ({ event, step, attempt }) => {
      const startTime = Date.now();
      const deduplicationKey = jobConfig.deduplicate
        ? jobConfig.deduplicationKey?.(event) || `${config.id}-${Date.now()}`
        : null;

      try {
        // Check for duplicate job
        if (deduplicationKey && isDuplicateJob(deduplicationKey)) {
          console.log(`Skipping duplicate job: ${deduplicationKey}`);
          return { skipped: true, reason: "duplicate" };
        }

        // Mark job as started
        if (deduplicationKey) {
          markJobStarted(deduplicationKey);
        }

        // Check circuit breaker for external service calls
        const circuitBreaker = getCircuitBreaker(config.id);
        if (circuitBreaker.isOpen()) {
          throw new Error(
            `Circuit breaker open for ${config.id}, skipping execution`
          );
        }

        // Execute the handler
        const result = await config.handler({ event, step, attempt } as T);

        // Record success
        const duration = Date.now() - startTime;
        await recordJobExecution(config.id, true, duration, {
          attempt,
          result: "success",
        });
        await trackJobPerformance(config.id, duration, true);

        circuitBreaker.recordSuccess();

        // Mark job as completed
        if (deduplicationKey) {
          markJobCompleted(deduplicationKey);
        }

        return result;
      } catch (error: any) {
        // Record failure
        const duration = Date.now() - startTime;
        await recordJobExecution(config.id, false, duration, {
          attempt,
          error: error.message,
        });
        await trackJobPerformance(config.id, duration, false);

        const circuitBreaker = getCircuitBreaker(config.id);
        circuitBreaker.recordFailure();

        // Mark job as completed (with error)
        if (deduplicationKey) {
          markJobCompleted(deduplicationKey);
        }

        // Move to dead letter queue if max retries reached
        if (attempt >= jobConfig.maxRetries) {
          await moveToDeadLetterQueue(
            config.id,
            event.data,
            error.message,
            { attempt, stackTrace: error.stack }
          );
        }

        throw error;
      }
    }
  );
}

/**
 * Create optimized cron function with monitoring
 */
export function createOptimizedCronFunction(config: {
  id: string;
  name: string;
  schedule: string;
  handler: (params: any) => Promise<any>;
}) {
  const jobConfig = getJobConfig(config.id);

  return inngest.createFunction(
    {
      id: config.id,
      name: config.name,
      retries: 0, // Cron jobs don't retry - they run on schedule
    },
    { cron: config.schedule },
    async ({ step }) => {
      const startTime = Date.now();

      try {
        // Execute the handler
        const result = await config.handler({ step });

        // Record success
        const duration = Date.now() - startTime;
        await recordJobExecution(config.id, true, duration, {
          type: "cron",
          result: "success",
        });
        await trackJobPerformance(config.id, duration, true);

        return result;
      } catch (error: any) {
        // Record failure
        const duration = Date.now() - startTime;
        await recordJobExecution(config.id, false, duration, {
          type: "cron",
          error: error.message,
        });
        await trackJobPerformance(config.id, duration, false);

        // Cron jobs log errors but don't throw (they'll retry on next schedule)
        console.error(`Cron job ${config.id} failed:`, error);

        return { success: false, error: error.message };
      }
    }
  );
}

/**
 * Batch job processor with optimization
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
  options?: {
    parallel?: boolean;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    if (options?.parallel) {
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((item) => processor(item))
      );
      results.push(...batchResults);
    } else {
      // Process batch sequentially
      for (const item of batch) {
        const result = await processor(item);
        results.push(result);
      }
    }

    if (options?.onProgress) {
      const completed = Math.min(i + batchSize, total);
      options.onProgress(completed, total);
    }
  }

  return results;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const baseDelayMs = options?.baseDelayMs || 1000;
  const maxDelayMs = options?.maxDelayMs || 30000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= maxRetries) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt, baseDelayMs, maxDelayMs);

      if (options?.onRetry) {
        options.onRetry(attempt, error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}

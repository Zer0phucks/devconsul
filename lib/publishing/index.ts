/**
 * Publishing Module Index
 *
 * Centralized exports for all publishing functionality
 */

// Manual Publishing
export {
  publishToSinglePlatform,
  publishToMultiplePlatforms,
  publishAllEnabled,
} from './manual';

// Batch Publishing
export {
  batchPublish,
  publishAllPlatforms,
  calculateBatchProgress,
} from './batch';

// Auto-Publish
export {
  autoPublishContent,
  autoPublishBatch,
  shouldAutoPublish,
} from './auto';

// Approval Queue
export {
  addToApprovalQueue,
  getApprovalQueue,
  approveAndPublish,
  rejectContent,
  removeFromApprovalQueue,
  cleanupExpiredApprovals,
  getApprovalQueueStats,
} from './approval';

// Status Tracking
export {
  getPublicationStatus,
  updatePublicationStatus,
  getPublicationHistory,
  getFailedPublications,
  getPendingPublications,
  createPublication,
  createPublications,
  isPublishedToPlatform,
  getPublishedPlatforms,
  getPendingPlatforms,
  getPublicationByContentAndPlatform,
} from './status';

// Retry Logic
export {
  retryFailedPublication,
  retryAllFailed,
  scheduleRetry,
  processScheduledRetries,
  calculateBackoffDelay,
  autoRetryFailed,
  getRetryStatus,
} from './retry';

// Dry Run
export {
  dryRunPublish,
  validateAllPlatforms,
  generateValidationReport,
} from './dry-run';

// Analytics
export {
  getPublishingStats,
  getPlatformHealthScore,
  getPublishingTrends,
  getMostPublishedContentTypes,
  getAverageTimeToPublish,
  getPeakPublishingTimes,
} from './analytics';

// Error Handling
export {
  mapErrorToUserMessage,
  formatErrorForDisplay,
  getRetryRecommendation,
  categorizeErrorSeverity,
  generateErrorNotification,
} from './errors';

// Validations
export {
  validateContentForPlatform,
  categorizeError,
} from '@/lib/validations/publishing';

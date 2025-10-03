/**
 * Content Generation Job Function
 *
 * Automated content generation based on GitHub activity
 */

import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/db";
import { NonRetriableError } from "inngest";
import { Octokit } from "@octokit/rest";
import { ExecutionStatus } from "@prisma/client";

/**
 * GitHub activity context for AI generation
 */
interface GitHubActivity {
  commits: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
    filesChanged: string[];
  }>;
  pullRequests: Array<{
    number: number;
    title: string;
    state: string;
    mergedAt?: string;
  }>;
  issues: Array<{
    number: number;
    title: string;
    state: string;
    closedAt?: string;
  }>;
  hasActivity: boolean;
  summary: string;
}

/**
 * Content Generation Job
 *
 * Workflow:
 * 1. Fetch project settings
 * 2. Check last scan timestamp
 * 3. Scan GitHub activity since last run
 * 4. Generate content if activity found
 * 5. Store results and update timestamps
 */
export const contentGenerationJob = inngest.createFunction(
  {
    id: "content-generation",
    name: "Content Generation from GitHub Activity",
    retries: 3,
    concurrency: {
      limit: 5, // Max 5 projects concurrently
    },
  },
  { event: "cron/content.generation" },
  async ({ event, step }) => {
    const { projectId, userId, triggeredBy } = event.data;

    // Create execution record
    const execution = await step.run("create-execution-record", async () => {
      // Find cron job for this project
      const cronJob = await prisma.cronJob.findFirst({
        where: {
          projectId,
          type: "GENERATE_CONTENT",
          isEnabled: true,
        },
      });

      if (!cronJob) {
        throw new NonRetriableError("No enabled content generation job found");
      }

      return await prisma.cronExecution.create({
        data: {
          jobId: cronJob.id,
          triggeredBy,
          status: ExecutionStatus.RUNNING,
          metadata: {
            projectId,
            userId,
          },
        },
      });
    });

    try {
      // Fetch project with settings
      const project = await step.run("fetch-project", async () => {
        const proj = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            platforms: {
              where: { isConnected: true },
            },
            settings: true,
          },
        });

        if (!proj) {
          throw new NonRetriableError(`Project not found: ${projectId}`);
        }

        if (!proj.githubRepoOwner || !proj.githubRepoName) {
          throw new NonRetriableError("GitHub repository not configured");
        }

        return proj;
      });

      // Get GitHub activity
      const activity = await step.run("scan-github-activity", async () => {
        return await scanGitHubActivity(
          project.githubRepoOwner!,
          project.githubRepoName!,
          project.lastSyncedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Default 7 days
        );
      });

      // Skip if no activity
      if (!activity.hasActivity) {
        await step.run("mark-no-activity", async () => {
          await prisma.cronExecution.update({
            where: { id: execution.id },
            data: {
              status: ExecutionStatus.COMPLETED,
              completedAt: new Date(),
              duration: Date.now() - execution.startedAt.getTime(),
              metadata: {
                message: "No GitHub activity detected",
                activity,
              },
              itemsProcessed: 0,
            },
          });
        });

        return { success: true, activity: "none" };
      }

      // Generate content for enabled platforms
      const results = await step.run("generate-content", async () => {
        const generatedContent = [];

        for (const platform of project.platforms) {
          try {
            // TODO: Call AI generation service (Phase 2.1)
            // This would be implemented by the AI agent
            const content = await generateContentForPlatform(
              platform.type,
              activity,
              project
            );

            generatedContent.push({
              platformId: platform.id,
              platformType: platform.type,
              success: true,
              content,
            });
          } catch (error: any) {
            generatedContent.push({
              platformId: platform.id,
              platformType: platform.type,
              success: false,
              error: error.message,
            });
          }
        }

        return generatedContent;
      });

      // Update project sync timestamp
      await step.run("update-sync-timestamp", async () => {
        await prisma.project.update({
          where: { id: projectId },
          data: { lastSyncedAt: new Date() },
        });
      });

      // Mark execution complete
      await step.run("mark-execution-complete", async () => {
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        await prisma.cronExecution.update({
          where: { id: execution.id },
          data: {
            status: ExecutionStatus.COMPLETED,
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
            itemsProcessed: results.length,
            itemsSuccess: successCount,
            itemsFailed: failureCount,
            output: {
              activity,
              results,
            },
          },
        });

        // Update cron job statistics
        const cronJob = await prisma.cronJob.findFirst({
          where: { projectId, type: "GENERATE_CONTENT" },
        });

        if (cronJob) {
          await updateJobStats(cronJob.id, successCount > 0);
        }
      });

      return {
        success: true,
        activity: "detected",
        generated: results.length,
        successful: results.filter((r) => r.success).length,
      };
    } catch (error: any) {
      // Mark execution as failed
      await step.run("mark-execution-failed", async () => {
        await prisma.cronExecution.update({
          where: { id: execution.id },
          data: {
            status: ExecutionStatus.FAILED,
            completedAt: new Date(),
            duration: Date.now() - execution.startedAt.getTime(),
            error: error.message,
            stackTrace: error.stack,
          },
        });

        // Update cron job statistics
        const cronJob = await prisma.cronJob.findFirst({
          where: { projectId, type: "GENERATE_CONTENT" },
        });

        if (cronJob) {
          await updateJobStats(cronJob.id, false);
        }
      });

      throw error;
    }
  }
);

/**
 * Scan GitHub for activity since last run
 */
async function scanGitHubActivity(
  owner: string,
  repo: string,
  since: Date
): Promise<GitHubActivity> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    // Fetch commits since last scan
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      since: since.toISOString(),
      per_page: 50,
    });

    // Fetch merged pull requests
    const { data: pullRequests } = await octokit.pulls.list({
      owner,
      repo,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: 20,
    });

    const recentPRs = pullRequests.filter(
      (pr) => pr.merged_at && new Date(pr.merged_at) > since
    );

    // Fetch closed issues
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: "closed",
      since: since.toISOString(),
      per_page: 20,
    });

    const hasActivity = commits.length > 0 || recentPRs.length > 0 || issues.length > 0;

    const activity: GitHubActivity = {
      commits: commits.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || "Unknown",
        date: c.commit.author?.date || new Date().toISOString(),
        filesChanged: [], // Would need additional API call
      })),
      pullRequests: recentPRs.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        mergedAt: pr.merged_at || undefined,
      })),
      issues: issues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        closedAt: issue.closed_at || undefined,
      })),
      hasActivity,
      summary: generateActivitySummary(commits.length, recentPRs.length, issues.length),
    };

    return activity;
  } catch (error: any) {
    throw new Error(`GitHub API error: ${error.message}`);
  }
}

/**
 * Generate activity summary
 */
function generateActivitySummary(
  commitCount: number,
  prCount: number,
  issueCount: number
): string {
  const parts = [];

  if (commitCount > 0) {
    parts.push(`${commitCount} commit${commitCount > 1 ? "s" : ""}`);
  }

  if (prCount > 0) {
    parts.push(`${prCount} merged PR${prCount > 1 ? "s" : ""}`);
  }

  if (issueCount > 0) {
    parts.push(`${issueCount} closed issue${issueCount > 1 ? "s" : ""}`);
  }

  return parts.length > 0 ? parts.join(", ") : "No activity";
}

/**
 * Generate content for specific platform
 *
 * NOTE: This is a stub - actual implementation would be in Phase 2.1 (AI agent)
 */
async function generateContentForPlatform(
  platformType: string,
  activity: GitHubActivity,
  project: any
): Promise<any> {
  // Placeholder: Would call AI generation service
  console.log(`Generating content for ${platformType}...`);

  // Simulate content generation
  return {
    title: `Development Update: ${activity.summary}`,
    content: `Recent activity in ${project.name}:\n\n${activity.summary}`,
    platformType,
    generated: true,
  };
}

/**
 * Update cron job statistics
 */
async function updateJobStats(jobId: string, success: boolean) {
  const now = new Date();
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
    select: { config: true },
  });

  if (!job) return;

  const config = job.config as any;
  const nextRun = calculateNextRunFromConfig(config);

  await prisma.cronJob.update({
    where: { id: jobId },
    data: {
      lastRunAt: now,
      lastSuccess: success ? now : undefined,
      lastFailure: success ? undefined : now,
      runCount: { increment: 1 },
      successCount: success ? { increment: 1 } : undefined,
      failureCount: success ? undefined : { increment: 1 },
      nextRunAt: nextRun,
      status: "IDLE",
    },
  });
}

/**
 * Calculate next run from job config
 */
function calculateNextRunFromConfig(config: any): Date {
  // Use frequency utils
  const { calculateNextRun } = require("@/lib/cron/frequency");
  return calculateNextRun(config.frequency, config.timeConfig);
}

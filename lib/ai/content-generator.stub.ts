/**
 * AI Content Generator - Integration Stub
 *
 * This file provides the interface that the AI agent (Phase 2.1) must implement.
 * The cron job system calls this function to generate platform-specific content.
 *
 * Location for AI Agent: Implement this in `/lib/ai/content-generator.ts`
 */

import { PlatformType } from "@prisma/client";

/**
 * GitHub activity context
 * Provided by cron job after scanning GitHub repository
 */
export interface GitHubActivity {
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
  summary: string; // e.g., "3 commits, 1 merged PR, 1 closed issue"
}

/**
 * Project context
 * Includes project metadata and settings
 */
export interface ProjectContext {
  id: string;
  name: string;
  description?: string;
  githubRepoOwner: string;
  githubRepoName: string;
  githubRepoUrl?: string;
  settings?: {
    contentPreferences?: {
      tone?: string;
      style?: string;
      length?: string;
      aiModel?: string;
    };
  };
}

/**
 * Generated content result
 * Return format expected by cron job system
 */
export interface GeneratedContent {
  title: string;
  content: string; // Markdown or HTML depending on platform
  tags?: string[];
  coverImage?: string;
  canonicalUrl?: string;
  metadata?: {
    aiModel?: string;
    tokensUsed?: number;
    generationTime?: number;
    prompt?: string;
  };
}

/**
 * Main function to generate platform-specific content
 *
 * Called by: /lib/inngest/functions/content-generation.ts
 *
 * @param platformType - Target platform (HASHNODE, DEVTO, LINKEDIN, etc.)
 * @param activity - GitHub activity context
 * @param project - Project configuration and settings
 * @returns Generated content ready for publishing
 *
 * @throws Error if generation fails (will trigger retry)
 */
export async function generateContentForPlatform(
  platformType: PlatformType,
  activity: GitHubActivity,
  project: ProjectContext
): Promise<GeneratedContent> {
  //
  // AI AGENT (Phase 2.1): IMPLEMENT THIS FUNCTION
  //
  // Requirements:
  // 1. Analyze GitHub activity (commits, PRs, issues)
  // 2. Generate platform-specific content using AI
  // 3. Format content according to platform requirements
  // 4. Return structured content object
  //
  // Platform-Specific Formatting:
  //
  // HASHNODE:
  //   - Markdown format
  //   - 800-2000 words recommended
  //   - Technical audience
  //   - Include code snippets if relevant
  //
  // DEVTO:
  //   - Markdown format
  //   - 500-1500 words
  //   - Developer community focus
  //   - Use tags effectively
  //
  // LINKEDIN:
  //   - Plain text or simple formatting
  //   - 300-800 words
  //   - Professional tone
  //   - Include emojis strategically
  //
  // TWITTER:
  //   - 280 characters max
  //   - Concise, engaging
  //   - Include hashtags
  //
  // MEDIUM:
  //   - Rich text/HTML format
  //   - 1000-3000 words
  //   - Storytelling approach
  //
  // Error Handling:
  //   - Throw Error for retriable failures (API issues, rate limits)
  //   - Throw NonRetriableError for permanent failures (invalid config)
  //
  // Performance:
  //   - Target: <10 seconds per platform
  //   - Cache AI model if possible
  //   - Use streaming for faster response
  //

  // Example implementation structure:
  /*
  // 1. Extract key information from activity
  const commitCount = activity.commits.length;
  const prCount = activity.pullRequests.length;
  const issueCount = activity.issues.length;

  // 2. Build AI prompt based on platform and activity
  const prompt = buildPrompt(platformType, activity, project);

  // 3. Call AI service (OpenAI, Anthropic, etc.)
  const aiResponse = await callAIService(prompt, project.settings?.contentPreferences);

  // 4. Format response for platform
  const formattedContent = formatForPlatform(aiResponse, platformType);

  // 5. Return structured content
  return {
    title: formattedContent.title,
    content: formattedContent.content,
    tags: formattedContent.tags,
    metadata: {
      aiModel: "gpt-4",
      tokensUsed: aiResponse.usage.total_tokens,
      generationTime: Date.now() - startTime,
      prompt: prompt,
    },
  };
  */

  // STUB IMPLEMENTATION (remove this when implementing)
  console.warn(`⚠️ Using stub implementation for ${platformType}`);

  return {
    title: `Development Update: ${activity.summary}`,
    content: `# ${project.name} - ${activity.summary}\n\nRecent activity in ${project.githubRepoName}:\n\n${generateStubContent(activity, platformType)}`,
    tags: ["development", "opensource", platformType.toLowerCase()],
    metadata: {
      aiModel: "stub",
      tokensUsed: 0,
      generationTime: 0,
      prompt: "stub implementation",
    },
  };
}

/**
 * Helper: Generate stub content (remove when implementing)
 */
function generateStubContent(activity: GitHubActivity, platformType: PlatformType): string {
  let content = "";

  if (activity.commits.length > 0) {
    content += `## Commits (${activity.commits.length})\n\n`;
    activity.commits.forEach((commit) => {
      content += `- ${commit.message} - ${commit.author}\n`;
    });
    content += "\n";
  }

  if (activity.pullRequests.length > 0) {
    content += `## Merged Pull Requests (${activity.pullRequests.length})\n\n`;
    activity.pullRequests.forEach((pr) => {
      content += `- #${pr.number}: ${pr.title}\n`;
    });
    content += "\n";
  }

  if (activity.issues.length > 0) {
    content += `## Closed Issues (${activity.issues.length})\n\n`;
    activity.issues.forEach((issue) => {
      content += `- #${issue.number}: ${issue.title}\n`;
    });
  }

  return content || "No recent activity to report.";
}

/**
 * Helper: Build AI prompt (implement in Phase 2.1)
 */
function buildPrompt(
  platformType: PlatformType,
  activity: GitHubActivity,
  project: ProjectContext
): string {
  // AI AGENT: Implement platform-specific prompt engineering
  return "";
}

/**
 * Helper: Call AI service (implement in Phase 2.1)
 */
async function callAIService(prompt: string, preferences?: any): Promise<any> {
  // AI AGENT: Implement AI API calls (OpenAI, Anthropic, etc.)
  throw new Error("Not implemented - Phase 2.1");
}

/**
 * Helper: Format for platform (implement in Phase 2.1)
 */
function formatForPlatform(aiResponse: any, platformType: PlatformType): any {
  // AI AGENT: Implement platform-specific formatting
  throw new Error("Not implemented - Phase 2.1");
}

/**
 * Example AI prompts for different platforms
 */
export const PLATFORM_PROMPT_TEMPLATES = {
  HASHNODE: `
You are a technical content writer creating a blog post for Hashnode.
Based on the following GitHub activity, write an engaging technical article:

Project: {project.name}
Description: {project.description}
Activity: {activity.summary}

Requirements:
- 800-2000 words
- Technical depth with code examples
- Clear structure with headings
- Include practical insights
- Developer audience

GitHub Activity Details:
{activity.details}

Write a comprehensive technical article.
`,

  DEVTO: `
You are writing a developer community post for Dev.to.
Transform this GitHub activity into an engaging post:

Project: {project.name}
Activity: {activity.summary}

Requirements:
- 500-1500 words
- Community-friendly tone
- Include relevant tags
- Practical examples
- Encourage discussion

GitHub Activity:
{activity.details}

Create an engaging Dev.to post.
`,

  LINKEDIN: `
You are a professional content creator for LinkedIn.
Create a professional update based on this development activity:

Project: {project.name}
Activity: {activity.summary}

Requirements:
- 300-800 words
- Professional tone
- Business value focus
- Strategic emojis
- Call to action

GitHub Activity:
{activity.details}

Write a professional LinkedIn post.
`,
};

/**
 * Integration test example
 *
 * Run this to verify the integration works:
 */
export async function testContentGeneration() {
  const mockActivity: GitHubActivity = {
    commits: [
      {
        sha: "abc123",
        message: "Add TypeScript support",
        author: "John Doe",
        date: new Date().toISOString(),
        filesChanged: ["src/index.ts"],
      },
    ],
    pullRequests: [],
    issues: [],
    hasActivity: true,
    summary: "1 commit",
  };

  const mockProject: ProjectContext = {
    id: "test_project",
    name: "Test Project",
    description: "A test project",
    githubRepoOwner: "testuser",
    githubRepoName: "test-repo",
  };

  const result = await generateContentForPlatform("HASHNODE" as PlatformType, mockActivity, mockProject);

  console.log("Generated Content:", result);
  return result;
}

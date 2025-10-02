import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { GitHubActivity, GeneratedContent, AIGenerationConfig } from '@/lib/types';
import { kv } from '@vercel/kv';

// Default configuration for AI generation
const DEFAULT_CONFIG: AIGenerationConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  style: 'technical',
  includeCodeSnippets: true,
  targetAudience: 'developers',
};

// Generate blog content from GitHub activities
export async function generateBlogPost(
  activities: GitHubActivity[],
  config: AIGenerationConfig = {}
): Promise<GeneratedContent> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Build context from activities
  const context = buildActivityContext(activities);

  // Create the prompt
  const prompt = createBlogPrompt(context, mergedConfig);

  try {
    const { text } = await generateText({
      model: openai(mergedConfig.model || 'gpt-4-turbo'),
      messages: [
        {
          role: 'system',
          content: `You are a technical writer creating blog posts about software development progress.
                   Your writing style is ${mergedConfig.style}.
                   Your target audience is ${mergedConfig.targetAudience}.
                   ${mergedConfig.includeCodeSnippets ? 'Include relevant code snippets when appropriate.' : 'Focus on narrative without code snippets.'}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: mergedConfig.temperature,
      maxTokens: mergedConfig.maxTokens,
    });

    // Parse the generated content
    return parseGeneratedContent(text);
  } catch (error) {
    console.error('Failed to generate blog post:', error);
    throw new Error('Content generation failed');
  }
}

// Generate newsletter content from weekly activities
export async function generateNewsletter(
  activities: GitHubActivity[],
  config: AIGenerationConfig = {}
): Promise<GeneratedContent> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config, style: 'casual' };

  const context = buildActivityContext(activities);
  const prompt = createNewsletterPrompt(context, mergedConfig);

  try {
    const { text } = await generateText({
      model: openai(mergedConfig.model || 'gpt-4-turbo'),
      messages: [
        {
          role: 'system',
          content: `You are writing a weekly newsletter about project updates.
                   Keep it engaging, informative, and easy to read.
                   Include highlights, key achievements, and what's coming next.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      maxTokens: mergedConfig.maxTokens,
    });

    return parseGeneratedContent(text);
  } catch (error) {
    console.error('Failed to generate newsletter:', error);
    throw new Error('Newsletter generation failed');
  }
}

// Build context from GitHub activities
function buildActivityContext(activities: GitHubActivity[]): string {
  const grouped = activities.reduce((acc, activity) => {
    if (!acc[activity.type]) acc[activity.type] = [];
    acc[activity.type].push(activity);
    return acc;
  }, {} as Record<string, GitHubActivity[]>);

  let context = '';

  // Process each activity type
  if (grouped.push) {
    const commits = grouped.push.map(a => {
      const commits = a.payload.commits || [];
      return commits.map((c: any) => `- ${c.message}`).join('\n');
    }).join('\n');
    context += `\nCOMMITS:\n${commits}\n`;
  }

  if (grouped.pull_request) {
    const prs = grouped.pull_request.map(a => {
      const pr = a.payload.pull_request;
      return `- PR #${pr.number}: ${pr.title} (${a.action})`;
    }).join('\n');
    context += `\nPULL REQUESTS:\n${prs}\n`;
  }

  if (grouped.issues) {
    const issues = grouped.issues.map(a => {
      const issue = a.payload.issue;
      return `- Issue #${issue.number}: ${issue.title} (${a.action})`;
    }).join('\n');
    context += `\nISSUES:\n${issues}\n`;
  }

  if (grouped.release) {
    const releases = grouped.release.map(a => {
      const release = a.payload.release;
      return `- ${release.name || release.tag_name}: ${release.body}`;
    }).join('\n');
    context += `\nRELEASES:\n${releases}\n`;
  }

  return context;
}

// Create blog post prompt
function createBlogPrompt(context: string, config: AIGenerationConfig): string {
  return `Based on the following GitHub activity, create an engaging blog post that highlights the progress and updates:

${context}

Requirements:
- Create an informative and engaging title
- Write a comprehensive blog post (500-800 words)
- Include an excerpt (2-3 sentences)
- Suggest 3-5 relevant tags
- Focus on the impact and significance of changes
- ${config.includeCodeSnippets ? 'Include code examples where relevant' : 'Focus on narrative'}

Format your response as JSON with the following structure:
{
  "title": "...",
  "content": "...",
  "excerpt": "...",
  "tags": ["tag1", "tag2", ...]
}`;
}

// Create newsletter prompt
function createNewsletterPrompt(context: string, config: AIGenerationConfig): string {
  return `Based on the following week's GitHub activity, create an engaging newsletter:

${context}

Requirements:
- Create a catchy subject line
- Write a friendly, informative newsletter (400-600 words)
- Include sections for: Highlights, Details, What's Next
- Keep tone casual but professional
- Include a brief excerpt for preview

Format your response as JSON with the following structure:
{
  "title": "Newsletter subject line",
  "content": "Full newsletter content with markdown formatting",
  "excerpt": "Brief preview text",
  "tags": ["updates", "weekly", ...]
}`;
}

// Parse the AI-generated content
function parseGeneratedContent(text: string): GeneratedContent {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(text);
    return {
      title: parsed.title || 'Untitled',
      content: parsed.content || '',
      excerpt: parsed.excerpt || '',
      tags: parsed.tags || [],
      metadata: parsed.metadata || {}
    };
  } catch {
    // Fallback: extract content from plain text
    const lines = text.split('\n');
    return {
      title: lines[0] || 'Untitled',
      content: text,
      excerpt: lines[1] || '',
      tags: [],
      metadata: {}
    };
  }
}

// Analyze activities and generate content if needed
export async function analyzeAndGenerateContent(activities: GitHubActivity[]): Promise<void> {
  try {
    // Check if we should generate content
    const shouldGenerate = await shouldGenerateContent(activities);

    if (!shouldGenerate) {
      console.log('Not enough significant activity for content generation');
      return;
    }

    // Generate blog post
    const content = await generateBlogPost(activities);

    // Store generated content for review/publishing
    await storeGeneratedContent(content, activities);

    console.log('Content generated successfully:', content.title);
  } catch (error) {
    console.error('Failed to analyze and generate content:', error);
  }
}

// Determine if we should generate content based on activities
async function shouldGenerateContent(activities: GitHubActivity[]): Promise<boolean> {
  // Always generate for releases
  if (activities.some(a => a.type === 'release')) {
    return true;
  }

  // Generate for merged PRs
  if (activities.some(a => a.type === 'pull_request' && a.action === 'closed')) {
    return true;
  }

  // Generate if we have significant number of commits
  const pushActivities = activities.filter(a => a.type === 'push');
  if (pushActivities.length >= 5) {
    return true;
  }

  return false;
}

// Store generated content in KV for later publishing
async function storeGeneratedContent(
  content: GeneratedContent,
  activities: GitHubActivity[]
): Promise<void> {
  const id = `content:${Date.now()}`;

  await kv.set(id, {
    ...content,
    generatedAt: new Date(),
    activityIds: activities.map(a => a.id),
    status: 'draft'
  }, { ex: 7 * 24 * 60 * 60 }); // Expire after 7 days

  // Add to drafts list
  await kv.zadd('content:drafts', {
    score: Date.now(),
    member: id
  });
}
/**
 * Default Prompts API
 * GET /api/prompts/defaults - Get all default system prompts
 * POST /api/prompts/defaults/seed - Seed default prompts (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Default system prompts configuration
const DEFAULT_PROMPTS = [
  {
    name: 'Technical Blog Post - Detailed',
    description: 'Comprehensive technical blog post for development updates',
    category: 'TECHNICAL_UPDATE' as const,
    platform: 'BLOG' as const,
    systemPrompt: `You are a technical content writer for a software development blog. Your writing style is:
- Clear and accessible to developers of all levels
- Technically accurate with code examples
- Engaging and educational
- Well-structured with clear sections
- Includes practical takeaways

Focus on explaining the "why" behind technical decisions, not just the "what".`,
    userPrompt: `Write a comprehensive blog post about the following development activity:

{{activity}}

Repository: {{repository}}
Latest changes: {{allCommits}}

Include:
1. Overview of changes
2. Technical details and implementation
3. Code examples (if applicable)
4. Benefits and impact
5. Next steps

Target length: 800-1200 words
Tone: Professional but approachable`,
    variables: ['activity', 'repository', 'allCommits', 'latestCommit', 'projectName'],
    tags: ['technical', 'blog', 'detailed'],
    contentType: 'blog_post',
    tone: 'professional',
    targetLength: 1000,
  },
  {
    name: 'Twitter Thread - Development Update',
    description: 'Concise Twitter thread for development announcements',
    category: 'TECHNICAL_UPDATE' as const,
    platform: 'TWITTER' as const,
    systemPrompt: `You are a social media content creator specializing in developer-focused Twitter threads. Your style is:
- Concise and punchy (each tweet under 280 characters)
- Engaging with emojis and formatting
- Builds excitement and interest
- Uses thread format effectively
- Clear call-to-action

Make technical content accessible and shareable.`,
    userPrompt: `Create a Twitter thread (5-7 tweets) about:

{{activity}}

Repository: {{repository}}
Key changes: {{latestCommit}}

Thread structure:
1/ Hook - What's new and exciting
2-5/ Key points and details
Last/ Call to action + link

Keep each tweet under 280 characters.
Use relevant emojis.
Include hashtags: #dev #opensource`,
    variables: ['activity', 'repository', 'latestCommit', 'repositoryUrl'],
    tags: ['twitter', 'social', 'short'],
    contentType: 'twitter_thread',
    tone: 'engaging',
    targetLength: 280,
  },
  {
    name: 'Email Newsletter - Weekly Digest',
    description: 'Weekly development digest email for subscribers',
    category: 'WEEKLY_DIGEST' as const,
    platform: 'NEWSLETTER' as const,
    systemPrompt: `You are an email newsletter writer for a development project. Your style is:
- Friendly and conversational
- Well-organized with clear sections
- Highlights key updates
- Includes visuals/formatting hints
- Personal and engaging tone

Build community through consistent, valuable updates.`,
    userPrompt: `Write a weekly development digest email for {{projectName}}:

This week's activity: {{activity}}
Commits: {{commitCount}}
Notable changes: {{allCommits}}

Email structure:
- Warm greeting
- "This Week's Highlights" section
- Detailed updates with context
- "What's Next" preview
- Community engagement ask
- Sign-off

Subject line: {{projectName}} Weekly Update - {{weekRange}}

Tone: Friendly and informative
Length: 500-800 words`,
    variables: ['projectName', 'activity', 'commitCount', 'allCommits', 'weekRange'],
    tags: ['email', 'newsletter', 'weekly'],
    contentType: 'email_newsletter',
    tone: 'friendly',
    targetLength: 650,
  },
  {
    name: 'LinkedIn Post - Professional Update',
    description: 'Professional development update for LinkedIn',
    category: 'TECHNICAL_UPDATE' as const,
    platform: 'LINKEDIN' as const,
    systemPrompt: `You are a LinkedIn content creator for professional software development updates. Your style is:
- Professional but personable
- Business-value focused
- Includes insights and learnings
- Engaging storytelling
- Clear structure with line breaks

Appeal to both technical and non-technical professionals.`,
    userPrompt: `Create a LinkedIn post about development progress:

Project: {{projectName}}
Recent work: {{activity}}
Latest: {{latestCommit}}

Post structure:
- Opening hook (personal or insight)
- Context and problem
- Solution/progress made
- Key learnings
- Impact/results
- Call for engagement

Length: 150-300 words
Use line breaks for readability
Professional tone with personality`,
    variables: ['projectName', 'activity', 'latestCommit', 'repositoryUrl'],
    tags: ['linkedin', 'professional', 'social'],
    contentType: 'linkedin_post',
    tone: 'professional',
    targetLength: 200,
  },
  {
    name: 'Release Notes - Feature Announcement',
    description: 'Structured release notes for new features',
    category: 'FEATURE_ANNOUNCEMENT' as const,
    platform: 'BLOG' as const,
    systemPrompt: `You are a product documentation writer creating release notes. Your style is:
- Clear and structured
- Feature-benefit focused
- Includes upgrade instructions
- Highlights breaking changes
- Technical but accessible

Help users understand what changed and why it matters.`,
    userPrompt: `Write release notes for version {{latestReleaseVersion}}:

Release: {{latestRelease}}
Changes: {{latestReleaseNotes}}
Commits included: {{allCommits}}

Structure:
# {{latestReleaseVersion}} Release Notes

## 🎉 New Features
[Feature descriptions with benefits]

## 🔧 Improvements
[Enhancement details]

## 🐛 Bug Fixes
[Fixed issues]

## ⚠️ Breaking Changes
[If any, with migration guide]

## 📦 Installation
[Upgrade instructions]

Tone: Professional and helpful
Be specific about user impact`,
    variables: ['latestReleaseVersion', 'latestRelease', 'latestReleaseNotes', 'allCommits'],
    tags: ['release', 'announcement', 'documentation'],
    contentType: 'release_notes',
    tone: 'professional',
    targetLength: 600,
  },
  {
    name: 'Dev.to Article - Tutorial Style',
    description: 'Educational article for Dev.to community',
    category: 'TUTORIAL' as const,
    platform: 'DEVTO' as const,
    systemPrompt: `You are a Dev.to community writer creating educational content. Your style is:
- Tutorial-focused and practical
- Step-by-step explanations
- Code examples with syntax highlighting
- Beginner-friendly language
- Community-oriented tone

Share knowledge in an accessible, encouraging way.`,
    userPrompt: `Create a Dev.to article teaching about recent development work:

Topic: {{latestCommit}}
Context: {{activity}}
Repository: {{repository}}

Article structure:
- Introduction (what we'll learn)
- Prerequisites
- Step-by-step tutorial
- Code examples
- Explanation of concepts
- Conclusion and next steps
- Resources/links

Include: \`\`\`language code blocks\`\`\`
Use subheadings (##)
Add cover image suggestion
Tags: #tutorial #{{platform}}

Length: 1000-1500 words
Tone: Friendly and educational`,
    variables: ['latestCommit', 'activity', 'repository', 'repositoryUrl'],
    tags: ['devto', 'tutorial', 'educational'],
    contentType: 'tutorial',
    tone: 'friendly',
    targetLength: 1200,
  },
];

/**
 * GET /api/prompts/defaults
 * Get all default system prompts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all default prompts
    const defaultPrompts = await db.promptLibrary.findMany({
      where: { isDefault: true },
      orderBy: [
        { platform: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
      include: {
        template: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
      },
    });

    // Group by platform for easier consumption
    const grouped = defaultPrompts.reduce((acc, prompt) => {
      const platform = prompt.platform;
      if (!acc[platform]) acc[platform] = [];
      acc[platform].push(prompt);
      return acc;
    }, {} as Record<string, typeof defaultPrompts>);

    return NextResponse.json({
      prompts: defaultPrompts,
      byPlatform: grouped,
      total: defaultPrompts.length,
    });
  } catch (error: any) {
    console.error('Error fetching default prompts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch default prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts/defaults/seed
 * Seed default prompts (admin/setup only)
 * This should be run once during initial setup
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if defaults already exist
    const existingDefaults = await db.promptLibrary.count({
      where: { isDefault: true },
    });

    if (existingDefaults > 0) {
      return NextResponse.json(
        {
          error: 'Default prompts already seeded',
          existing: existingDefaults,
          message: 'Delete existing defaults first or use a migration script',
        },
        { status: 400 }
      );
    }

    // Seed all default prompts
    const createdPrompts = await Promise.all(
      DEFAULT_PROMPTS.map((promptData) =>
        db.promptLibrary.create({
          data: {
            ...promptData,
            isDefault: true,
            isPublic: true,
            version: 1,
            usageCount: 0,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdPrompts.length} default prompts`,
      prompts: createdPrompts.map(p => ({
        id: p.id,
        name: p.name,
        platform: p.platform,
        category: p.category,
      })),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error seeding default prompts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed default prompts' },
      { status: 500 }
    );
  }
}

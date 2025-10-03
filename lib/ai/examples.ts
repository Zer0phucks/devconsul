/**
 * AI Content Generation Examples
 * Demonstrates usage of the AI content generation system
 */

import {
  generateContent,
  generateForAllPlatforms,
  parseGitHubActivity,
  validateContent,
  type GitHubActivity,
  type Platform,
} from './generator';

/**
 * Example: Generate blog post from GitHub activity
 */
export async function exampleGenerateBlogPost() {
  const activities: GitHubActivity[] = [
    {
      type: 'commit',
      title: 'feat: add AI content generation with OpenAI and Claude',
      description: 'Implemented dual-provider system with automatic fallback',
      timestamp: new Date('2024-10-01T10:00:00Z'),
      additions: 500,
      deletions: 20,
      filesChanged: [
        'lib/ai/generator.ts',
        'lib/ai/providers/openai.ts',
        'lib/ai/providers/anthropic.ts',
      ],
    },
    {
      type: 'commit',
      title: 'feat: create platform-specific prompts for 6 platforms',
      timestamp: new Date('2024-10-01T14:00:00Z'),
      additions: 350,
      filesChanged: [
        'lib/ai/prompts/blog.ts',
        'lib/ai/prompts/twitter.ts',
        'lib/ai/prompts/linkedin.ts',
      ],
    },
    {
      type: 'pr',
      title: 'Add API endpoints for content generation',
      description: 'Created REST API with validation and error handling',
      url: 'https://github.com/user/repo/pull/123',
      timestamp: new Date('2024-10-02T09:00:00Z'),
    },
  ];

  const result = await generateContent({
    activities,
    platform: 'blog',
    brandVoice: {
      tone: 'technical but accessible',
      audience: 'software developers',
      themes: ['AI', 'automation', 'content generation'],
    },
  });

  if (result.success) {
    console.log('✅ Blog post generated successfully!');
    console.log('\n📝 Content Preview:');
    console.log(result.content?.slice(0, 500) + '...');
    console.log('\n📊 Metadata:');
    console.log(`Provider: ${result.metadata.provider}`);
    console.log(`Model: ${result.metadata.model}`);
    console.log(`Tokens: ${result.metadata.tokensUsed.total}`);
    console.log(`Cost: $${result.metadata.cost}`);
  } else {
    console.error('❌ Generation failed:', result.error);
  }

  return result;
}

/**
 * Example: Generate Twitter thread
 */
export async function exampleGenerateTwitterThread() {
  const activities: GitHubActivity[] = [
    {
      type: 'release',
      title: 'v2.0.0 - Major Performance Improvements',
      description:
        'Reduced API response time by 60% through caching and query optimization',
      timestamp: new Date('2024-10-02T12:00:00Z'),
    },
  ];

  const result = await generateContent({
    activities,
    platform: 'twitter',
    brandVoice: {
      tone: 'excited and informative',
      audience: 'developers and tech enthusiasts',
    },
  });

  if (result.success) {
    console.log('✅ Twitter thread generated!');
    console.log('\n🐦 Thread Preview:');
    console.log(result.content);

    // Validate Twitter thread
    const validation = validateContent(result.content!, 'twitter');
    if (validation.valid) {
      console.log('\n✅ Thread validation passed');
    } else {
      console.log('\n⚠️ Validation warnings:', validation.errors);
    }
  }

  return result;
}

/**
 * Example: Generate for multiple platforms at once
 */
export async function exampleBatchGeneration() {
  const activities: GitHubActivity[] = [
    {
      type: 'commit',
      title: 'feat: implement real-time collaboration features',
      description: 'Added WebSocket support for live updates',
      timestamp: new Date('2024-10-03T08:00:00Z'),
      additions: 400,
      deletions: 50,
    },
    {
      type: 'commit',
      title: 'fix: resolve race condition in concurrent updates',
      timestamp: new Date('2024-10-03T11:00:00Z'),
      additions: 30,
      deletions: 15,
    },
  ];

  const results = await generateForAllPlatforms(
    activities,
    ['blog', 'twitter', 'linkedin'],
    {
      brandVoice: {
        tone: 'professional yet approachable',
        audience: 'tech professionals',
        themes: ['real-time collaboration', 'WebSockets', 'architecture'],
      },
    }
  );

  console.log('\n📊 Batch Generation Results:');
  console.log(`Total platforms: ${results.length}`);

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.platform}: ${result.success ? 'Success' : result.error}`);

    if (result.success) {
      console.log(
        `   Tokens: ${result.metadata.tokensUsed.total}, Cost: $${result.metadata.cost}`
      );
    }
  });

  return results;
}

/**
 * Example: Parse GitHub activity into readable context
 */
export function exampleParseActivity() {
  const activities: GitHubActivity[] = [
    {
      type: 'commit',
      title: 'feat: add database connection pooling',
      additions: 120,
      deletions: 30,
      filesChanged: ['db/pool.ts', 'config/database.ts'],
      timestamp: new Date('2024-10-01T10:00:00Z'),
    },
    {
      type: 'commit',
      title: 'test: add integration tests for API endpoints',
      additions: 250,
      filesChanged: ['tests/api.test.ts', 'tests/setup.ts'],
      timestamp: new Date('2024-10-01T14:00:00Z'),
    },
    {
      type: 'pr',
      title: 'Implement user authentication system',
      description: 'Added JWT-based auth with refresh tokens',
      url: 'https://github.com/user/repo/pull/456',
      timestamp: new Date('2024-10-02T09:00:00Z'),
    },
    {
      type: 'issue',
      title: 'Improve API documentation',
      timestamp: new Date('2024-10-02T11:00:00Z'),
    },
  ];

  const parsed = parseGitHubActivity(activities);
  console.log('\n📋 Parsed GitHub Activity:');
  console.log(parsed);

  return parsed;
}

/**
 * Example: Custom prompt override
 */
export async function exampleCustomPrompt() {
  const activities: GitHubActivity[] = [
    {
      type: 'commit',
      title: 'refactor: migrate from REST to GraphQL',
      timestamp: new Date(),
      additions: 600,
      deletions: 400,
    },
  ];

  const result = await generateContent({
    activities,
    platform: 'blog',
    customPrompt: `
      Write a comprehensive technical blog post about migrating from REST to GraphQL.

      Focus on:
      - Why we made the decision
      - Technical challenges encountered
      - How we solved them
      - Performance improvements
      - Lessons learned

      Include TypeScript code examples and be specific about the benefits.
      Target audience: senior developers considering similar migrations.
    `,
  });

  if (result.success) {
    console.log('✅ Custom prompt blog generated!');
    console.log('\n📝 Content (first 300 chars):');
    console.log(result.content?.slice(0, 300) + '...');
  }

  return result;
}

/**
 * Example: Provider fallback demonstration
 */
export async function exampleProviderFallback() {
  const activities: GitHubActivity[] = [
    {
      type: 'commit',
      title: 'feat: implement caching layer with Redis',
      timestamp: new Date(),
      additions: 200,
    },
  ];

  console.log('\n🔄 Testing provider fallback...');

  // Try with OpenAI first
  const result = await generateContent({
    activities,
    platform: 'linkedin',
    provider: 'openai',
  });

  if (result.success) {
    console.log(`✅ Success with ${result.metadata.provider}`);
    console.log(`Model: ${result.metadata.model}`);
  } else {
    console.log('❌ Both providers failed:', result.error);
  }

  return result;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running AI Content Generation Examples\n');

  try {
    console.log('--- Example 1: Generate Blog Post ---');
    await exampleGenerateBlogPost();

    console.log('\n--- Example 2: Generate Twitter Thread ---');
    await exampleGenerateTwitterThread();

    console.log('\n--- Example 3: Batch Generation (Multiple Platforms) ---');
    await exampleBatchGeneration();

    console.log('\n--- Example 4: Parse GitHub Activity ---');
    exampleParseActivity();

    console.log('\n--- Example 5: Custom Prompt ---');
    await exampleCustomPrompt();

    console.log('\n--- Example 6: Provider Fallback ---');
    await exampleProviderFallback();

    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('❌ Example error:', error);
  }
}

// Export for CLI usage
if (require.main === module) {
  runAllExamples().catch(console.error);
}

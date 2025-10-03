/**
 * Database seed script for development environment
 * Creates sample data for all tables to enable local testing
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, PlatformType, ProjectStatus, ContentStatus, ContentSourceType, CronJobType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🗑️  Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.cronExecution.deleteMany();
    await prisma.cronJob.deleteMany();
    await prisma.contentPublication.deleteMany();
    await prisma.content.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.project.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned existing data\n');
  }

  // Create test users
  console.log('👤 Creating test users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'demo@fullselfpublishing.com',
      name: 'Demo User',
      password: hashedPassword,
      emailVerified: new Date(),
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en',
      },
      timezone: 'America/New_York',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      emailVerified: new Date(),
      preferences: {
        theme: 'light',
        notifications: false,
        language: 'en',
      },
      timezone: 'UTC',
      isActive: true,
    },
  });

  console.log(`✅ Created ${2} users\n`);

  // Create test projects
  console.log('📁 Creating test projects...');

  const project1 = await prisma.project.create({
    data: {
      name: 'Tech Blog',
      description: 'A blog about software development and technology',
      userId: user1.id,
      githubRepoUrl: 'https://github.com/demo/tech-blog',
      githubRepoOwner: 'demo',
      githubRepoName: 'tech-blog',
      githubBranch: 'main',
      syncEnabled: true,
      status: ProjectStatus.ACTIVE,
      tags: ['technology', 'programming', 'tutorials'],
      metadata: {
        contentPath: 'content/posts',
        imageBasePath: 'public/images',
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Personal Blog',
      description: 'Personal thoughts and experiences',
      userId: user1.id,
      githubRepoUrl: 'https://github.com/demo/personal-blog',
      githubRepoOwner: 'demo',
      githubRepoName: 'personal-blog',
      githubBranch: 'main',
      syncEnabled: false,
      status: ProjectStatus.ACTIVE,
      tags: ['personal', 'lifestyle'],
      metadata: {},
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'DevOps Hub',
      description: 'DevOps best practices and tutorials',
      userId: user2.id,
      status: ProjectStatus.ACTIVE,
      tags: ['devops', 'cloud', 'automation'],
      metadata: {},
    },
  });

  console.log(`✅ Created ${3} projects\n`);

  // Create platform connections
  console.log('🔌 Creating platform connections...');

  const hashnodePlatform = await prisma.platform.create({
    data: {
      projectId: project1.id,
      type: PlatformType.HASHNODE,
      name: 'Hashnode Blog',
      isConnected: true,
      lastConnectedAt: new Date(),
      config: {
        publicationId: 'demo-publication-id',
        webhookUrl: 'https://api.hashnode.com/webhook',
      },
      totalPublished: 5,
      lastPublishedAt: new Date(Date.now() - 86400000), // 1 day ago
    },
  });

  const devtoPlatform = await prisma.platform.create({
    data: {
      projectId: project1.id,
      type: PlatformType.DEVTO,
      name: 'Dev.to Blog',
      isConnected: true,
      lastConnectedAt: new Date(),
      apiKey: 'demo-api-key-encrypted',
      config: {
        organizationId: 'demo-org',
        series: 'tech-series',
      },
      totalPublished: 3,
      lastPublishedAt: new Date(Date.now() - 172800000), // 2 days ago
    },
  });

  const mediumPlatform = await prisma.platform.create({
    data: {
      projectId: project2.id,
      type: PlatformType.MEDIUM,
      name: 'Medium Blog',
      isConnected: false,
      config: {},
      totalPublished: 0,
    },
  });

  const newsletterPlatform = await prisma.platform.create({
    data: {
      projectId: project3.id,
      type: PlatformType.NEWSLETTER,
      name: 'Weekly Newsletter',
      isConnected: true,
      lastConnectedAt: new Date(),
      apiKey: 'resend-api-key-encrypted',
      config: {
        fromEmail: 'newsletter@example.com',
        fromName: 'DevOps Weekly',
        subscriberList: 'weekly-subscribers',
      },
      totalPublished: 12,
      lastPublishedAt: new Date(Date.now() - 604800000), // 7 days ago
    },
  });

  console.log(`✅ Created ${4} platform connections\n`);

  // Create content
  console.log('📝 Creating content...');

  const content1 = await prisma.content.create({
    data: {
      projectId: project1.id,
      sourceType: ContentSourceType.GITHUB_MARKDOWN,
      sourcePath: 'content/posts/getting-started-with-nextjs.md',
      sourceCommitSha: 'abc123def456',
      title: 'Getting Started with Next.js 14',
      slug: 'getting-started-with-nextjs-14',
      excerpt: 'Learn how to build modern web applications with Next.js 14',
      body: 'Next.js 14 introduces powerful features for building modern web applications...',
      rawContent: '# Getting Started with Next.js 14\n\nNext.js 14 introduces powerful features...',
      htmlContent: '<h1>Getting Started with Next.js 14</h1><p>Next.js 14 introduces powerful features...</p>',
      tags: ['nextjs', 'react', 'web-development'],
      categories: ['Tutorial', 'Web Development'],
      coverImage: 'https://example.com/images/nextjs-cover.jpg',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000),
      isAIGenerated: false,
      version: 1,
    },
  });

  const content2 = await prisma.content.create({
    data: {
      projectId: project1.id,
      sourceType: ContentSourceType.GITHUB_MDX,
      sourcePath: 'content/posts/typescript-best-practices.mdx',
      sourceCommitSha: 'def456ghi789',
      title: 'TypeScript Best Practices in 2024',
      slug: 'typescript-best-practices-2024',
      excerpt: 'Discover essential TypeScript patterns and practices for modern development',
      body: 'TypeScript has become essential for modern JavaScript development...',
      rawContent: '# TypeScript Best Practices\n\nTypeScript has become essential...',
      htmlContent: '<h1>TypeScript Best Practices</h1><p>TypeScript has become essential...</p>',
      tags: ['typescript', 'javascript', 'best-practices'],
      categories: ['Tutorial', 'Programming'],
      coverImage: 'https://example.com/images/typescript-cover.jpg',
      status: ContentStatus.SCHEDULED,
      scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
      isAIGenerated: false,
      version: 1,
    },
  });

  const content3 = await prisma.content.create({
    data: {
      projectId: project1.id,
      sourceType: ContentSourceType.AI_GENERATED,
      title: 'Understanding React Server Components',
      slug: 'understanding-react-server-components',
      excerpt: 'A deep dive into React Server Components and their benefits',
      body: 'React Server Components represent a paradigm shift in how we build React applications...',
      rawContent: '# Understanding React Server Components\n\nRSC represent a paradigm shift...',
      htmlContent: '<h1>Understanding React Server Components</h1><p>RSC represent...</p>',
      tags: ['react', 'server-components', 'performance'],
      categories: ['Tutorial', 'React'],
      status: ContentStatus.DRAFT,
      isAIGenerated: true,
      aiModel: 'gpt-4',
      aiPrompt: 'Write a technical article explaining React Server Components',
      aiMetadata: {
        temperature: 0.7,
        maxTokens: 2000,
        generatedAt: new Date().toISOString(),
      },
      version: 1,
    },
  });

  const content4 = await prisma.content.create({
    data: {
      projectId: project3.id,
      sourceType: ContentSourceType.MANUAL,
      title: 'Docker Best Practices for Production',
      slug: 'docker-best-practices-production',
      excerpt: 'Essential Docker practices for production deployments',
      body: 'When deploying Docker containers to production, there are several key practices...',
      rawContent: '# Docker Best Practices\n\nWhen deploying Docker containers...',
      htmlContent: '<h1>Docker Best Practices</h1><p>When deploying...</p>',
      tags: ['docker', 'devops', 'containers'],
      categories: ['DevOps', 'Best Practices'],
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000),
      isAIGenerated: false,
      version: 1,
    },
  });

  console.log(`✅ Created ${4} content items\n`);

  // Create content publications
  console.log('📤 Creating content publications...');

  await prisma.contentPublication.create({
    data: {
      contentId: content1.id,
      platformId: hashnodePlatform.id,
      publishedAt: new Date(Date.now() - 86400000),
      platformPostId: 'hashnode-post-123',
      platformUrl: 'https://demo.hashnode.dev/getting-started-with-nextjs-14',
      status: 'PUBLISHED',
    },
  });

  await prisma.contentPublication.create({
    data: {
      contentId: content1.id,
      platformId: devtoPlatform.id,
      publishedAt: new Date(Date.now() - 86400000),
      platformPostId: 'devto-post-456',
      platformUrl: 'https://dev.to/demo/getting-started-with-nextjs-14',
      status: 'PUBLISHED',
    },
  });

  await prisma.contentPublication.create({
    data: {
      contentId: content2.id,
      platformId: hashnodePlatform.id,
      status: 'PENDING',
    },
  });

  await prisma.contentPublication.create({
    data: {
      contentId: content4.id,
      platformId: newsletterPlatform.id,
      publishedAt: new Date(Date.now() - 172800000),
      platformUrl: 'https://newsletter.example.com/archive/docker-best-practices',
      status: 'PUBLISHED',
    },
  });

  console.log(`✅ Created ${4} content publications\n`);

  // Create settings
  console.log('⚙️  Creating settings...');

  await prisma.settings.create({
    data: {
      userId: user1.id,
      projectId: project1.id,
      scope: 'PROJECT',
      contentPreferences: {
        aiModel: 'gpt-4',
        tone: 'professional',
        style: 'technical',
        targetLength: 1500,
      },
      autoPublish: true,
      publishDelay: 30,
      contentFilters: {
        includeTags: ['technology', 'programming'],
        excludeTags: ['draft', 'wip'],
      },
      cronFrequency: '0 9 * * *', // Daily at 9 AM
      timezone: 'America/New_York',
      publishingSchedule: {
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTime: '09:00',
      },
      emailNotifications: true,
      notificationEvents: ['content_published', 'sync_completed', 'error_occurred'],
    },
  });

  await prisma.settings.create({
    data: {
      userId: user1.id,
      scope: 'USER',
      emailNotifications: true,
      notificationEvents: ['weekly_summary', 'platform_connected'],
      customSettings: {
        dashboardLayout: 'grid',
        defaultView: 'projects',
      },
    },
  });

  console.log(`✅ Created ${2} settings\n`);

  // Create cron jobs
  console.log('⏰ Creating cron jobs...');

  const cronJob1 = await prisma.cronJob.create({
    data: {
      projectId: project1.id,
      name: 'GitHub Sync - Tech Blog',
      description: 'Sync content from GitHub repository',
      type: CronJobType.SYNC_GITHUB,
      schedule: '*/15 * * * *', // Every 15 minutes
      timezone: 'America/New_York',
      isEnabled: true,
      status: 'IDLE',
      nextRunAt: new Date(Date.now() + 900000), // 15 minutes from now
      runCount: 24,
      successCount: 23,
      failureCount: 1,
      config: {
        repoOwner: 'demo',
        repoName: 'tech-blog',
        branch: 'main',
        contentPath: 'content/posts',
      },
    },
  });

  const cronJob2 = await prisma.cronJob.create({
    data: {
      projectId: project1.id,
      name: 'Auto-Publish Scheduled Content',
      description: 'Publish content scheduled for this time',
      type: CronJobType.PUBLISH_CONTENT,
      schedule: '0 * * * *', // Every hour
      timezone: 'America/New_York',
      isEnabled: true,
      status: 'IDLE',
      nextRunAt: new Date(Date.now() + 3600000), // 1 hour from now
      runCount: 72,
      successCount: 72,
      failureCount: 0,
      config: {
        platforms: ['HASHNODE', 'DEVTO'],
        batchSize: 5,
      },
    },
  });

  const cronJob3 = await prisma.cronJob.create({
    data: {
      projectId: project3.id,
      name: 'Weekly Newsletter',
      description: 'Send weekly newsletter to subscribers',
      type: CronJobType.CUSTOM,
      schedule: '0 9 * * 1', // Every Monday at 9 AM
      timezone: 'UTC',
      isEnabled: true,
      status: 'IDLE',
      nextRunAt: new Date('2024-01-08T09:00:00Z'),
      runCount: 4,
      successCount: 4,
      failureCount: 0,
      config: {
        template: 'weekly-newsletter',
        audienceSegment: 'all-subscribers',
      },
    },
  });

  console.log(`✅ Created ${3} cron jobs\n`);

  // Create cron execution logs
  console.log('📊 Creating cron execution logs...');

  await prisma.cronExecution.create({
    data: {
      jobId: cronJob1.id,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 86400000 + 5000),
      duration: 5000,
      status: 'COMPLETED',
      triggeredBy: 'scheduled',
      itemsProcessed: 3,
      itemsSuccess: 3,
      itemsFailed: 0,
      output: {
        filesProcessed: ['post1.md', 'post2.md', 'post3.md'],
        newContent: 1,
        updatedContent: 2,
      },
    },
  });

  await prisma.cronExecution.create({
    data: {
      jobId: cronJob2.id,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3600000 + 2000),
      duration: 2000,
      status: 'COMPLETED',
      triggeredBy: 'scheduled',
      itemsProcessed: 1,
      itemsSuccess: 1,
      itemsFailed: 0,
      output: {
        published: ['content-1'],
        platforms: ['HASHNODE', 'DEVTO'],
      },
    },
  });

  console.log(`✅ Created ${2} cron execution logs\n`);

  // Create audit logs
  console.log('📜 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      userId: user1.id,
      userEmail: user1.email,
      action: 'create',
      resource: 'PROJECT',
      resourceId: project1.id,
      newValues: {
        name: 'Tech Blog',
        description: 'A blog about software development and technology',
      },
      metadata: {
        userAgent: 'Mozilla/5.0',
        source: 'web-ui',
      },
      projectId: project1.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user1.id,
      userEmail: user1.email,
      action: 'publish',
      resource: 'CONTENT',
      resourceId: content1.id,
      newValues: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      metadata: {
        platforms: ['HASHNODE', 'DEVTO'],
      },
      projectId: project1.id,
    },
  });

  console.log(`✅ Created ${2} audit logs\n`);

  console.log('🎉 Database seeding completed successfully!\n');

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Projects: ${await prisma.project.count()}`);
  console.log(`   Platforms: ${await prisma.platform.count()}`);
  console.log(`   Content: ${await prisma.content.count()}`);
  console.log(`   Publications: ${await prisma.contentPublication.count()}`);
  console.log(`   Settings: ${await prisma.settings.count()}`);
  console.log(`   Cron Jobs: ${await prisma.cronJob.count()}`);
  console.log(`   Executions: ${await prisma.cronExecution.count()}`);
  console.log(`   Audit Logs: ${await prisma.auditLog.count()}\n`);

  console.log('🔑 Test credentials:');
  console.log('   Email: demo@fullselfpublishing.com');
  console.log('   Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

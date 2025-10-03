/**
 * Default Templates
 * Pre-built templates for each platform
 */

export interface DefaultTemplate {
  name: string;
  description: string;
  platform: string;
  category: string;
  content: string;
  subject?: string;
  variables: string[];
  tags: string[];
}

/**
 * Default blog post templates
 */
export const BLOG_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Technical Update - Blog Post',
    description: 'Detailed technical blog post highlighting development progress',
    platform: 'BLOG',
    category: 'technical',
    content: `# {{projectName}} Development Update - {{dateLong}}

Hey everyone! Here's what we've been working on in {{repository}} this week.

## Overview

We've had a productive week with {{activityCount}} updates across the codebase. Here's a breakdown of what's new.

## Recent Changes

{{allCommits}}

## Technical Highlights

{{#if latestRelease}}
### Latest Release: {{latestRelease}}

{{latestReleaseNotes}}
{{/if}}

{{#if latestPR}}
### Notable Pull Request

**{{latestPR}}**
{{latestPRUrl}}
{{/if}}

## What's Next

We're continuing to iterate and improve. Stay tuned for more updates!

## Get Involved

Check out our repository at {{repositoryUrl}} and feel free to contribute!

---
*This update was generated from recent GitHub activity in {{repository}}*`,
    subject: undefined,
    variables: [
      'projectName',
      'dateLong',
      'repository',
      'activityCount',
      'allCommits',
      'latestRelease',
      'latestReleaseNotes',
      'latestPR',
      'latestPRUrl',
      'repositoryUrl',
    ],
    tags: ['technical', 'blog', 'development'],
  },
  {
    name: 'Weekly Digest - Blog',
    description: 'Weekly summary blog post',
    platform: 'BLOG',
    category: 'digest',
    content: `# Week in Review: {{weekRange}}

Another week, another batch of improvements to {{projectName}}!

## By the Numbers

- **{{commitCount}}** commits
- **{{prCount}}** pull requests
{{#if releaseCount}}
- **{{releaseCount}}** releases
{{/if}}

## Key Updates

{{allCommits|truncate:800}}

## Coming Up

More exciting features and improvements are on the horizon. Follow {{repositoryUrl}} to stay updated!

---
*Week of {{weekRange}}*`,
    subject: undefined,
    variables: [
      'weekRange',
      'projectName',
      'commitCount',
      'prCount',
      'releaseCount',
      'allCommits',
      'repositoryUrl',
    ],
    tags: ['weekly', 'digest', 'summary'],
  },
];

/**
 * Default email/newsletter templates
 */
export const EMAIL_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Newsletter - Monthly Update',
    description: 'Monthly newsletter template with highlights and updates',
    platform: 'NEWSLETTER',
    category: 'newsletter',
    subject: '{{projectName}} Updates - {{monthName}} {{year}}',
    content: `Hi there!

It's been an exciting month for {{projectName}}. Here's what's new:

## This Month's Highlights

We shipped {{activityCount}} updates this month:

{{allCommits|truncate:500}}

{{#if latestRelease}}
## Latest Release: {{latestRelease}}

{{latestReleaseNotes|truncate:300}}

Check it out: {{latestReleaseUrl}}
{{/if}}

## What's Coming

Stay tuned for more updates next month!

## Get in Touch

Questions or feedback? Reply to this email or visit {{repositoryUrl}}.

Best regards,
{{authorName}}

---
You're receiving this because you subscribed to {{projectName}} updates.
[Unsubscribe]({{unsubscribeUrl}})`,
    variables: [
      'projectName',
      'monthName',
      'year',
      'activityCount',
      'allCommits',
      'latestRelease',
      'latestReleaseNotes',
      'latestReleaseUrl',
      'repositoryUrl',
      'authorName',
      'unsubscribeUrl',
    ],
    tags: ['newsletter', 'monthly', 'email'],
  },
  {
    name: 'Email - Weekly Digest',
    description: 'Weekly email digest of development activity',
    platform: 'EMAIL',
    category: 'digest',
    subject: 'Weekly Update: {{projectName}} - {{weekRange}}',
    content: `Hi!

Here's what happened with {{projectName}} this week:

**{{activity}}**

Recent commits:
{{allCommits|truncate:400}}

{{#if latestPR}}
**Latest Pull Request:**
{{latestPR}}
{{latestPRUrl}}
{{/if}}

See you next week!

{{authorName}}

---
Unsubscribe: {{unsubscribeUrl}}`,
    variables: [
      'projectName',
      'weekRange',
      'activity',
      'allCommits',
      'latestPR',
      'latestPRUrl',
      'authorName',
      'unsubscribeUrl',
    ],
    tags: ['weekly', 'digest', 'email'],
  },
];

/**
 * Default social media templates
 */
export const TWITTER_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Twitter - Development Update',
    description: 'Short update for Twitter',
    platform: 'TWITTER',
    category: 'technical',
    content: `📢 New update to {{repository}}!

{{latestCommit|truncate:100}}

{{commitCount}} commits this week

{{latestCommitUrl}}

#dev #opensource #{{repository}}`,
    subject: undefined,
    variables: ['repository', 'latestCommit', 'commitCount', 'latestCommitUrl'],
    tags: ['twitter', 'social', 'update'],
  },
  {
    name: 'Twitter - Release Announcement',
    description: 'Announce new releases on Twitter',
    platform: 'TWITTER',
    category: 'announcement',
    content: `🚀 {{latestRelease}} is here!

{{latestReleaseNotes|truncate:150}}

Get it now: {{latestReleaseUrl}}

#release #{{repository}}`,
    subject: undefined,
    variables: ['latestRelease', 'latestReleaseNotes', 'latestReleaseUrl', 'repository'],
    tags: ['twitter', 'release', 'announcement'],
  },
];

export const LINKEDIN_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'LinkedIn - Development Update',
    description: 'Professional development update for LinkedIn',
    platform: 'LINKEDIN',
    category: 'technical',
    content: `🚀 {{projectName}} Development Update

This week we've made significant progress with {{commitCount}} commits to {{repository}}.

Key updates:

{{allCommits|truncate:600}}

{{#if latestRelease}}
Latest release: {{latestRelease}}
{{latestReleaseUrl}}
{{/if}}

We're building in public and would love your feedback! Check out the repository: {{repositoryUrl}}

#SoftwareDevelopment #OpenSource #TechUpdate`,
    subject: undefined,
    variables: [
      'projectName',
      'commitCount',
      'repository',
      'allCommits',
      'latestRelease',
      'latestReleaseUrl',
      'repositoryUrl',
    ],
    tags: ['linkedin', 'professional', 'update'],
  },
];

export const FACEBOOK_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Facebook - Community Update',
    description: 'Friendly community update for Facebook',
    platform: 'FACEBOOK',
    category: 'community',
    content: `Hey everyone! 👋

Quick update on {{projectName}}:

We've been busy this week with {{activity}}!

Some highlights:
{{allCommits|truncate:400}}

Want to get involved or learn more? Check us out: {{repositoryUrl}}

Thanks for your support! 🙏`,
    subject: undefined,
    variables: ['projectName', 'activity', 'allCommits', 'repositoryUrl'],
    tags: ['facebook', 'community', 'friendly'],
  },
];

export const REDDIT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Reddit - Project Update',
    description: 'Detailed update post for Reddit communities',
    platform: 'REDDIT',
    category: 'technical',
    content: `**{{projectName}} Update: {{dateLong}}**

Hey r/[community]!

I wanted to share some recent progress on {{repository}}.

**What's New:**

{{allCommits}}

{{#if latestRelease}}
**Latest Release: {{latestRelease}}**

{{latestReleaseNotes}}

{{/if}}

**Stats This Week:**
- {{commitCount}} commits
- {{prCount}} pull requests merged

Check it out: {{repositoryUrl}}

Happy to answer any questions!`,
    subject: undefined,
    variables: [
      'projectName',
      'dateLong',
      'repository',
      'allCommits',
      'latestRelease',
      'latestReleaseNotes',
      'commitCount',
      'prCount',
      'repositoryUrl',
    ],
    tags: ['reddit', 'technical', 'community'],
  },
];

/**
 * Get all default templates
 */
export function getAllDefaultTemplates(): DefaultTemplate[] {
  return [
    ...BLOG_TEMPLATES,
    ...EMAIL_TEMPLATES,
    ...TWITTER_TEMPLATES,
    ...LINKEDIN_TEMPLATES,
    ...FACEBOOK_TEMPLATES,
    ...REDDIT_TEMPLATES,
  ];
}

/**
 * Get default templates for specific platform
 */
export function getDefaultTemplatesForPlatform(platform: string): DefaultTemplate[] {
  return getAllDefaultTemplates().filter((t) => t.platform === platform.toUpperCase());
}

/**
 * Get default template by name
 */
export function getDefaultTemplateByName(name: string): DefaultTemplate | undefined {
  return getAllDefaultTemplates().find((t) => t.name === name);
}

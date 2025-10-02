// Core type definitions for the application

export interface GitHubActivity {
  id: string;
  type: 'push' | 'pull_request' | 'issues' | 'release' | 'star' | 'fork';
  action?: string;
  timestamp: Date;
  actor: {
    login: string;
    avatar_url?: string;
    html_url: string;
  };
  repo: {
    name: string;
    full_name: string;
    html_url: string;
  };
  payload: any;
  processed?: boolean;
  blogPostId?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: Date;
  updatedAt: Date;
  tags: string[];
  githubActivityIds: string[];
  status: 'draft' | 'published' | 'scheduled';
  metadata?: {
    readingTime?: string;
    views?: number;
  };
}

export interface Newsletter {
  id: string;
  subject: string;
  content: string;
  htmlContent: string;
  sentAt?: Date;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipientCount?: number;
  openRate?: number;
  clickRate?: number;
  activities: GitHubActivity[];
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  status: 'active' | 'unsubscribed' | 'bounced';
  preferences?: {
    frequency: 'weekly' | 'monthly';
    topics: string[];
  };
}

export interface AIGenerationConfig {
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
  temperature?: number;
  maxTokens?: number;
  style?: 'technical' | 'casual' | 'professional';
  includeCodeSnippets?: boolean;
  targetAudience?: 'developers' | 'managers' | 'general';
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  metadata?: Record<string, any>;
}
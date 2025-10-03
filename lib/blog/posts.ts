import { kv } from '@/lib/supabase/kv';
import type { BlogPost } from '@/lib/types';
import { prisma } from '@/lib/db';

// Get all published blog posts
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    // Try to get from KV cache first
    const cached = await kv.get<BlogPost[]>('blog:posts:published');
    if (cached) {
      return cached;
    }

    // If not cached, get from database using Prisma
    const content = await prisma.content.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        body: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
        tags: true,
        status: true,
      },
    });

    // Transform to BlogPost format
    const posts: BlogPost[] = content.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug || '',
      content: c.body,
      excerpt: c.excerpt || '',
      publishedAt: c.publishedAt || new Date(),
      updatedAt: c.updatedAt,
      tags: c.tags,
      githubActivityIds: [], // Not stored in new schema
      status: c.status.toLowerCase() as BlogPost['status'],
    }));

    // Cache for 5 minutes
    await kv.set('blog:posts:published', posts, { ex: 300 });

    return posts;
  } catch (error) {
    console.error('Failed to get blog posts:', error);
    // Return empty array as fallback
    return [];
  }
}

// Get a single blog post by slug
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Try cache first
    const cached = await kv.get<BlogPost>(`blog:post:${slug}`);
    if (cached) {
      return cached;
    }

    // Get from database using Prisma
    const content = await prisma.content.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        body: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
        tags: true,
        status: true,
      },
    });

    if (!content) {
      return null;
    }

    // Transform to BlogPost format
    const post: BlogPost = {
      id: content.id,
      title: content.title,
      slug: content.slug || '',
      content: content.body,
      excerpt: content.excerpt || '',
      publishedAt: content.publishedAt || new Date(),
      updatedAt: content.updatedAt,
      tags: content.tags,
      githubActivityIds: [],
      status: content.status.toLowerCase() as BlogPost['status'],
    };

    // Cache for 1 hour
    await kv.set(`blog:post:${slug}`, post, { ex: 3600 });

    // Increment view counter
    await incrementViewCount(post.id);

    return post;
  } catch (error) {
    console.error('Failed to get blog post:', error);
    return null;
  }
}

// Get posts by tag
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const content = await prisma.content.findMany({
      where: {
        status: 'PUBLISHED',
        tags: {
          has: tag,
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        body: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
        tags: true,
        status: true,
      },
    });

    // Transform to BlogPost format
    return content.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug || '',
      content: c.body,
      excerpt: c.excerpt || '',
      publishedAt: c.publishedAt || new Date(),
      updatedAt: c.updatedAt,
      tags: c.tags,
      githubActivityIds: [],
      status: c.status.toLowerCase() as BlogPost['status'],
    }));
  } catch (error) {
    console.error('Failed to get posts by tag:', error);
    return [];
  }
}

// Save a blog post
export async function saveBlogPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  try {
    // Note: This assumes a projectId is available. In production, pass it as a parameter.
    const content = await prisma.content.create({
      data: {
        projectId: '', // TODO: Pass projectId as parameter
        sourceType: 'GITHUB',
        title: post.title,
        slug: post.slug,
        body: post.content,
        rawContent: post.content,
        excerpt: post.excerpt,
        tags: post.tags,
        status: post.status.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
        publishedAt: post.publishedAt,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        body: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
        tags: true,
        status: true,
      },
    });

    const newPost: BlogPost = {
      id: content.id,
      title: content.title,
      slug: content.slug || '',
      content: content.body,
      excerpt: content.excerpt || '',
      publishedAt: content.publishedAt || new Date(),
      updatedAt: content.updatedAt,
      tags: content.tags,
      githubActivityIds: [],
      status: content.status.toLowerCase() as BlogPost['status'],
    };

    // Clear cache
    await kv.del('blog:posts:published');

    return newPost;
  } catch (error) {
    console.error('Failed to save blog post:', error);
    throw error;
  }
}

// Increment view count for a post
async function incrementViewCount(postId: string): Promise<void> {
  try {
    // Get current metadata
    const content = await prisma.content.findUnique({
      where: { id: postId },
      select: { aiMetadata: true },
    });

    const metadata = (content?.aiMetadata as any) || {};
    const currentViews = metadata.views || 0;

    // Update with incremented view count
    await prisma.content.update({
      where: { id: postId },
      data: {
        aiMetadata: {
          ...metadata,
          views: currentViews + 1,
        },
      },
    });
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}
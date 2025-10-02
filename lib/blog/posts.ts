import { kv } from '@vercel/kv';
import type { BlogPost } from '@/lib/types';
import { sql } from '@vercel/postgres';

// Get all published blog posts
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    // Try to get from KV cache first
    const cached = await kv.get<BlogPost[]>('blog:posts:published');
    if (cached) {
      return cached;
    }

    // If not cached, get from database
    const { rows } = await sql<BlogPost>`
      SELECT * FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 50
    `;

    // Cache for 5 minutes
    await kv.set('blog:posts:published', rows, { ex: 300 });

    return rows;
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

    // Get from database
    const { rows } = await sql<BlogPost>`
      SELECT * FROM blog_posts
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    const post = rows[0];

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
    const { rows } = await sql<BlogPost>`
      SELECT * FROM blog_posts
      WHERE status = 'published'
      AND ${tag} = ANY(tags)
      ORDER BY published_at DESC
      LIMIT 50
    `;

    return rows;
  } catch (error) {
    console.error('Failed to get posts by tag:', error);
    return [];
  }
}

// Save a blog post
export async function saveBlogPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  try {
    const id = `post_${Date.now()}`;
    const newPost: BlogPost = {
      id,
      ...post,
    };

    // Save to database
    await sql`
      INSERT INTO blog_posts (
        id, title, slug, content, excerpt, published_at,
        updated_at, tags, github_activity_ids, status
      )
      VALUES (
        ${newPost.id},
        ${newPost.title},
        ${newPost.slug},
        ${newPost.content},
        ${newPost.excerpt},
        ${newPost.publishedAt},
        ${newPost.updatedAt},
        ${newPost.tags},
        ${newPost.githubActivityIds},
        ${newPost.status}
      )
    `;

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
    await sql`
      UPDATE blog_posts
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{views}',
        COALESCE((metadata->>'views')::int, 0)::text::jsonb + 1
      )
      WHERE id = ${postId}
    `;
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
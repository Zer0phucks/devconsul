import { Suspense } from 'react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog/posts';
import { formatDate } from '@/lib/utils';

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="space-y-8">
      <div className="text-center pb-8 border-b">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Development Blog
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Automated insights from our GitHub activity, powered by AI.
          Stay updated with our latest developments, features, and technical deep-dives.
        </p>
      </div>

      <Suspense fallback={<BlogPostsSkeleton />}>
        <BlogPosts posts={posts} />
      </Suspense>
    </div>
  );
}

function BlogPosts({ posts }: { posts: any[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No blog posts yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
        >
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
              {post.title}
            </h2>
          </Link>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {post.metadata?.readingTime && (
              <>
                <span>•</span>
                <span>{post.metadata.readingTime}</span>
              </>
            )}
          </div>

          <p className="text-gray-600 mb-4">{post.excerpt}</p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog/tags/${tag}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Read more →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function BlogPostsSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
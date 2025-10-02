import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { getBlogPost, getBlogPosts } from '@/lib/blog/posts';
import { formatDate } from '@/lib/utils';
import { mdxComponents } from '@/components/blog/mdx-components';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: ['AI Blog Generator'],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-none">
      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <div className="flex items-center space-x-4 text-gray-500 mb-6">
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
          {post.metadata?.readingTime && (
            <>
              <span>•</span>
              <span>{post.metadata.readingTime}</span>
            </>
          )}
          {post.metadata?.views && (
            <>
              <span>•</span>
              <span>{post.metadata.views.toLocaleString()} views</span>
            </>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/blog/tags/${tag}`}
              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200"
            >
              {tag}
            </Link>
          ))}
        </div>
      </header>

      {/* Post Content */}
      <div className="prose prose-gray max-w-none prose-lg prose-headings:font-bold prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-gray-900 prose-pre:text-gray-100">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>

      {/* Post Footer */}
      <footer className="mt-12 pt-8 border-t">
        <div className="flex justify-between items-center">
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Blog
          </Link>

          <div className="flex space-x-4">
            <button
              className="text-gray-500 hover:text-gray-700"
              aria-label="Share on Twitter"
            >
              Share on X
            </button>
            <button
              className="text-gray-500 hover:text-gray-700"
              aria-label="Copy link"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Stay Updated
          </h3>
          <p className="text-gray-600 mb-4">
            Get weekly updates on our development progress delivered to your inbox.
          </p>
          <Link
            href="/newsletter"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Subscribe to Newsletter
          </Link>
        </div>
      </footer>
    </article>
  );
}
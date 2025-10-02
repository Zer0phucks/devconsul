import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

// Custom components for MDX rendering
export const mdxComponents = {
  // Headers
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
  ),

  // Paragraph
  p: ({ children }: { children: ReactNode }) => (
    <p className="mb-4 leading-relaxed">{children}</p>
  ),

  // Links
  a: ({ href, children }: { href?: string; children: ReactNode }) => {
    const isInternal = href?.startsWith('/');
    const isAnchor = href?.startsWith('#');

    if (isInternal || isAnchor) {
      return (
        <Link
          href={href || '#'}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    );
  },

  // Lists
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: ReactNode }) => (
    <li className="ml-4">{children}</li>
  ),

  // Code blocks
  code: ({ children }: { children: ReactNode }) => (
    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: { children: ReactNode }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
      {children}
    </pre>
  ),

  // Blockquote
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
      {children}
    </blockquote>
  ),

  // Images
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;

    return (
      <figure className="my-6">
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={400}
          className="rounded-lg w-full h-auto"
        />
        {alt && (
          <figcaption className="text-sm text-gray-600 mt-2 text-center">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },

  // Tables
  table: ({ children }: { children: ReactNode }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: ReactNode }) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  tbody: ({ children }: { children: ReactNode }) => (
    <tbody className="divide-y divide-gray-200">{children}</tbody>
  ),
  tr: ({ children }: { children: ReactNode }) => (
    <tr className="border-b">{children}</tr>
  ),
  th: ({ children }: { children: ReactNode }) => (
    <th className="px-4 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children: ReactNode }) => (
    <td className="px-4 py-2">{children}</td>
  ),

  // Horizontal rule
  hr: () => <hr className="my-8 border-gray-300" />,

  // Custom components
  Note: ({ children, type = 'info' }: { children: ReactNode; type?: string }) => {
    const colors = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
    };

    return (
      <div className={`p-4 rounded-lg border-l-4 my-4 ${colors[type as keyof typeof colors] || colors.info}`}>
        {children}
      </div>
    );
  },

  CodeBlock: ({ language, children }: { language: string; children: string }) => {
    return (
      <div className="relative group mb-4">
        <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-400 bg-gray-800 rounded-tr-lg">
          {language}
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{children}</code>
        </pre>
      </div>
    );
  },
};
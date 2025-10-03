import { Metadata } from "next"
import fs from "fs"
import path from "path"
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

export const metadata: Metadata = {
  title: "API Reference | Full Self Publishing",
  description: "Complete REST API documentation",
}

async function getDocContent() {
  const filePath = path.join(process.cwd(), "content/docs/api.mdx")
  const fileContent = fs.readFileSync(filePath, "utf8")

  const { content, frontmatter } = await compileMDX({
    source: fileContent,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          rehypeHighlight,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    },
  })

  return { content, frontmatter }
}

export default async function APIPage() {
  const { content } = await getDocContent()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <article className="prose prose-gray dark:prose-invert max-w-none">
        {content}
      </article>
    </div>
  )
}

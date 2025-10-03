import { Metadata } from "next"
import fs from "fs"
import path from "path"
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

export const metadata: Metadata = {
  title: "Video Tutorials | Full Self Publishing",
  description: "Step-by-step video guides",
}

async function getDocContent() {
  const filePath = path.join(process.cwd(), "content/docs/videos.mdx")
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

export default async function Page() {
  try {
    const { content } = await getDocContent()
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-gray dark:prose-invert max-w-none">
          {content}
        </article>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-gray dark:prose-invert max-w-none">
          <h1>Documentation</h1>
          <p>Documentation is being updated. Please check back soon.</p>
        </article>
      </div>
    )
  }
}

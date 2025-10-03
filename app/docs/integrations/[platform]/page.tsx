import { Metadata } from "next"
import fs from "fs"
import path from "path"
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import { notFound } from "next/navigation"

const platforms = ["wordpress", "ghost", "twitter", "linkedin", "medium", "facebook", "reddit", "resend", "sendgrid", "mailchimp", "webhooks"]

export async function generateStaticParams() {
  return platforms.map((platform) => ({
    platform,
  }))
}

export async function generateMetadata({ params }: { params: { platform: string } }): Promise<Metadata> {
  const platformName = params.platform.charAt(0).toUpperCase() + params.platform.slice(1)
  return {
    title: `${platformName} Integration | Full Self Publishing Docs`,
    description: `Connect and publish to ${platformName}`,
  }
}

async function getDocContent(platform: string) {
  const filePath = path.join(process.cwd(), `content/docs/integrations/${platform}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

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

export default async function PlatformIntegrationPage({ params }: { params: { platform: string } }) {
  const docContent = await getDocContent(params.platform)

  if (!docContent) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <article className="prose prose-gray dark:prose-invert max-w-none">
        {docContent.content}
      </article>
    </div>
  )
}

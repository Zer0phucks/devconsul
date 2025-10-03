import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Code,
  FileText,
  HelpCircle,
  Plug,
  Rocket,
  Video,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Documentation | Full Self Publishing",
  description: "Complete documentation for the Full Self Publishing platform",
}

const docSections = [
  {
    title: "Getting Started",
    description: "Quick start guide and platform setup",
    icon: Rocket,
    href: "/docs/getting-started",
    items: [
      "Account Setup",
      "Connect GitHub",
      "First Project",
      "Generate Content",
    ],
  },
  {
    title: "Platform Integrations",
    description: "Connect your publishing platforms",
    icon: Plug,
    href: "/docs/integrations",
    items: [
      "WordPress",
      "Ghost",
      "Medium",
      "Twitter/X",
      "LinkedIn",
      "Facebook",
    ],
  },
  {
    title: "Features Guide",
    description: "Learn about all platform features",
    icon: BookOpen,
    href: "/docs/features",
    items: [
      "Content Generation",
      "Scheduling",
      "Templates",
      "Analytics",
    ],
  },
  {
    title: "API Reference",
    description: "Complete API documentation",
    icon: Code,
    href: "/docs/api",
    items: [
      "Authentication",
      "Endpoints",
      "Webhooks",
      "Rate Limits",
    ],
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    icon: Video,
    href: "/docs/videos",
    items: [
      "Quick Start (2 min)",
      "Platform Setup (5 min)",
      "Content Workflows (7 min)",
    ],
  },
  {
    title: "FAQ",
    description: "Frequently asked questions",
    icon: HelpCircle,
    href: "/docs/faq",
    items: [
      "Account & Billing",
      "Platform Setup",
      "Troubleshooting",
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Everything you need to know about Full Self Publishing
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/docs/getting-started">
              <Rocket className="mr-2 h-4 w-4" />
              Get Started
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/docs/api">
              <Code className="mr-2 h-4 w-4" />
              API Reference
            </Link>
          </Button>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {docSections.map((section) => (
          <Card key={section.href} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{section.title}</CardTitle>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-3 w-3 mr-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" asChild className="w-full">
                <Link href={section.href}>View Documentation</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/docs/getting-started#github"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-1">Connecting Your GitHub Repository</h3>
            <p className="text-sm text-muted-foreground">
              Step-by-step guide to link your first repository
            </p>
          </Link>
          <Link
            href="/docs/integrations/wordpress"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-1">WordPress Integration Setup</h3>
            <p className="text-sm text-muted-foreground">
              Connect and publish to your WordPress site
            </p>
          </Link>
          <Link
            href="/docs/features/scheduling"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-1">Automated Content Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Set up automatic content generation and publishing
            </p>
          </Link>
          <Link
            href="/docs/api#authentication"
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <h3 className="font-semibold mb-1">API Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Learn how to authenticate your API requests
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

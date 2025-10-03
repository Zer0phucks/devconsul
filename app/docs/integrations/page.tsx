import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Platform Integrations | Full Self Publishing Docs",
  description: "Connect Full Self Publishing to your publishing platforms",
}

const integrations = [
  {
    name: "WordPress",
    slug: "wordpress",
    category: "Blog",
    auth: "OAuth / App Password",
    description: "Self-hosted & WordPress.com blogs",
    features: ["Auto-posting", "Featured images", "Categories/Tags", "Custom fields"],
    available: true,
  },
  {
    name: "Ghost",
    slug: "ghost",
    category: "Blog",
    auth: "API Key",
    description: "Modern publishing platform",
    features: ["Draft/Published", "Tags", "Featured posts", "Mobiledoc format"],
    available: true,
  },
  {
    name: "Medium",
    slug: "medium",
    category: "Blog",
    auth: "OAuth",
    description: "Built-in audience network",
    features: ["Stories", "Publications", "Tags", "Canonical URLs"],
    available: false,
  },
  {
    name: "Twitter/X",
    slug: "twitter",
    category: "Social",
    auth: "OAuth 2.0",
    description: "Tweets and threads",
    features: ["Single tweets", "Threads", "Media", "280 char limit"],
    available: true,
  },
  {
    name: "LinkedIn",
    slug: "linkedin",
    category: "Social",
    auth: "OAuth",
    description: "Professional updates",
    features: ["Profile posts", "Company pages", "Articles", "3000 char limit"],
    available: true,
  },
  {
    name: "Facebook",
    slug: "facebook",
    category: "Social",
    auth: "OAuth",
    description: "Pages and groups",
    features: ["Page posts", "Group posts", "Media", "Scheduling"],
    available: false,
  },
  {
    name: "Reddit",
    slug: "reddit",
    category: "Social",
    auth: "OAuth",
    description: "Community posts",
    features: ["Subreddit posts", "Markdown", "Flair", "Link posts"],
    available: false,
  },
  {
    name: "Resend",
    slug: "resend",
    category: "Email",
    auth: "API Key",
    description: "Modern email API",
    features: ["Transactional", "Templates", "Webhooks", "Analytics"],
    available: false,
  },
  {
    name: "SendGrid",
    slug: "sendgrid",
    category: "Email",
    auth: "API Key",
    description: "Enterprise email delivery",
    features: ["Marketing", "Transactional", "Templates", "Analytics"],
    available: false,
  },
  {
    name: "Mailchimp",
    slug: "mailchimp",
    category: "Email",
    auth: "OAuth",
    description: "Marketing automation",
    features: ["Campaigns", "Lists", "Automation", "Analytics"],
    available: false,
  },
  {
    name: "Custom Webhook",
    slug: "webhooks",
    category: "Custom",
    auth: "API Key",
    description: "Custom integrations",
    features: ["Custom endpoints", "Payload customization", "Headers", "Authentication"],
    available: false,
  },
]

const categories = ["Blog", "Social", "Email", "Custom"]

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Platform Integrations</h1>
        <p className="text-xl text-muted-foreground">
          Connect Full Self Publishing to blogs, social media, and email platforms
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{category} Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations
              .filter((integration) => integration.category === category)
              .map((integration) => (
                <Card key={integration.slug} className="relative">
                  {!integration.available && (
                    <Badge variant="secondary" className="absolute top-4 right-4">
                      Coming Soon
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {integration.name}
                      {integration.available && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Authentication</div>
                      <Badge variant="outline">{integration.auth}</Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Features</div>
                      <ul className="space-y-1">
                        {integration.features.map((feature, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {integration.available ? (
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Link href={`/docs/integrations/${integration.slug}`}>
                          View Guide
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" className="w-full" disabled>
                        Documentation Coming Soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-6 border rounded-lg bg-muted/50">
        <h3 className="text-xl font-bold mb-2">Need a Different Integration?</h3>
        <p className="text-muted-foreground mb-4">
          We're constantly adding new platform integrations. Use our Custom Webhook integration for
          platforms not listed here, or request a new integration.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/integrations/webhooks">Custom Webhooks</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">Request Integration</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

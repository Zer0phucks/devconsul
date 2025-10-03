export interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  relatedLinks?: Array<{ title: string; href: string }>
  keywords?: string[]
}

export const faqCategories = [
  { id: "getting-started", name: "Getting Started" },
  { id: "platforms", name: "Platform Integrations" },
  { id: "content", name: "Content Generation" },
  { id: "billing", name: "Billing & Plans" },
  { id: "troubleshooting", name: "Troubleshooting" },
  { id: "api", name: "API & Development" },
]

export const faqData: FAQItem[] = [
  {
    id: "what-is-fsp",
    category: "getting-started",
    question: "What is Full Self Publishing?",
    answer:
      "Full Self Publishing is an automated content generation platform that monitors your GitHub repository activity and uses AI to create platform-specific content (blog posts, social media, newsletters) based on your commits, pull requests, and releases.",
    keywords: ["about", "intro", "overview"],
  },
  {
    id: "how-to-start",
    category: "getting-started",
    question: "How do I get started?",
    answer:
      "1. Sign up for an account\n2. Connect your GitHub repository\n3. Choose which platforms you want to publish to\n4. Set your content generation schedule\n5. Review and approve your first generated content",
    relatedLinks: [
      { title: "Getting Started Guide", href: "/docs/getting-started" },
      { title: "Connect GitHub", href: "/docs/getting-started#github" },
    ],
    keywords: ["start", "begin", "setup", "onboard"],
  },
  {
    id: "github-oauth",
    category: "getting-started",
    question: "Why do I need to connect GitHub?",
    answer:
      "We need access to your repository to read commit messages, pull request descriptions, and release notes. This is the source material our AI uses to generate content. We never modify your code or access private repositories without permission.",
    keywords: ["github", "oauth", "permissions", "access"],
  },
  {
    id: "wordpress-setup",
    category: "platforms",
    question: "How do I connect WordPress?",
    answer:
      "Navigate to Settings > Platforms > WordPress. You'll need to provide your WordPress site URL and authenticate via OAuth. Make sure you have the WordPress Application Passwords plugin enabled or are using WordPress.com.",
    relatedLinks: [
      { title: "WordPress Integration Guide", href: "/docs/integrations/wordpress" },
    ],
    keywords: ["wordpress", "blog", "oauth"],
  },
  {
    id: "twitter-api",
    category: "platforms",
    question: "How do I set up Twitter/X integration?",
    answer:
      "Go to Settings > Platforms > Twitter. You'll need a Twitter Developer account and API v2 credentials (API Key, API Secret, Access Token, Access Token Secret). Follow our guide for detailed setup instructions.",
    relatedLinks: [
      { title: "Twitter Integration Guide", href: "/docs/integrations/twitter" },
    ],
    keywords: ["twitter", "x", "api", "oauth"],
  },
  {
    id: "content-frequency",
    category: "content",
    question: "How often does content get generated?",
    answer:
      "You can set your preferred schedule: daily, weekly, or monthly. The system checks for new GitHub activity at your chosen frequency and generates content only when there are meaningful updates.",
    keywords: ["schedule", "frequency", "automation", "cron"],
  },
  {
    id: "content-quality",
    category: "content",
    question: "Can I edit generated content before publishing?",
    answer:
      "Absolutely! All generated content goes to your review queue first. You can edit, regenerate with different instructions, or discard it entirely. You have full control over what gets published.",
    keywords: ["edit", "review", "approve", "quality"],
  },
  {
    id: "ai-model",
    category: "content",
    question: "Which AI model is used?",
    answer:
      "We primarily use Claude 3.5 Sonnet for content generation, with GPT-4 as a fallback option. You can choose your preferred model in settings. Both models are optimized for creating engaging, platform-specific content.",
    keywords: ["ai", "model", "claude", "gpt"],
  },
  {
    id: "pricing",
    category: "billing",
    question: "What are the pricing plans?",
    answer:
      "We offer a free tier with 10 content generations per month, a Pro plan at $19/month with unlimited generations, and an Enterprise plan with custom pricing for teams. All plans include all platform integrations.",
    keywords: ["price", "cost", "billing", "subscription"],
  },
  {
    id: "api-limits",
    category: "billing",
    question: "Are there API rate limits?",
    answer:
      "Free tier: 100 API calls/day. Pro: 1000 calls/day. Enterprise: Custom limits. API calls reset daily at midnight UTC.",
    relatedLinks: [{ title: "API Documentation", href: "/docs/api" }],
    keywords: ["api", "limits", "rate", "quota"],
  },
  {
    id: "connection-failed",
    category: "troubleshooting",
    question: "Platform connection keeps failing",
    answer:
      "Common solutions:\n1. Verify your API keys are correct\n2. Check that OAuth tokens haven't expired\n3. Ensure your account has publishing permissions\n4. Try disconnecting and reconnecting the platform\n5. Contact support if the issue persists",
    keywords: ["error", "connection", "oauth", "failed"],
  },
  {
    id: "no-content-generated",
    category: "troubleshooting",
    question: "Why isn't content being generated?",
    answer:
      "Check these:\n1. Verify your GitHub repo is connected\n2. Ensure there's been activity since last generation\n3. Check your schedule settings\n4. Review error logs in Settings > Activity Log\n5. Confirm your AI API quota isn't exhausted",
    keywords: ["not working", "no content", "generation failed"],
  },
  {
    id: "api-authentication",
    category: "api",
    question: "How do I authenticate API requests?",
    answer:
      "Use Bearer token authentication. Include your API key in the Authorization header: `Authorization: Bearer YOUR_API_KEY`. Generate API keys in Settings > Developer > API Keys.",
    relatedLinks: [
      { title: "API Authentication", href: "/docs/api#authentication" },
    ],
    keywords: ["api", "auth", "token", "bearer"],
  },
  {
    id: "webhook-setup",
    category: "api",
    question: "Can I use webhooks for custom integrations?",
    answer:
      "Yes! Set up webhooks in Settings > Platforms > Custom Webhook. You can receive POST requests whenever content is generated or published. See our API docs for webhook payload structure.",
    relatedLinks: [{ title: "Webhook Documentation", href: "/docs/api#webhooks" }],
    keywords: ["webhook", "custom", "integration", "api"],
  },
]

export function searchFAQs(query: string): FAQItem[] {
  const lowerQuery = query.toLowerCase()
  return faqData.filter((faq) => {
    const matchesQuestion = faq.question.toLowerCase().includes(lowerQuery)
    const matchesAnswer = faq.answer.toLowerCase().includes(lowerQuery)
    const matchesKeywords =
      faq.keywords?.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) || false
    return matchesQuestion || matchesAnswer || matchesKeywords
  })
}

export function getFAQsByCategory(categoryId: string): FAQItem[] {
  return faqData.filter((faq) => faq.category === categoryId)
}

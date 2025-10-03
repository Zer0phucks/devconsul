import { type PlatformType } from "@/lib/validations/platform-connection"

export interface PlatformMetadata {
  id: PlatformType
  name: string
  description: string
  icon: string
  category: "blog" | "social" | "email"
  authType: "oauth" | "apikey"
  supportsScheduling: boolean
  supportsImages: boolean
  characterLimit?: number
  colors: {
    primary: string
    secondary: string
  }
}

export const platformMetadata: Record<PlatformType, PlatformMetadata> = {
  wordpress: {
    id: "wordpress",
    name: "WordPress",
    description: "Publish blog posts to your WordPress site",
    icon: "📝",
    category: "blog",
    authType: "apikey",
    supportsScheduling: true,
    supportsImages: true,
    colors: { primary: "#21759b", secondary: "#0073aa" },
  },
  ghost: {
    id: "ghost",
    name: "Ghost",
    description: "Publish content to your Ghost publication",
    icon: "👻",
    category: "blog",
    authType: "apikey",
    supportsScheduling: true,
    supportsImages: true,
    colors: { primary: "#15171A", secondary: "#738a94" },
  },
  medium: {
    id: "medium",
    name: "Medium",
    description: "Share stories with Medium's audience",
    icon: "📖",
    category: "blog",
    authType: "oauth",
    supportsScheduling: false,
    supportsImages: true,
    colors: { primary: "#000000", secondary: "#757575" },
  },
  twitter: {
    id: "twitter",
    name: "Twitter/X",
    description: "Post updates and threads to Twitter",
    icon: "🐦",
    category: "social",
    authType: "oauth",
    supportsScheduling: true,
    supportsImages: true,
    characterLimit: 280,
    colors: { primary: "#1DA1F2", secondary: "#14171A" },
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    description: "Share professional content on LinkedIn",
    icon: "💼",
    category: "social",
    authType: "oauth",
    supportsScheduling: true,
    supportsImages: true,
    characterLimit: 3000,
    colors: { primary: "#0A66C2", secondary: "#004182" },
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    description: "Post to Facebook pages and groups",
    icon: "👥",
    category: "social",
    authType: "oauth",
    supportsScheduling: true,
    supportsImages: true,
    characterLimit: 63206,
    colors: { primary: "#1877F2", secondary: "#4267B2" },
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    description: "Submit posts to Reddit communities",
    icon: "🔴",
    category: "social",
    authType: "oauth",
    supportsScheduling: true,
    supportsImages: true,
    characterLimit: 40000,
    colors: { primary: "#FF4500", secondary: "#FF5700" },
  },
  resend: {
    id: "resend",
    name: "Resend",
    description: "Send newsletter emails via Resend",
    icon: "📧",
    category: "email",
    authType: "apikey",
    supportsScheduling: true,
    supportsImages: true,
    colors: { primary: "#000000", secondary: "#333333" },
  },
  sendgrid: {
    id: "sendgrid",
    name: "SendGrid",
    description: "Deliver emails through SendGrid",
    icon: "✉️",
    category: "email",
    authType: "apikey",
    supportsScheduling: true,
    supportsImages: true,
    colors: { primary: "#1A82E2", secondary: "#0E76D8" },
  },
  mailchimp: {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Send campaigns via Mailchimp",
    icon: "🐵",
    category: "email",
    authType: "oauth",
    supportsScheduling: true,
    supportsImages: true,
    colors: { primary: "#FFE01B", secondary: "#000000" },
  },
  webhook: {
    id: "webhook",
    name: "Custom Webhook",
    description: "Send content to any custom webhook endpoint",
    icon: "🔗",
    category: "blog",
    authType: "apikey",
    supportsScheduling: true,
    supportsImages: true,
    colors: { primary: "#6366f1", secondary: "#4f46e5" },
  },
}

export interface ConnectionStatus {
  id: string
  platform: PlatformType
  status: "connected" | "error" | "expired" | "disconnected"
  createdAt: Date
  lastSyncAt?: Date
  errorMessage?: string
  accountInfo?: {
    username?: string
    email?: string
    profileUrl?: string
  }
  settings?: Record<string, any>
}

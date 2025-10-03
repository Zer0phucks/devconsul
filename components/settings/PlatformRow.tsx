"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Globe,
  Mail,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  type LucideIcon
} from "lucide-react"

export type PlatformType =
  | "BLOG"
  | "NEWSLETTER"
  | "TWITTER"
  | "LINKEDIN"
  | "FACEBOOK"
  | "REDDIT"

interface PlatformConfig {
  name: string
  icon: LucideIcon
  color: string
}

const platformConfigs: Record<PlatformType, PlatformConfig> = {
  BLOG: { name: "Blog", icon: Globe, color: "text-purple-600" },
  NEWSLETTER: { name: "Email Newsletter", icon: Mail, color: "text-blue-600" },
  TWITTER: { name: "Twitter/X", icon: Twitter, color: "text-sky-500" },
  LINKEDIN: { name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  FACEBOOK: { name: "Facebook", icon: Facebook, color: "text-blue-600" },
  REDDIT: { name: "Reddit", icon: Send, color: "text-orange-600" },
}

interface PlatformRowProps {
  platform: PlatformType
  isConnected: boolean
  generateEnabled: boolean
  publishEnabled: boolean
  onGenerateChange: (enabled: boolean) => void
  onPublishChange: (enabled: boolean) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export function PlatformRow({
  platform,
  isConnected,
  generateEnabled,
  publishEnabled,
  onGenerateChange,
  onPublishChange,
  onConnect,
  onDisconnect,
}: PlatformRowProps) {
  const config = platformConfigs[platform]
  const Icon = config.icon

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      {/* Platform Name & Icon */}
      <div className="flex items-center gap-3 sm:w-48">
        <div className={`p-2 rounded-lg bg-accent ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium text-sm">{config.name}</span>
      </div>

      {/* Generate Toggle */}
      <div className="flex items-center gap-2 sm:w-32">
        <Switch
          id={`${platform}-generate`}
          checked={generateEnabled}
          onCheckedChange={onGenerateChange}
          aria-label={`Enable content generation for ${config.name}`}
        />
        <Label
          htmlFor={`${platform}-generate`}
          className="text-sm cursor-pointer"
        >
          Generate
        </Label>
      </div>

      {/* Publish Toggle */}
      <div className="flex items-center gap-2 sm:w-32">
        <Switch
          id={`${platform}-publish`}
          checked={publishEnabled}
          onCheckedChange={onPublishChange}
          disabled={!isConnected}
          aria-label={`Enable auto-publish for ${config.name}`}
        />
        <Label
          htmlFor={`${platform}-publish`}
          className={`text-sm ${!isConnected ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
        >
          Publish
        </Label>
      </div>

      {/* Connection Status & Actions */}
      <div className="flex items-center gap-2 sm:ml-auto">
        {isConnected ? (
          <>
            <Badge variant="success" className="text-xs">
              Connected
            </Badge>
            {onDisconnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                className="text-xs h-7"
              >
                Disconnect
              </Button>
            )}
          </>
        ) : (
          <>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Not Connected
            </Badge>
            {onConnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConnect}
                className="text-xs h-7"
              >
                Connect
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

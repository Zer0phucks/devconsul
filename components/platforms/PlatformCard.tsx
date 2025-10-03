"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, TrendingUp, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ConnectionStatus } from "./ConnectionStatus"
import { PlatformSettings } from "./PlatformSettings"
import { platformMetadata, type ConnectionStatus as ConnectionStatusType } from "@/lib/types/platforms"
import type { PlatformType } from "@/lib/validations/platform-connection"

interface PlatformCardProps {
  platform: PlatformType
  connection?: ConnectionStatusType
  stats?: {
    postsPublished?: number
    emailsSent?: number
    lastActivity?: Date
  }
  onConnect: () => void
  onDisconnect: () => void
  onReconnect: () => void
  onSaveSettings: (settings: Record<string, any>) => Promise<void>
  onConfigure?: () => void
}

export function PlatformCard({
  platform,
  connection,
  stats,
  onConnect,
  onDisconnect,
  onReconnect,
  onSaveSettings,
  onConfigure,
}: PlatformCardProps) {
  const metadata = platformMetadata[platform]
  const isConnected = connection?.status === "connected"

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{
                backgroundColor: `${metadata.colors.primary}15`,
                color: metadata.colors.primary,
              }}
            >
              {metadata.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{metadata.name}</h3>
              <p className="text-sm text-gray-600">{metadata.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {metadata.category}
          </Badge>
        </div>

        {/* Connection Status */}
        <ConnectionStatus
          connection={connection}
          platformName={metadata.name}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onReconnect={onReconnect}
        />
      </div>

      {/* Stats Section */}
      {isConnected && stats && (
        <>
          <Separator />
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {stats.postsPublished !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Send className="h-3 w-3" />
                    <span>Posts Published</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.postsPublished}</p>
                </div>
              )}
              {stats.emailsSent !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Send className="h-3 w-3" />
                    <span>Emails Sent</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.emailsSent}</p>
                </div>
              )}
              {stats.lastActivity && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>Last Activity</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDistanceToNow(stats.lastActivity, { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Settings Panel */}
      {isConnected && (
        <>
          <Separator />
          <div className="p-4">
            <PlatformSettings
              platform={platform}
              currentSettings={connection?.settings}
              onSave={onSaveSettings}
            />
          </div>
        </>
      )}

      {/* Actions Footer */}
      {isConnected && onConfigure && (
        <>
          <Separator />
          <div className="p-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={onConfigure}>
              <Settings className="mr-2 h-4 w-4" />
              Advanced Settings
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

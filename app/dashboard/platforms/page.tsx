"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { PlatformCard } from "@/components/platforms/PlatformCard"
import { OAuthConnectModal } from "@/components/platforms/OAuthConnectModal"
import { ApiKeyForm } from "@/components/platforms/ApiKeyForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { platformMetadata } from "@/lib/types/platforms"
import type { PlatformType } from "@/lib/validations/platform-connection"
import type { ConnectionStatus } from "@/lib/types/platforms"

export default function PlatformsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null)
  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)

  // Mock connections - replace with actual data from API/database
  const [connections, setConnections] = useState<ConnectionStatus[]>([
    {
      id: "1",
      platform: "twitter",
      status: "connected",
      createdAt: new Date("2025-09-01"),
      lastSyncAt: new Date("2025-10-01"),
      accountInfo: {
        username: "@yourusername",
        email: "you@example.com",
        profileUrl: "https://twitter.com/yourusername",
      },
      settings: {
        includeHashtags: true,
        hashtags: "#tech, #innovation",
      },
    },
  ])

  const handleAddPlatform = (platform: PlatformType) => {
    setSelectedPlatform(platform)
    const metadata = platformMetadata[platform]

    if (metadata.authType === "oauth") {
      setShowOAuthModal(true)
    } else {
      setShowApiKeyDialog(true)
    }
  }

  const handleOAuthInitiate = async (platform: PlatformType): Promise<string> => {
    // Generate OAuth URL - implement actual OAuth flow
    const state = crypto.randomUUID()
    const redirectUri = `${window.location.origin}/auth/oauth/callback/${platform}`

    // Store state in localStorage for CSRF validation
    localStorage.setItem(`oauth_state_${platform}`, state)

    // Return mock OAuth URL - replace with actual platform URLs
    return `/api/auth/oauth/${platform}?state=${state}&redirect_uri=${redirectUri}`
  }

  const handleApiKeySubmit = async (data: Record<string, string>) => {
    if (!selectedPlatform) return

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Add new connection
    const newConnection: ConnectionStatus = {
      id: crypto.randomUUID(),
      platform: selectedPlatform,
      status: "connected",
      createdAt: new Date(),
      accountInfo: {
        email: data.fromEmail || data.email,
      },
      settings: data,
    }

    setConnections([...connections, newConnection])
    setShowApiKeyDialog(false)
    setSelectedPlatform(null)
  }

  const handleTestConnection = async (data: Record<string, string>): Promise<boolean> => {
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return true
  }

  const handleDisconnect = async (platformId: string) => {
    setConnections(connections.filter((c) => c.id !== platformId))
  }

  const handleReconnect = async (platform: PlatformType) => {
    handleAddPlatform(platform)
  }

  const handleSaveSettings = async (
    platformId: string,
    settings: Record<string, any>
  ) => {
    setConnections(
      connections.map((c) =>
        c.id === platformId ? { ...c, settings: { ...c.settings, ...settings } } : c
      )
    )
  }

  const getConnectionByPlatform = (platform: PlatformType) =>
    connections.find((c) => c.platform === platform)

  const blogPlatforms: PlatformType[] = ["wordpress", "ghost", "medium", "webhook"]
  const socialPlatforms: PlatformType[] = ["twitter", "linkedin", "facebook", "reddit"]
  const emailPlatforms: PlatformType[] = ["resend", "sendgrid", "mailchimp"]

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Platform Connections</h1>
            <p className="text-gray-600">
              Connect and manage your publishing platforms
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Platform
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Blog Platforms</DropdownMenuLabel>
              {blogPlatforms.map((platform) => (
                <DropdownMenuItem
                  key={platform}
                  onClick={() => handleAddPlatform(platform)}
                >
                  <span className="mr-2">{platformMetadata[platform].icon}</span>
                  {platformMetadata[platform].name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Social Media</DropdownMenuLabel>
              {socialPlatforms.map((platform) => (
                <DropdownMenuItem
                  key={platform}
                  onClick={() => handleAddPlatform(platform)}
                >
                  <span className="mr-2">{platformMetadata[platform].icon}</span>
                  {platformMetadata[platform].name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Email Services</DropdownMenuLabel>
              {emailPlatforms.map((platform) => (
                <DropdownMenuItem
                  key={platform}
                  onClick={() => handleAddPlatform(platform)}
                >
                  <span className="mr-2">{platformMetadata[platform].icon}</span>
                  {platformMetadata[platform].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Blog Platforms */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Blog Platforms</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {blogPlatforms.map((platform) => (
            <PlatformCard
              key={platform}
              platform={platform}
              connection={getConnectionByPlatform(platform)}
              stats={{
                postsPublished: Math.floor(Math.random() * 100),
                lastActivity: new Date(),
              }}
              onConnect={() => handleAddPlatform(platform)}
              onDisconnect={() => {
                const conn = getConnectionByPlatform(platform)
                if (conn) handleDisconnect(conn.id)
              }}
              onReconnect={() => handleReconnect(platform)}
              onSaveSettings={async (settings) => {
                const conn = getConnectionByPlatform(platform)
                if (conn) await handleSaveSettings(conn.id, settings)
              }}
            />
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Social Media */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Social Media</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {socialPlatforms.map((platform) => (
            <PlatformCard
              key={platform}
              platform={platform}
              connection={getConnectionByPlatform(platform)}
              stats={{
                postsPublished: Math.floor(Math.random() * 50),
                lastActivity: new Date(),
              }}
              onConnect={() => handleAddPlatform(platform)}
              onDisconnect={() => {
                const conn = getConnectionByPlatform(platform)
                if (conn) handleDisconnect(conn.id)
              }}
              onReconnect={() => handleReconnect(platform)}
              onSaveSettings={async (settings) => {
                const conn = getConnectionByPlatform(platform)
                if (conn) await handleSaveSettings(conn.id, settings)
              }}
            />
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Email Services */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Email Services</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {emailPlatforms.map((platform) => (
            <PlatformCard
              key={platform}
              platform={platform}
              connection={getConnectionByPlatform(platform)}
              stats={{
                emailsSent: Math.floor(Math.random() * 1000),
                lastActivity: new Date(),
              }}
              onConnect={() => handleAddPlatform(platform)}
              onDisconnect={() => {
                const conn = getConnectionByPlatform(platform)
                if (conn) handleDisconnect(conn.id)
              }}
              onReconnect={() => handleReconnect(platform)}
              onSaveSettings={async (settings) => {
                const conn = getConnectionByPlatform(platform)
                if (conn) await handleSaveSettings(conn.id, settings)
              }}
            />
          ))}
        </div>
      </section>

      {/* OAuth Modal */}
      {selectedPlatform && (
        <OAuthConnectModal
          open={showOAuthModal}
          onOpenChange={setShowOAuthModal}
          platform={selectedPlatform}
          onInitiateOAuth={handleOAuthInitiate}
        />
      )}

      {/* API Key Dialog */}
      {selectedPlatform && (
        <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{platformMetadata[selectedPlatform].icon}</span>
                Connect {platformMetadata[selectedPlatform].name}
              </DialogTitle>
              <DialogDescription>
                {platformMetadata[selectedPlatform].description}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ApiKeyForm
                platform={selectedPlatform}
                onSubmit={handleApiKeySubmit}
                onTestConnection={handleTestConnection}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

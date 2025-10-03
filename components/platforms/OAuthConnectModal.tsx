"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Shield } from "lucide-react"
import { platformMetadata } from "@/lib/types/platforms"
import type { PlatformType } from "@/lib/validations/platform-connection"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OAuthConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: PlatformType
  onInitiateOAuth: (platform: PlatformType) => Promise<string>
}

export function OAuthConnectModal({
  open,
  onOpenChange,
  platform,
  onInitiateOAuth,
}: OAuthConnectModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const metadata = platformMetadata[platform]

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const authUrl = await onInitiateOAuth(platform)
      // Redirect to OAuth provider
      window.location.href = authUrl
    } catch (error) {
      console.error("OAuth initiation failed:", error)
      setIsConnecting(false)
    }
  }

  const instructions: Record<PlatformType, string[]> = {
    twitter: [
      "You'll be redirected to Twitter/X to authorize access",
      "Grant permissions to post updates and read account information",
      "You'll be redirected back after authorization",
    ],
    linkedin: [
      "Authorize access to your LinkedIn profile",
      "Choose whether to post as yourself or a company page",
      "Grant posting and profile reading permissions",
    ],
    facebook: [
      "Connect your Facebook account",
      "Select which pages or groups to manage",
      "Grant publishing permissions",
    ],
    reddit: [
      "Authorize access to your Reddit account",
      "Grant permissions to submit posts",
      "Select default subreddit preferences",
    ],
    medium: [
      "Connect your Medium account",
      "Grant story publishing permissions",
      "Select publication if applicable",
    ],
    mailchimp: [
      "Authorize Mailchimp access",
      "Select your audience/list",
      "Grant campaign management permissions",
    ],
    wordpress: [],
    ghost: [],
    resend: [],
    sendgrid: [],
    webhook: [],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{metadata.icon}</span>
            Connect to {metadata.name}
          </DialogTitle>
          <DialogDescription>{metadata.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your credentials are encrypted and never shared. You can revoke access at any
              time.
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          {instructions[platform]?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">What happens next:</h4>
              <ol className="space-y-1 text-sm text-gray-600">
                {instructions[platform].map((instruction, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="font-medium text-gray-900">{index + 1}.</span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
            size="lg"
            style={{
              backgroundColor: metadata.colors.primary,
              color: metadata.colors.primary === "#FFE01B" ? "#000" : "#fff",
            }}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect to {metadata.name}
              </>
            )}
          </Button>

          {/* Cancel */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

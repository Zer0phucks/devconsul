"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { platformMetadata } from "@/lib/types/platforms"
import type { PlatformType } from "@/lib/validations/platform-connection"

type CallbackStatus = "loading" | "success" | "error" | "security_error"

export default function OAuthCallbackPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const platform = params.platform as PlatformType
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const [status, setStatus] = useState<CallbackStatus>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      // User denied authorization
      if (error) {
        setStatus("error")
        setMessage(errorDescription || "Authorization was denied")
        return
      }

      // Missing authorization code
      if (!code) {
        setStatus("error")
        setMessage("No authorization code received")
        return
      }

      // CSRF protection - validate state parameter
      const storedState = localStorage.getItem(`oauth_state_${platform}`)
      if (!state || state !== storedState) {
        setStatus("security_error")
        setMessage("Invalid state parameter - possible CSRF attack")
        return
      }

      // Clear stored state
      localStorage.removeItem(`oauth_state_${platform}`)

      try {
        // Exchange authorization code for access token
        const response = await fetch(`/api/auth/oauth/${platform}/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/oauth/callback/${platform}`,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to exchange authorization code")
        }

        const data = await response.json()

        // Store connection data
        setStatus("success")
        setMessage(`Successfully connected to ${platformMetadata[platform].name}`)

        // Redirect to platforms page after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/platforms")
        }, 2000)
      } catch (err) {
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Failed to complete OAuth flow")
      }
    }

    handleCallback()
  }, [code, state, error, errorDescription, platform, router])

  const metadata = platform ? platformMetadata[platform] : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          {/* Platform Icon */}
          {metadata && (
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl"
              style={{
                backgroundColor: `${metadata.colors.primary}15`,
                color: metadata.colors.primary,
              }}
            >
              {metadata.icon}
            </div>
          )}

          {/* Status Messages */}
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
              <h2 className="text-2xl font-bold">Connecting...</h2>
              <p className="text-gray-600">
                Completing your {metadata?.name} connection
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-700">
                Connection Successful!
              </h2>
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-500">
                Redirecting you to platforms dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-2xl font-bold text-red-700">Connection Failed</h2>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/platforms")}
                  className="flex-1"
                >
                  Back to Platforms
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}

          {status === "security_error" && (
            <>
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
              <h2 className="text-2xl font-bold text-yellow-700">
                Security Error
              </h2>
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Validation Failed</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600">
                This connection attempt has been blocked for your security. Please try
                connecting again from the platforms page.
              </p>
              <Button
                variant="default"
                onClick={() => router.push("/dashboard/platforms")}
                className="w-full"
              >
                Back to Platforms
              </Button>
            </>
          )}

          {/* Debug Info (development only) */}
          {process.env.NODE_ENV === "development" && (
            <details className="text-left text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(
                  {
                    platform,
                    code: code?.substring(0, 10) + "...",
                    state: state?.substring(0, 10) + "...",
                    error,
                    errorDescription,
                    status,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  )
}

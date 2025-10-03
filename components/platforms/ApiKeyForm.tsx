"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PlatformType } from "@/lib/validations/platform-connection"

interface ApiKeyFormProps {
  platform: PlatformType
  onSubmit: (data: Record<string, string>) => Promise<void>
  onTestConnection?: (data: Record<string, string>) => Promise<boolean>
}

const platformLabels: Record<string, { apiKey: string; additionalFields?: Array<{ name: string; label: string; type?: string }> }> = {
  ghost: {
    apiKey: "Admin API Key",
    additionalFields: [
      { name: "siteUrl", label: "Site URL", type: "url" },
      { name: "authorName", label: "Author Name" },
    ],
  },
  resend: {
    apiKey: "API Key",
    additionalFields: [
      { name: "fromName", label: "From Name" },
      { name: "fromEmail", label: "From Email", type: "email" },
      { name: "replyTo", label: "Reply-To Email", type: "email" },
    ],
  },
  sendgrid: {
    apiKey: "API Key",
    additionalFields: [
      { name: "fromName", label: "From Name" },
      { name: "fromEmail", label: "From Email", type: "email" },
      { name: "replyTo", label: "Reply-To Email", type: "email" },
    ],
  },
  wordpress: {
    apiKey: "Application Password",
    additionalFields: [
      { name: "siteUrl", label: "Site URL", type: "url" },
      { name: "username", label: "Username" },
      { name: "defaultCategory", label: "Default Category" },
    ],
  },
  webhook: {
    apiKey: "Auth Token (Optional)",
    additionalFields: [
      { name: "endpointUrl", label: "Endpoint URL", type: "url" },
      { name: "httpMethod", label: "HTTP Method" },
    ],
  },
}

export function ApiKeyForm({ platform, onSubmit, onTestConnection }: ApiKeyFormProps) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const config = platformLabels[platform] || { apiKey: "API Key" }

  // Build dynamic schema
  const schemaFields: Record<string, z.ZodString> = {
    apiKey: z.string().min(1, `${config.apiKey} is required`),
  }

  config.additionalFields?.forEach(field => {
    if (field.type === "email") {
      schemaFields[field.name] = z.string().email(`Invalid ${field.label.toLowerCase()}`)
    } else if (field.type === "url") {
      schemaFields[field.name] = z.string().url(`Invalid ${field.label.toLowerCase()}`)
    } else {
      schemaFields[field.name] = z.string().optional()
    }
  })

  const formSchema = z.object(schemaFields)
  type FormData = z.infer<typeof formSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const copyToClipboard = async () => {
    const apiKey = getValues("apiKey")
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTestConnection = async () => {
    if (!onTestConnection) return

    setIsTesting(true)
    setTestResult(null)
    setErrorMessage(null)

    try {
      const data = getValues()
      const success = await onTestConnection(data as Record<string, string>)
      setTestResult(success ? "success" : "error")
      if (!success) {
        setErrorMessage("Connection test failed. Please verify your credentials.")
      }
    } catch (error) {
      setTestResult("error")
      setErrorMessage(error instanceof Error ? error.message : "Connection test failed")
    } finally {
      setIsTesting(false)
    }
  }

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await onSubmit(data as Record<string, string>)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save connection")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* API Key Field */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">{config.apiKey}</Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showKey ? "text" : "password"}
            placeholder={`Enter your ${config.apiKey.toLowerCase()}`}
            {...register("apiKey")}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {errors.apiKey && (
          <p className="text-sm text-red-500">{errors.apiKey.message}</p>
        )}
      </div>

      {/* Additional Fields */}
      {config.additionalFields?.map(field => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type || "text"}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            {...register(field.name as keyof FormData)}
          />
          {errors[field.name as keyof FormData] && (
            <p className="text-sm text-red-500">
              {errors[field.name as keyof FormData]?.message}
            </p>
          )}
        </div>
      ))}

      {/* Encryption Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your API key will be encrypted and stored securely. We never log or expose your
          credentials.
        </AlertDescription>
      </Alert>

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult === "success" ? "success" : "destructive"}>
          {testResult === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {testResult === "success"
              ? "Connection test successful!"
              : errorMessage || "Connection test failed"}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onTestConnection && (
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || isSubmitting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isTesting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Connect"
          )}
        </Button>
      </div>
    </form>
  )
}

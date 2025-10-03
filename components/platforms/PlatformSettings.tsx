"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react"
import type { PlatformType } from "@/lib/validations/platform-connection"

interface PlatformSettingsProps {
  platform: PlatformType
  currentSettings?: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<void>
}

export function PlatformSettings({
  platform,
  currentSettings = {},
  onSave,
}: PlatformSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: currentSettings,
  })

  const onSubmit = async (data: Record<string, any>) => {
    setIsSaving(true)
    try {
      await onSave(data)
    } finally {
      setIsSaving(false)
    }
  }

  const renderSettingsFields = () => {
    switch (platform) {
      case "wordpress":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                type="url"
                placeholder="https://yourblog.com"
                {...register("siteUrl")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCategory">Default Category</Label>
              <Input
                id="defaultCategory"
                placeholder="Uncategorized"
                {...register("defaultCategory")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTags">Default Tags (comma-separated)</Label>
              <Input
                id="defaultTags"
                placeholder="blog, news, updates"
                {...register("defaultTags")}
              />
            </div>
          </>
        )

      case "ghost":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                type="url"
                placeholder="https://yourblog.ghost.io"
                {...register("siteUrl")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorName">Author Name</Label>
              <Input id="authorName" {...register("authorName")} />
            </div>
          </>
        )

      case "medium":
        return (
          <div className="space-y-2">
            <Label htmlFor="publicationId">Publication (Optional)</Label>
            <Select
              value={watch("publicationId") || "personal"}
              onValueChange={(value) => setValue("publicationId", value)}
            >
              <SelectTrigger id="publicationId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal Account</SelectItem>
                <SelectItem value="pub1">Publication 1</SelectItem>
                <SelectItem value="pub2">Publication 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case "twitter":
        return (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="includeHashtags">Include Hashtags</Label>
              <Switch
                id="includeHashtags"
                checked={watch("includeHashtags") || false}
                onCheckedChange={(checked) => setValue("includeHashtags", checked)}
              />
            </div>
            {watch("includeHashtags") && (
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                <Input
                  id="hashtags"
                  placeholder="#tech, #innovation, #ai"
                  {...register("hashtags")}
                />
              </div>
            )}
          </>
        )

      case "linkedin":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="postAs">Post As</Label>
              <Select
                value={watch("postAs") || "personal"}
                onValueChange={(value) => setValue("postAs", value)}
              >
                <SelectTrigger id="postAs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Profile</SelectItem>
                  <SelectItem value="company">Company Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {watch("postAs") === "company" && (
              <div className="space-y-2">
                <Label htmlFor="companyId">Company Page</Label>
                <Select
                  value={watch("companyId")}
                  onValueChange={(value) => setValue("companyId", value)}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder="Select company page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company1">Company 1</SelectItem>
                    <SelectItem value="company2">Company 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )

      case "facebook":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="targetType">Target</Label>
              <Select
                value={watch("targetType") || "page"}
                onValueChange={(value) => setValue("targetType", value)}
              >
                <SelectTrigger id="targetType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetId">
                {watch("targetType") === "page" ? "Page" : "Group"}
              </Label>
              <Select
                value={watch("pageId") || watch("groupId")}
                onValueChange={(value) =>
                  setValue(watch("targetType") === "page" ? "pageId" : "groupId", value)
                }
              >
                <SelectTrigger id="targetId">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="target1">Target 1</SelectItem>
                  <SelectItem value="target2">Target 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      case "reddit":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="defaultSubreddit">Default Subreddit</Label>
              <Input
                id="defaultSubreddit"
                placeholder="r/technology"
                {...register("defaultSubreddit")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flair">Flair (Optional)</Label>
              <Input id="flair" placeholder="Discussion" {...register("flair")} />
            </div>
          </>
        )

      case "resend":
      case "sendgrid":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input id="fromName" placeholder="Your Name" {...register("fromName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                {...register("fromEmail")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="support@yourdomain.com"
                {...register("replyTo")}
              />
            </div>
          </>
        )

      case "mailchimp":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="audienceId">Audience</Label>
              <Select
                value={watch("audienceId")}
                onValueChange={(value) => setValue("audienceId", value)}
              >
                <SelectTrigger id="audienceId">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aud1">Main List</SelectItem>
                  <SelectItem value="aud2">Newsletter Subscribers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignPrefix">Campaign Name Prefix</Label>
              <Input
                id="campaignPrefix"
                placeholder="Newsletter -"
                {...register("campaignPrefix")}
              />
            </div>
          </>
        )

      case "webhook":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpointUrl">Endpoint URL</Label>
              <Input
                id="endpointUrl"
                type="url"
                placeholder="https://api.example.com/webhook"
                {...register("endpointUrl")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="httpMethod">HTTP Method</Label>
              <Select
                value={watch("httpMethod") || "POST"}
                onValueChange={(value) => setValue("httpMethod", value)}
              >
                <SelectTrigger id="httpMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headers">Custom Headers (JSON)</Label>
              <Textarea
                id="headers"
                placeholder='{"Authorization": "Bearer token"}'
                {...register("headers")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payloadTemplate">Payload Template (JSON)</Label>
              <Textarea
                id="payloadTemplate"
                placeholder='{"title": "{{title}}", "content": "{{content}}"}'
                {...register("payloadTemplate")}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureSecret">HMAC Signature Secret</Label>
              <Input
                id="signatureSecret"
                type="password"
                placeholder="Optional signature secret"
                {...register("signatureSecret")}
              />
            </div>
          </>
        )

      default:
        return (
          <p className="text-sm text-gray-500">
            No additional settings available for this platform
          </p>
        )
    }
  }

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">Platform Settings</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <>
          <Separator />
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {renderSettingsFields()}

            <div className="pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  )
}

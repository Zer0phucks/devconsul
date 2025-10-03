"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlatformRow, type PlatformType } from "@/components/settings/PlatformRow"
import { FrequencySelector, type FrequencyType } from "@/components/settings/FrequencySelector"
import { BrandVoiceSettings, type ToneType } from "@/components/settings/BrandVoiceSettings"
import { ActivityFilters, type EventType, type BranchFilter } from "@/components/settings/ActivityFilters"
import type { ContentSettings } from "@/lib/validations/settings"
import { useToast } from "@/components/ui/use-toast"

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<ContentSettings | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [resolvedParams.id])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}/settings`)
      if (!response.ok) throw new Error("Failed to fetch settings")

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      setHasChanges(false)
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        return
      }
    }
    fetchSettings() // Reset to saved state
    setHasChanges(false)
  }

  // Platform handlers
  const updatePlatform = (platformType: PlatformType, updates: Partial<any>) => {
    if (!settings) return

    const updatedPlatforms = settings.platforms.map((p) =>
      p.type === platformType ? { ...p, ...updates } : p
    )

    setSettings({ ...settings, platforms: updatedPlatforms })
    setHasChanges(true)
  }

  // Schedule handlers
  const updateSchedule = (updates: Partial<typeof settings.schedule>) => {
    if (!settings) return
    setSettings({ ...settings, schedule: { ...settings.schedule, ...updates } })
    setHasChanges(true)
  }

  // Brand voice handlers
  const updateBrandVoice = (updates: Partial<typeof settings.brandVoice>) => {
    if (!settings) return
    setSettings({ ...settings, brandVoice: { ...settings.brandVoice, ...updates } })
    setHasChanges(true)
  }

  // Activity filters handlers
  const updateActivityFilters = (updates: Partial<typeof settings.activityFilters>) => {
    if (!settings) return
    setSettings({ ...settings, activityFilters: { ...settings.activityFilters, ...updates } })
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (!settings) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings not found</h2>
          <p className="text-gray-600 mb-6">Unable to load project settings.</p>
          <Button onClick={() => router.push(`/dashboard/projects/${resolvedParams.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push(`/dashboard/projects/${resolvedParams.id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Project Settings
              </h1>
              <p className="text-gray-600">
                Configure content generation and publishing automation
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!hasChanges || isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={!hasChanges || isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic project configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  General settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Platform Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
                <CardDescription>
                  Enable content generation and publishing for each platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {settings.platforms.map((platform) => (
                  <PlatformRow
                    key={platform.type}
                    platform={platform.type as PlatformType}
                    isConnected={platform.isConnected}
                    generateEnabled={platform.generateEnabled}
                    publishEnabled={platform.publishEnabled}
                    onGenerateChange={(enabled) =>
                      updatePlatform(platform.type as PlatformType, { generateEnabled: enabled })
                    }
                    onPublishChange={(enabled) =>
                      updatePlatform(platform.type as PlatformType, { publishEnabled: enabled })
                    }
                    onConnect={() => {
                      toast({
                        title: "Coming Soon",
                        description: `${platform.type} integration will be available soon.`,
                      })
                    }}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Cron Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Content Generation Schedule</CardTitle>
                <CardDescription>
                  Set when to automatically generate content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrequencySelector
                  frequency={settings.schedule.frequency as FrequencyType}
                  time={settings.schedule.time}
                  timezone={settings.schedule.timezone}
                  onFrequencyChange={(frequency) => updateSchedule({ frequency })}
                  onTimeChange={(time) => updateSchedule({ time })}
                  onTimezoneChange={(timezone) => updateSchedule({ timezone })}
                />
              </CardContent>
            </Card>

            {/* Brand Voice */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Voice</CardTitle>
                <CardDescription>
                  Define your brand voice and content style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandVoiceSettings
                  tone={settings.brandVoice.tone as ToneType}
                  targetAudience={settings.brandVoice.targetAudience}
                  messagingThemes={settings.brandVoice.messagingThemes}
                  customInstructions={settings.brandVoice.customInstructions || ""}
                  onToneChange={(tone) => updateBrandVoice({ tone })}
                  onTargetAudienceChange={(targetAudience) =>
                    updateBrandVoice({ targetAudience })
                  }
                  onMessagingThemesChange={(messagingThemes) =>
                    updateBrandVoice({ messagingThemes })
                  }
                  onCustomInstructionsChange={(customInstructions) =>
                    updateBrandVoice({ customInstructions })
                  }
                />
              </CardContent>
            </Card>

            {/* Activity Filters */}
            <Card>
              <CardHeader>
                <CardTitle>GitHub Activity Filters</CardTitle>
                <CardDescription>
                  Control which GitHub activities are included in content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFilters
                  enabledEvents={settings.activityFilters.enabledEvents as EventType[]}
                  contributorFilter={settings.activityFilters.contributorFilter}
                  branchFilter={settings.activityFilters.branchFilter as BranchFilter}
                  customBranch={settings.activityFilters.customBranch}
                  onEventsChange={(enabledEvents) =>
                    updateActivityFilters({ enabledEvents })
                  }
                  onContributorChange={(contributorFilter) =>
                    updateActivityFilters({ contributorFilter })
                  }
                  onBranchFilterChange={(branchFilter) =>
                    updateActivityFilters({ branchFilter })
                  }
                  onCustomBranchChange={(customBranch) =>
                    updateActivityFilters({ customBranch })
                  }
                  contributors={[]} // TODO: Fetch from GitHub API
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Integrations</CardTitle>
                <CardDescription>
                  Connect and manage external platform integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Platform integrations coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="fixed bottom-4 right-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-yellow-900">
              You have unsaved changes
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Don't forget to save your settings before leaving
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

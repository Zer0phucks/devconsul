"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

export type ToneType =
  | "professional"
  | "casual"
  | "technical"
  | "friendly"
  | "authoritative"

const toneOptions: { value: ToneType; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Formal and business-oriented" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational" },
  { value: "technical", label: "Technical", description: "Detailed and precise" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "authoritative", label: "Authoritative", description: "Expert and confident" },
]

interface BrandVoiceSettingsProps {
  tone: ToneType
  targetAudience: string
  messagingThemes: string[]
  customInstructions: string
  onToneChange: (tone: ToneType) => void
  onTargetAudienceChange: (audience: string) => void
  onMessagingThemesChange: (themes: string[]) => void
  onCustomInstructionsChange: (instructions: string) => void
}

export function BrandVoiceSettings({
  tone,
  targetAudience,
  messagingThemes,
  customInstructions,
  onToneChange,
  onTargetAudienceChange,
  onMessagingThemesChange,
  onCustomInstructionsChange,
}: BrandVoiceSettingsProps) {
  const [newTheme, setNewTheme] = useState("")

  const handleAddTheme = () => {
    const trimmed = newTheme.trim()
    if (trimmed && !messagingThemes.includes(trimmed)) {
      onMessagingThemesChange([...messagingThemes, trimmed])
      setNewTheme("")
    }
  }

  const handleRemoveTheme = (themeToRemove: string) => {
    onMessagingThemesChange(messagingThemes.filter(theme => theme !== themeToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTheme()
    }
  }

  const charCount = customInstructions.length
  const maxChars = 500

  return (
    <div className="space-y-6">
      {/* Tone Selector */}
      <div className="space-y-2">
        <Label htmlFor="tone">Content Tone</Label>
        <Select value={tone} onValueChange={(value) => onToneChange(value as ToneType)}>
          <SelectTrigger id="tone">
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            {toneOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="target-audience">Target Audience</Label>
        <Input
          id="target-audience"
          type="text"
          placeholder="e.g., software developers, startup founders"
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Who is your primary audience?
        </p>
      </div>

      {/* Messaging Themes */}
      <div className="space-y-2">
        <Label htmlFor="messaging-themes">Key Messaging Themes</Label>
        <div className="flex gap-2">
          <Input
            id="messaging-themes"
            type="text"
            placeholder="Add a theme (e.g., innovation, open source)"
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTheme}
            disabled={!newTheme.trim()}
          >
            Add
          </Button>
        </div>

        {messagingThemes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {messagingThemes.map((theme) => (
              <Badge key={theme} variant="secondary" className="pl-3 pr-1">
                {theme}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1 hover:bg-transparent"
                  onClick={() => handleRemoveTheme(theme)}
                  aria-label={`Remove ${theme}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Main themes to emphasize in content (max 10)
        </p>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-2">
        <Label htmlFor="custom-instructions">
          Custom Instructions (Optional)
        </Label>
        <Textarea
          id="custom-instructions"
          placeholder="Any additional context or specific requirements for content generation..."
          value={customInstructions}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              onCustomInstructionsChange(e.target.value)
            }
          }}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Provide specific guidelines for AI content generation</span>
          <span className={charCount > maxChars * 0.9 ? "text-orange-600" : ""}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Sparkles, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageGenerationSettings {
  enabled: boolean
  style: "photorealistic" | "illustration" | "abstract"
  aspectRatio: "16:9" | "1:1" | "4:3"
  provider: "dalle" | "midjourney"
}

interface ImageGenerationToggleProps {
  value: ImageGenerationSettings
  onChange: (settings: ImageGenerationSettings) => void
  className?: string
}

export function ImageGenerationToggle({
  value,
  onChange,
  className = "",
}: ImageGenerationToggleProps) {
  const costEstimate = value.enabled
    ? value.provider === "dalle"
      ? "$0.04 per image"
      : "$0.10 per image"
    : "$0"

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Toggle Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <Label htmlFor="image-gen" className="text-base font-medium">
                AI Image Generation
              </Label>
              <p className="text-sm text-gray-500">
                Automatically generate featured images for posts
              </p>
            </div>
          </div>
          <Switch
            id="image-gen"
            checked={value.enabled}
            onCheckedChange={(enabled) => onChange({ ...value, enabled })}
          />
        </div>

        {/* Settings Panel */}
        {value.enabled && (
          <div className="space-y-4 pt-4 border-t">
            {/* Style Selection */}
            <div className="space-y-2">
              <Label htmlFor="style">Image Style</Label>
              <Select
                value={value.style}
                onValueChange={(style: ImageGenerationSettings["style"]) =>
                  onChange({ ...value, style })
                }
              >
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealistic">Photorealistic</SelectItem>
                  <SelectItem value="illustration">Illustration</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="aspect">Aspect Ratio</Label>
              <Select
                value={value.aspectRatio}
                onValueChange={(aspectRatio: ImageGenerationSettings["aspectRatio"]) =>
                  onChange({ ...value, aspectRatio })
                }
              >
                <SelectTrigger id="aspect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select
                value={value.provider}
                onValueChange={(provider: ImageGenerationSettings["provider"]) =>
                  onChange({ ...value, provider })
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dalle">
                    DALL-E 3 (Fast, $0.04/image)
                  </SelectItem>
                  <SelectItem value="midjourney">
                    Midjourney (High Quality, $0.10/image)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Estimate */}
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                Estimated cost: <strong>{costEstimate}</strong> per generated image.
                Images are cached and reused when possible.
              </AlertDescription>
            </Alert>

            {/* Preview Examples */}
            <div className="space-y-2">
              <Label>Style Examples</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-md border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all">
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                    Photo
                  </div>
                </div>
                <div className="relative aspect-video bg-gradient-to-br from-yellow-100 to-orange-100 rounded-md border-2 border-transparent hover:border-orange-500 cursor-pointer transition-all">
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                    Illustration
                  </div>
                </div>
                <div className="relative aspect-video bg-gradient-to-br from-pink-100 to-purple-100 rounded-md border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all">
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                    Abstract
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

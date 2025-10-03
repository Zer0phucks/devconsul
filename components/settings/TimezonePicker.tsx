"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Common timezones grouped by region
const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
]

interface TimezonePickerProps {
  value?: string
  onChange: (timezone: string) => void
  autoDetect?: boolean
}

export function TimezonePicker({ value, onChange, autoDetect = true }: TimezonePickerProps) {
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null)

  useEffect(() => {
    if (autoDetect && !value) {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
        setDetectedTimezone(detected)

        // If detected timezone is in our list, set it automatically
        const isInList = timezones.some(tz => tz.value === detected)
        if (isInList) {
          onChange(detected)
        } else {
          // Default to UTC if detected timezone not in list
          onChange("UTC")
        }
      } catch (error) {
        console.error("Error detecting timezone:", error)
        onChange("UTC")
      }
    }
  }, [autoDetect, value, onChange])

  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">Timezone</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="timezone" className="w-full">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          {timezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
              {detectedTimezone === tz.value && " (Auto-detected)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {detectedTimezone && (
        <p className="text-xs text-muted-foreground">
          Auto-detected: {detectedTimezone}
        </p>
      )}
    </div>
  )
}

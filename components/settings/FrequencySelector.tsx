"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TimezonePicker } from "./TimezonePicker"
import { format, addDays, addWeeks, addMonths, parse } from "date-fns"

export type FrequencyType = "daily" | "weekly" | "monthly"

interface FrequencySelectorProps {
  frequency: FrequencyType
  time: string // HH:mm format
  timezone: string
  onFrequencyChange: (frequency: FrequencyType) => void
  onTimeChange: (time: string) => void
  onTimezoneChange: (timezone: string) => void
}

export function FrequencySelector({
  frequency,
  time,
  timezone,
  onFrequencyChange,
  onTimeChange,
  onTimezoneChange,
}: FrequencySelectorProps) {
  const [nextRun, setNextRun] = useState<string>("")

  // Calculate next run time
  useEffect(() => {
    try {
      if (!time || !timezone) {
        setNextRun("")
        return
      }

      const now = new Date()
      const [hours, minutes] = time.split(":").map(Number)

      let nextDate = new Date()
      nextDate.setHours(hours, minutes, 0, 0)

      // If time has passed today, move to next occurrence
      if (nextDate <= now) {
        switch (frequency) {
          case "daily":
            nextDate = addDays(nextDate, 1)
            break
          case "weekly":
            nextDate = addWeeks(nextDate, 1)
            break
          case "monthly":
            nextDate = addMonths(nextDate, 1)
            break
        }
      }

      // Format the next run display
      const isToday = nextDate.toDateString() === now.toDateString()
      const isTomorrow = nextDate.toDateString() === addDays(now, 1).toDateString()

      let dateStr = ""
      if (isToday) {
        dateStr = "Today"
      } else if (isTomorrow) {
        dateStr = "Tomorrow"
      } else {
        dateStr = format(nextDate, "EEEE, MMM d")
      }

      const timeStr = format(nextDate, "h:mm a")
      const tzAbbr = timezone.split("/").pop()?.replace("_", " ") || timezone

      setNextRun(`${dateStr} at ${timeStr} ${tzAbbr}`)
    } catch (error) {
      console.error("Error calculating next run:", error)
      setNextRun("")
    }
  }, [frequency, time, timezone])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base">Frequency</Label>
        <RadioGroup
          value={frequency}
          onValueChange={(value) => onFrequencyChange(value as FrequencyType)}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="freq-daily" />
            <Label htmlFor="freq-daily" className="cursor-pointer font-normal">
              Daily
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekly" id="freq-weekly" />
            <Label htmlFor="freq-weekly" className="cursor-pointer font-normal">
              Weekly
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="monthly" id="freq-monthly" />
            <Label htmlFor="freq-monthly" className="cursor-pointer font-normal">
              Monthly
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="exec-time">Execution Time</Label>
          <Input
            id="exec-time"
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full"
          />
        </div>

        <TimezonePicker
          value={timezone}
          onChange={onTimezoneChange}
          autoDetect={!timezone}
        />
      </div>

      {nextRun && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">Next run:</p>
          <p className="text-sm mt-1">{nextRun}</p>
        </div>
      )}
    </div>
  )
}

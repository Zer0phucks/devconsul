"use client"

import { Progress } from "@/components/ui/progress"
import { AlertTriangle } from "lucide-react"
import type { PlatformType } from "@/lib/validations/platform-connection"
import { platformCharacterLimits } from "@/lib/validations/platform-connection"

interface CharacterCounterProps {
  platform: PlatformType
  currentLength: number
  className?: string
}

export function CharacterCounter({
  platform,
  currentLength,
  className = "",
}: CharacterCounterProps) {
  const limit = platformCharacterLimits[platform]

  // No limit for this platform
  if (!limit) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        {currentLength.toLocaleString()} characters
      </div>
    )
  }

  const percentage = (currentLength / limit) * 100
  const isWarning = percentage > 80
  const isError = currentLength > limit
  const remaining = limit - currentLength

  // Color based on percentage
  const getColor = () => {
    if (isError) return "text-red-600"
    if (isWarning) return "text-yellow-600"
    return "text-gray-600"
  }

  const getProgressColor = () => {
    if (isError) return "bg-red-500"
    if (isWarning) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className={getColor()}>
          {currentLength.toLocaleString()} / {limit.toLocaleString()}
        </span>
        {remaining < 0 ? (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {Math.abs(remaining)} over limit
          </span>
        ) : isWarning ? (
          <span className="text-yellow-600 font-medium">
            {remaining} remaining
          </span>
        ) : (
          <span className="text-gray-500">{remaining} remaining</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress value={Math.min(percentage, 100)} className="h-2" />
        <div
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Warning message */}
      {isError && (
        <p className="text-xs text-red-600">
          Content exceeds {platform} character limit and will be truncated
        </p>
      )}
      {isWarning && !isError && (
        <p className="text-xs text-yellow-600">
          Approaching {platform} character limit
        </p>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type EventType = "commits" | "pull_requests" | "issues" | "releases"
export type BranchFilter = "main" | "all" | "custom"

interface ActivityFiltersProps {
  enabledEvents: EventType[]
  contributorFilter: string // "all" or specific contributor username
  branchFilter: BranchFilter
  customBranch?: string
  onEventsChange: (events: EventType[]) => void
  onContributorChange: (contributor: string) => void
  onBranchFilterChange: (filter: BranchFilter) => void
  onCustomBranchChange?: (branch: string) => void
  contributors?: string[] // List of available contributors
}

export function ActivityFilters({
  enabledEvents,
  contributorFilter,
  branchFilter,
  customBranch = "",
  onEventsChange,
  onContributorChange,
  onBranchFilterChange,
  onCustomBranchChange,
  contributors = [],
}: ActivityFiltersProps) {
  const eventTypes: { value: EventType; label: string }[] = [
    { value: "commits", label: "Commits" },
    { value: "pull_requests", label: "Pull Requests" },
    { value: "issues", label: "Issues" },
    { value: "releases", label: "Releases" },
  ]

  const toggleEvent = (event: EventType) => {
    if (enabledEvents.includes(event)) {
      onEventsChange(enabledEvents.filter(e => e !== event))
    } else {
      onEventsChange([...enabledEvents, event])
    }
  }

  const handleSelectAll = () => {
    onEventsChange(eventTypes.map(et => et.value))
  }

  const handleDeselectAll = () => {
    onEventsChange([])
  }

  return (
    <div className="space-y-6">
      {/* Event Type Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Event Types</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-7"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="text-xs h-7"
            >
              Deselect All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {eventTypes.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`event-${value}`}
                checked={enabledEvents.includes(value)}
                onChange={() => toggleEvent(value)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <Label
                htmlFor={`event-${value}`}
                className="cursor-pointer font-normal text-sm"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Select which GitHub events to include in content generation
        </p>
      </div>

      {/* Contributor Filter */}
      <div className="space-y-2">
        <Label htmlFor="contributor-filter">Contributors</Label>
        <Select value={contributorFilter} onValueChange={onContributorChange}>
          <SelectTrigger id="contributor-filter">
            <SelectValue placeholder="Select contributors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contributors</SelectItem>
            {contributors.length > 0 && (
              <>
                {contributors.map((contributor) => (
                  <SelectItem key={contributor} value={contributor}>
                    @{contributor}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Filter activity by specific contributors
        </p>
      </div>

      {/* Branch Filter */}
      <div className="space-y-3">
        <Label className="text-base">Branch Filter</Label>
        <RadioGroup
          value={branchFilter}
          onValueChange={(value) => onBranchFilterChange(value as BranchFilter)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="main" id="branch-main" />
            <Label htmlFor="branch-main" className="cursor-pointer font-normal">
              Main branch only
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="branch-all" />
            <Label htmlFor="branch-all" className="cursor-pointer font-normal">
              All branches
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="branch-custom" />
            <Label htmlFor="branch-custom" className="cursor-pointer font-normal">
              Custom branch
            </Label>
          </div>
        </RadioGroup>

        {branchFilter === "custom" && (
          <div className="ml-6 mt-2">
            <Input
              type="text"
              placeholder="Branch name (e.g., develop)"
              value={customBranch}
              onChange={(e) => onCustomBranchChange?.(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Specify which branches to monitor for activity
        </p>
      </div>
    </div>
  )
}

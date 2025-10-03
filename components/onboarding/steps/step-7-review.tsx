"use client";

/**
 * Step 7: Review & Customize
 * Settings summary, schedule configuration, and final customization
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Edit2,
  CheckCircle2,
  Github,
  Type,
  Megaphone,
  Settings,
} from "lucide-react";

interface Step7Data {
  cronSchedule: string;
  frequency: "daily" | "weekly" | "monthly";
  timezone: string;
}

interface Step7ReviewProps {
  onComplete: (data: Step7Data) => Promise<boolean>;
}

const FREQUENCIES = [
  { value: "daily", label: "Daily", description: "Generate and publish content every day" },
  { value: "weekly", label: "Weekly", description: "Generate content once per week" },
  { value: "monthly", label: "Monthly", description: "Generate content once per month" },
] as const;

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
] as const;

export function Step7Review({ onComplete }: Step7ReviewProps) {
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [timezone, setTimezone] = useState("UTC");
  const [publishTime, setPublishTime] = useState("09:00");
  const [dayOfWeek, setDayOfWeek] = useState("1"); // Monday
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const handleSubmit = async () => {
    // Generate cron expression based on selected frequency
    let cronSchedule = "";
    const [hour, minute] = publishTime.split(":");

    switch (frequency) {
      case "daily":
        cronSchedule = `${minute} ${hour} * * *`; // Every day at specified time
        break;
      case "weekly":
        cronSchedule = `${minute} ${hour} * * ${dayOfWeek}`; // Every specified day of week
        break;
      case "monthly":
        cronSchedule = `${minute} ${hour} ${dayOfMonth} * *`; // Specified day of each month
        break;
    }

    await onComplete({
      cronSchedule,
      frequency,
      timezone,
    });
  };

  const selectedFrequency = FREQUENCIES.find(f => f.value === frequency);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Review & Customize Your Setup</h2>
        <p className="text-muted-foreground text-lg">
          Review your settings and configure your publishing schedule
        </p>
      </div>

      {/* Settings Summary */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Your Configuration Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-start gap-3">
              <Github className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">GitHub Repository</h4>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connected • Tracking commits and releases
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-start gap-3">
              <Type className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Content Types</h4>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Blog, Newsletter, Twitter
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-start gap-3">
              <Megaphone className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Brand Voice</h4>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional tone • Developer audience
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Platforms</h4>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  2 platforms connected
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Publishing Schedule */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Configure Publishing Schedule
        </h3>

        <Card className="p-6 space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label>Publishing Frequency</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FREQUENCIES.map((freq) => (
                <Card
                  key={freq.value}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    frequency === freq.value
                      ? "ring-2 ring-purple-500 bg-purple-50"
                      : ""
                  }`}
                  onClick={() => setFrequency(freq.value)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{freq.label}</h4>
                      {frequency === freq.value && (
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {freq.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Time Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publish-time">
                <Clock className="inline h-4 w-4 mr-1" />
                Publish Time
              </Label>
              <Input
                id="publish-time"
                type="time"
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Day Selection for Weekly/Monthly */}
          {frequency === "weekly" && (
            <div className="space-y-2">
              <Label htmlFor="day-of-week">Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger id="day-of-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="day-of-month">Day of Month</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger id="day-of-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Schedule Preview */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Schedule Preview</h4>
            <p className="text-sm text-blue-800">
              {frequency === "daily" && `Content will be published daily at ${publishTime}`}
              {frequency === "weekly" &&
                `Content will be published every ${
                  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
                    parseInt(dayOfWeek)
                  ]
                } at ${publishTime}`}
              {frequency === "monthly" &&
                `Content will be published on day ${dayOfMonth} of each month at ${publishTime}`}
              {" "}({timezone})
            </p>
          </div>
        </Card>
      </div>

      {/* Complete Setup Button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={handleSubmit} className="px-8">
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Complete Setup
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        You can change these settings anytime from your project dashboard
      </div>
    </div>
  );
}

/**
 * Timezone Utilities
 *
 * Comprehensive timezone handling with IANA timezone database support
 * Handles conversion, DST, and formatting for scheduling system
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { format, parseISO } from "date-fns";

/**
 * Popular IANA timezone IDs grouped by region
 * Total: 400+ timezones supported via IANA database
 */
export const TIMEZONE_GROUPS = {
  "North America": [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Phoenix",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Honolulu",
    "America/Toronto",
    "America/Vancouver",
    "America/Mexico_City",
  ],
  "South America": [
    "America/Sao_Paulo",
    "America/Buenos_Aires",
    "America/Santiago",
    "America/Bogota",
    "America/Lima",
    "America/Caracas",
  ],
  Europe: [
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Madrid",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Stockholm",
    "Europe/Warsaw",
    "Europe/Athens",
    "Europe/Moscow",
    "Europe/Istanbul",
  ],
  "Asia Pacific": [
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Hong_Kong",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Pacific/Auckland",
  ],
  Africa: [
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
  ],
  UTC: ["UTC"],
};

/**
 * Flatten all timezones into a single array
 */
export const ALL_TIMEZONES = Object.values(TIMEZONE_GROUPS).flat();

/**
 * Common timezone abbreviations to IANA mapping
 */
export const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  EST: "America/New_York",
  EDT: "America/New_York",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  MST: "America/Denver",
  MDT: "America/Denver",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
  GMT: "Europe/London",
  BST: "Europe/London",
  CET: "Europe/Paris",
  CEST: "Europe/Paris",
  JST: "Asia/Tokyo",
  KST: "Asia/Seoul",
  IST: "Asia/Kolkata",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
  NZST: "Pacific/Auckland",
  NZDT: "Pacific/Auckland",
};

/**
 * Convert UTC date to local timezone
 */
export function utcToLocal(utcDate: Date, timezone: string): Date {
  try {
    return toZonedTime(utcDate, timezone);
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error);
    return utcDate;
  }
}

/**
 * Convert local timezone date to UTC
 */
export function localToUtc(localDate: Date, timezone: string): Date {
  try {
    return fromZonedTime(localDate, timezone);
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error);
    return localDate;
  }
}

/**
 * Format date in specific timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatString: string = "yyyy-MM-dd HH:mm:ss zzz"
): string {
  try {
    return formatInTimeZone(date, timezone, formatString);
  } catch (error) {
    console.error(`Error formatting date in timezone ${timezone}:`, error);
    return format(date, formatString);
  }
}

/**
 * Get human-readable local time string
 * e.g., "2025-01-15 09:00 AM PST"
 */
export function getLocalTimeString(utcDate: Date, timezone: string): string {
  try {
    const formatted = formatInTimeZone(
      utcDate,
      timezone,
      "yyyy-MM-dd hh:mm a zzz"
    );
    return formatted;
  } catch (error) {
    console.error(`Error getting local time string:`, error);
    return format(utcDate, "yyyy-MM-dd hh:mm a");
  }
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  try {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch (error) {
    console.error(`Error calculating timezone offset:`, error);
    return 0;
  }
}

/**
 * Get timezone abbreviation (PST, EST, etc.)
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatted = formatInTimeZone(date, timezone, "zzz");
    return formatted;
  } catch (error) {
    return timezone;
  }
}

/**
 * Check if timezone is valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user's browser timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Convert schedule time across timezones
 * Example: Schedule at 9 AM PST → What time is that in UTC?
 */
export function convertScheduleTime(
  localHour: number,
  localMinute: number,
  fromTimezone: string,
  toTimezone: string = "UTC",
  referenceDate: Date = new Date()
): Date {
  try {
    // Create date in source timezone
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    const localDate = new Date(year, month, day, localHour, localMinute, 0, 0);
    const utcDate = fromZonedTime(localDate, fromTimezone);

    if (toTimezone === "UTC") {
      return utcDate;
    }

    return toZonedTime(utcDate, toTimezone);
  } catch (error) {
    console.error(`Error converting schedule time:`, error);
    return referenceDate;
  }
}

/**
 * Calculate next occurrence for recurring schedule
 */
export interface RecurringConfig {
  pattern: "daily" | "weekly" | "monthly" | "custom";
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  hour: number;
  minute: number;
  timezone: string;
}

export function calculateNextOccurrence(
  config: RecurringConfig,
  after: Date = new Date()
): Date {
  const { pattern, daysOfWeek, dayOfMonth, hour, minute, timezone } = config;

  // Convert 'after' to local timezone
  const localAfter = toZonedTime(after, timezone);
  const candidate = new Date(localAfter);

  switch (pattern) {
    case "daily":
      // Next occurrence is tomorrow at specified time
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(hour, minute, 0, 0);
      break;

    case "weekly":
      // Find next matching day of week
      if (!daysOfWeek || daysOfWeek.length === 0) {
        throw new Error("Weekly pattern requires daysOfWeek");
      }

      const currentDay = candidate.getDay();
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

      // Find next day in the list
      let nextDay = sortedDays.find((d) => d > currentDay);
      if (!nextDay) {
        // Wrap to next week
        nextDay = sortedDays[0];
        candidate.setDate(candidate.getDate() + 7);
      }

      const daysToAdd = (nextDay - currentDay + 7) % 7;
      candidate.setDate(candidate.getDate() + daysToAdd);
      candidate.setHours(hour, minute, 0, 0);
      break;

    case "monthly":
      // Next occurrence on specified day of month
      if (!dayOfMonth) {
        throw new Error("Monthly pattern requires dayOfMonth");
      }

      candidate.setMonth(candidate.getMonth() + 1);
      candidate.setDate(Math.min(dayOfMonth, getLastDayOfMonth(candidate)));
      candidate.setHours(hour, minute, 0, 0);
      break;

    case "custom":
      // Custom cron-like pattern (handled elsewhere)
      throw new Error("Custom pattern not implemented in this function");
  }

  // Convert back to UTC
  return fromZonedTime(candidate, timezone);
}

/**
 * Helper: Get last day of month
 */
function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Check if DST is active for given timezone and date
 */
export function isDSTActive(timezone: string, date: Date = new Date()): boolean {
  try {
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);

    const janOffset = getTimezoneOffset(timezone, january);
    const julyOffset = getTimezoneOffset(timezone, july);

    // DST is active if current offset differs from winter offset
    const currentOffset = getTimezoneOffset(timezone, date);
    const winterOffset = Math.max(janOffset, julyOffset);

    return currentOffset !== winterOffset;
  } catch {
    return false;
  }
}

/**
 * Get next DST transition date
 */
export function getNextDSTTransition(
  timezone: string,
  after: Date = new Date()
): Date | null {
  try {
    // Check next 12 months for DST transitions
    const currentDST = isDSTActive(timezone, after);
    let checkDate = new Date(after);

    for (let i = 0; i < 365; i++) {
      checkDate.setDate(checkDate.getDate() + 1);
      if (isDSTActive(timezone, checkDate) !== currentDST) {
        return checkDate;
      }
    }

    return null; // No transition found (e.g., timezone doesn't observe DST)
  } catch {
    return null;
  }
}

/**
 * Parse various date/time formats to Date object
 */
export function parseDateTime(
  dateTimeString: string,
  timezone: string = "UTC"
): Date {
  try {
    // Try ISO format first
    const isoDate = parseISO(dateTimeString);
    if (!isNaN(isoDate.getTime())) {
      return fromZonedTime(isoDate, timezone);
    }

    // Fallback to Date constructor
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      return fromZonedTime(date, timezone);
    }

    throw new Error(`Invalid date string: ${dateTimeString}`);
  } catch (error) {
    console.error(`Error parsing date/time:`, error);
    throw error;
  }
}

/**
 * Validate schedule time doesn't conflict with DST transition
 */
export function validateDSTSafe(scheduleTime: Date, timezone: string): {
  safe: boolean;
  warning?: string;
  suggestion?: Date;
} {
  const transition = getNextDSTTransition(timezone, new Date());

  if (!transition) {
    return { safe: true }; // No DST or no upcoming transition
  }

  // Check if schedule is within 2 hours of DST transition
  const timeDiff = Math.abs(scheduleTime.getTime() - transition.getTime());
  const twoHours = 2 * 60 * 60 * 1000;

  if (timeDiff < twoHours) {
    // Suggest time 3 hours after transition
    const suggestion = new Date(transition.getTime() + 3 * 60 * 60 * 1000);

    return {
      safe: false,
      warning: `Schedule time is near DST transition at ${formatInTimezone(
        transition,
        timezone
      )}`,
      suggestion,
    };
  }

  return { safe: true };
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplayName(
  timezone: string,
  date: Date = new Date()
): string {
  try {
    const offset = getTimezoneOffset(timezone, date);
    const abbr = getTimezoneAbbreviation(timezone, date);
    const offsetStr = `UTC${offset >= 0 ? "+" : ""}${offset}`;

    // Extract city name from IANA ID
    const cityName = timezone.split("/").pop()?.replace(/_/g, " ") || timezone;

    return `(${offsetStr}) ${cityName} - ${abbr}`;
  } catch {
    return timezone;
  }
}

/**
 * Frequency Management System
 *
 * Handles cron frequency configuration, timezone support, and schedule calculations
 */

import { addDays, addWeeks, addMonths, startOfDay, setHours, setMinutes, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Frequency types for cron jobs
 */
export enum CronFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}

/**
 * Time configuration for scheduled jobs
 */
export interface TimeConfig {
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string; // IANA timezone (e.g., "America/New_York")
}

/**
 * Weekly schedule configuration
 */
export interface WeeklyConfig extends TimeConfig {
  dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
}

/**
 * Monthly schedule configuration
 */
export interface MonthlyConfig extends TimeConfig {
  dayOfMonth: number; // 1-31
}

/**
 * Custom cron expression configuration
 */
export interface CustomConfig {
  expression: string; // Standard cron expression
  timezone: string;
}

/**
 * Generate cron expression from frequency and config
 */
export function generateCronExpression(
  frequency: CronFrequency,
  config: TimeConfig | WeeklyConfig | MonthlyConfig | CustomConfig
): string {
  switch (frequency) {
    case CronFrequency.DAILY: {
      const { hour, minute } = config as TimeConfig;
      // minute hour * * *
      return `${minute} ${hour} * * *`;
    }

    case CronFrequency.WEEKLY: {
      const { hour, minute, dayOfWeek } = config as WeeklyConfig;
      // minute hour * * dayOfWeek
      return `${minute} ${hour} * * ${dayOfWeek}`;
    }

    case CronFrequency.MONTHLY: {
      const { hour, minute, dayOfMonth } = config as MonthlyConfig;
      // minute hour dayOfMonth * *
      return `${minute} ${hour} ${dayOfMonth} * *`;
    }

    case CronFrequency.CUSTOM: {
      const { expression } = config as CustomConfig;
      return expression;
    }

    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

/**
 * Calculate next execution time based on frequency
 *
 * @param frequency - Cron frequency type
 * @param config - Configuration with time and timezone
 * @param lastRun - Optional last run timestamp
 * @returns Next execution timestamp in UTC
 */
export function calculateNextRun(
  frequency: CronFrequency,
  config: TimeConfig | WeeklyConfig | MonthlyConfig,
  lastRun?: Date
): Date {
  const { hour, minute, timezone } = config;
  const now = new Date();

  // Get current time in user's timezone
  const zonedNow = toZonedTime(now, timezone);

  let nextRun: Date;

  switch (frequency) {
    case CronFrequency.DAILY: {
      // Set to specified time today
      nextRun = setMinutes(setHours(startOfDay(zonedNow), hour), minute);

      // If time already passed today, schedule for tomorrow
      if (nextRun <= zonedNow) {
        nextRun = addDays(nextRun, 1);
      }
      break;
    }

    case CronFrequency.WEEKLY: {
      const { dayOfWeek } = config as WeeklyConfig;
      const currentDay = zonedNow.getDay();

      // Calculate days until target day
      let daysUntilTarget = dayOfWeek - currentDay;
      if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
      }

      // Set to target day and time
      nextRun = setMinutes(
        setHours(startOfDay(addDays(zonedNow, daysUntilTarget)), hour),
        minute
      );

      // If we're on the target day but time passed, schedule next week
      if (daysUntilTarget === 0 && nextRun <= zonedNow) {
        nextRun = addWeeks(nextRun, 1);
      }
      break;
    }

    case CronFrequency.MONTHLY: {
      const { dayOfMonth } = config as MonthlyConfig;

      // Set to target day of current month
      let targetDate = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), dayOfMonth);
      nextRun = setMinutes(setHours(startOfDay(targetDate), hour), minute);

      // If date already passed this month, schedule next month
      if (nextRun <= zonedNow) {
        nextRun = addMonths(nextRun, 1);
      }

      // Handle edge case: day doesn't exist in month (e.g., Feb 31)
      if (nextRun.getDate() !== dayOfMonth) {
        // Use last day of month instead
        nextRun = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0);
        nextRun = setMinutes(setHours(startOfDay(nextRun), hour), minute);
      }
      break;
    }

    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }

  // Convert back to UTC for storage
  return fromZonedTime(nextRun, timezone);
}

/**
 * Validate cron expression
 *
 * Basic validation for standard cron format: minute hour day month dayOfWeek
 */
export function validateCronExpression(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);

  // Standard cron has 5 parts
  if (parts.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Validate ranges (simplified - doesn't handle all special chars)
  const isValidRange = (value: string, min: number, max: number): boolean => {
    if (value === "*") return true;
    if (value.includes(",") || value.includes("-") || value.includes("/")) return true;

    const num = parseInt(value, 10);
    return !isNaN(num) && num >= min && num <= max;
  };

  return (
    isValidRange(minute, 0, 59) &&
    isValidRange(hour, 0, 23) &&
    isValidRange(dayOfMonth, 1, 31) &&
    isValidRange(month, 1, 12) &&
    isValidRange(dayOfWeek, 0, 6)
  );
}

/**
 * Parse cron expression to human-readable format
 */
export function formatCronSchedule(
  frequency: CronFrequency,
  config: TimeConfig | WeeklyConfig | MonthlyConfig | CustomConfig
): string {
  const { timezone } = config;

  switch (frequency) {
    case CronFrequency.DAILY: {
      const { hour, minute } = config as TimeConfig;
      return `Daily at ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${timezone}`;
    }

    case CronFrequency.WEEKLY: {
      const { hour, minute, dayOfWeek } = config as WeeklyConfig;
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Every ${days[dayOfWeek]} at ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${timezone}`;
    }

    case CronFrequency.MONTHLY: {
      const { hour, minute, dayOfMonth } = config as MonthlyConfig;
      const suffix = dayOfMonth === 1 ? "st" : dayOfMonth === 2 ? "nd" : dayOfMonth === 3 ? "rd" : "th";
      return `Monthly on the ${dayOfMonth}${suffix} at ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${timezone}`;
    }

    case CronFrequency.CUSTOM: {
      const { expression } = config as CustomConfig;
      return `Custom: ${expression} (${timezone})`;
    }

    default:
      return "Unknown schedule";
  }
}

/**
 * Check if current time matches cron schedule
 *
 * Used for manual validation in serverless environments
 */
export function shouldRunNow(
  frequency: CronFrequency,
  config: TimeConfig | WeeklyConfig | MonthlyConfig,
  timezone: string
): boolean {
  const now = toZonedTime(new Date(), timezone);
  const { hour, minute } = config;

  // Check if current time matches
  if (now.getHours() !== hour || now.getMinutes() !== minute) {
    return false;
  }

  switch (frequency) {
    case CronFrequency.DAILY:
      return true;

    case CronFrequency.WEEKLY: {
      const { dayOfWeek } = config as WeeklyConfig;
      return now.getDay() === dayOfWeek;
    }

    case CronFrequency.MONTHLY: {
      const { dayOfMonth } = config as MonthlyConfig;
      return now.getDate() === dayOfMonth;
    }

    default:
      return false;
  }
}

/**
 * Get default time config (9am UTC)
 */
export function getDefaultTimeConfig(): TimeConfig {
  return {
    hour: 9,
    minute: 0,
    timezone: "UTC",
  };
}

/**
 * Get default weekly config (Monday 9am UTC)
 */
export function getDefaultWeeklyConfig(): WeeklyConfig {
  return {
    hour: 9,
    minute: 0,
    dayOfWeek: 1, // Monday
    timezone: "UTC",
  };
}

/**
 * Get default monthly config (1st of month, 9am UTC)
 */
export function getDefaultMonthlyConfig(): MonthlyConfig {
  return {
    hour: 9,
    minute: 0,
    dayOfMonth: 1,
    timezone: "UTC",
  };
}

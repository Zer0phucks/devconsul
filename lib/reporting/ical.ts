/**
 * iCal Calendar Formatter
 *
 * Export scheduled content as iCalendar (.ics) format for calendar integration
 */

import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/**
 * iCal export options
 */
export interface ICalExportOptions {
  projectId: string;
  includeAllStatuses?: boolean; // Include CANCELLED and FAILED schedules
  filterPlatforms?: string[]; // Filter by platform types
}

/**
 * Escape iCal text value
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Format date for iCal (UTC format: YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Generate unique iCal UID
 */
function generateUID(scheduleId: string, projectId: string): string {
  return `schedule-${scheduleId}@fullselfpublishing-${projectId}.com`;
}

/**
 * Create iCal event (VEVENT)
 */
function createICalEvent(schedule: any, project: any): string {
  const lines: string[] = [];

  // Begin event
  lines.push("BEGIN:VEVENT");

  // UID (unique identifier)
  lines.push(`UID:${generateUID(schedule.id, project.id)}`);

  // Timestamp (when event was created/modified)
  lines.push(`DTSTAMP:${formatICalDate(new Date())}`);

  // Start time
  lines.push(`DTSTART:${formatICalDate(schedule.scheduledFor)}`);

  // End time (30 minutes after start, assuming publishing takes some time)
  const endTime = new Date(schedule.scheduledFor.getTime() + 30 * 60 * 1000);
  lines.push(`DTEND:${formatICalDate(endTime)}`);

  // Summary (title)
  const summary = escapeICalText(
    `Publish: ${schedule.content.title}`
  );
  lines.push(`SUMMARY:${summary}`);

  // Description
  const platformList = schedule.platforms.join(", ");
  const description = escapeICalText(
    `Scheduled content publication to ${platformList}\\n\\nStatus: ${schedule.status}\\nContent ID: ${schedule.content.id}\\nProject: ${project.name}`
  );
  lines.push(`DESCRIPTION:${description}`);

  // Location (virtual)
  lines.push(`LOCATION:Full Self Publishing Platform`);

  // Status
  const status = schedule.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED";
  lines.push(`STATUS:${status}`);

  // Categories
  lines.push(`CATEGORIES:Content Publishing,${schedule.status}`);

  // Priority (1-9, where 1 is highest)
  const priority = schedule.priority >= 8 ? 1 : schedule.priority >= 5 ? 5 : 9;
  lines.push(`PRIORITY:${priority}`);

  // URL (link to content in platform)
  lines.push(`URL:https://fullselfpublishing.com/dashboard/content/${schedule.content.id}`);

  // Alarm/Reminder (15 minutes before)
  lines.push("BEGIN:VALARM");
  lines.push("TRIGGER:-PT15M");
  lines.push("ACTION:DISPLAY");
  lines.push(`DESCRIPTION:Content publishing reminder: ${schedule.content.title}`);
  lines.push("END:VALARM");

  // End event
  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

/**
 * Export scheduled content calendar as iCal format
 */
export async function exportScheduledContentICalAsync(
  options: ICalExportOptions
): Promise<string> {
  // Fetch project
  const project = await prisma.project.findUnique({
    where: { id: options.projectId },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Build query filters
  const where: any = {
    projectId: options.projectId,
  };

  if (!options.includeAllStatuses) {
    where.status = {
      in: ["SCHEDULED", "ACTIVE", "PUBLISHED"],
    };
  }

  // Fetch scheduled content
  const scheduled = await prisma.scheduledContent.findMany({
    where,
    include: {
      content: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      scheduledFor: "asc",
    },
  });

  // Filter by platforms if specified
  let filteredScheduled = scheduled;

  if (options.filterPlatforms && options.filterPlatforms.length > 0) {
    filteredScheduled = scheduled.filter((s) =>
      s.platforms.some((p) => options.filterPlatforms!.includes(p))
    );
  }

  // Generate iCal header
  const lines: string[] = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Full Self Publishing//Content Scheduler//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${escapeICalText(project.name)} - Content Calendar`);
  lines.push(`X-WR-CALDESC:Scheduled content publications for ${escapeICalText(project.name)}`);
  lines.push("X-WR-TIMEZONE:UTC");

  // Add timezone definition (UTC)
  lines.push("BEGIN:VTIMEZONE");
  lines.push("TZID:UTC");
  lines.push("BEGIN:STANDARD");
  lines.push("DTSTART:19700101T000000");
  lines.push("TZOFFSETFROM:+0000");
  lines.push("TZOFFSETTO:+0000");
  lines.push("TZNAME:UTC");
  lines.push("END:STANDARD");
  lines.push("END:VTIMEZONE");

  // Add events
  for (const schedule of filteredScheduled) {
    lines.push(createICalEvent(schedule, project));
  }

  // End calendar
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Export scheduled content calendar as iCal format (sync version for streaming)
 */
export function exportScheduledContentICal(
  schedules: any[],
  project: { id: string; name: string; description: string | null }
): string {
  const lines: string[] = [];

  // iCal header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Full Self Publishing//Content Scheduler//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${escapeICalText(project.name)} - Content Calendar`);

  if (project.description) {
    lines.push(`X-WR-CALDESC:${escapeICalText(project.description)}`);
  }

  lines.push("X-WR-TIMEZONE:UTC");

  // Timezone definition
  lines.push("BEGIN:VTIMEZONE");
  lines.push("TZID:UTC");
  lines.push("BEGIN:STANDARD");
  lines.push("DTSTART:19700101T000000");
  lines.push("TZOFFSETFROM:+0000");
  lines.push("TZOFFSETTO:+0000");
  lines.push("TZNAME:UTC");
  lines.push("END:STANDARD");
  lines.push("END:VTIMEZONE");

  // Add events
  for (const schedule of schedules) {
    lines.push(createICalEvent(schedule, project));
  }

  // End calendar
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Validate iCal content
 */
export function validateICal(icalContent: string): boolean {
  try {
    // Basic validation checks
    if (!icalContent.includes("BEGIN:VCALENDAR")) {
      return false;
    }

    if (!icalContent.includes("END:VCALENDAR")) {
      return false;
    }

    if (!icalContent.includes("VERSION:2.0")) {
      return false;
    }

    // Count BEGIN and END statements
    const beginCount = (icalContent.match(/BEGIN:/g) || []).length;
    const endCount = (icalContent.match(/END:/g) || []).length;

    if (beginCount !== endCount) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Helper to save iCal to file
 */
export async function saveICalToFile(
  icalContent: string,
  filePath: string
): Promise<number> {
  const fs = await import("fs");
  await fs.promises.writeFile(filePath, icalContent, "utf8");

  const stats = await fs.promises.stat(filePath);
  return stats.size;
}

/**
 * Helper to generate iCal filename
 */
export function generateICalFilename(projectName: string): string {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeName}-calendar-${timestamp}.ics`;
}

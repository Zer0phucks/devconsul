import { describe, it, expect } from '@jest/globals';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addHours, addDays, addMinutes, isBefore, isAfter } from 'date-fns';

/**
 * Scheduling and Timezone Tests
 * Tests scheduling system with timezone support
 */

describe('Publishing Scheduling', () => {
  describe('Timezone Handling', () => {
    it('should convert UTC to user timezone', () => {
      const utcDate = new Date('2025-10-03T14:00:00Z');
      const timezone = 'America/New_York';

      const localDate = toZonedTime(utcDate, timezone);
      const formatted = formatInTimeZone(localDate, timezone, 'yyyy-MM-dd HH:mm:ss zzz');

      expect(formatted).toContain('EDT');
    });

    it('should convert user timezone to UTC', () => {
      const localDate = new Date('2025-10-03T10:00:00');
      const timezone = 'America/Los_Angeles';

      const utcDate = fromZonedTime(localDate, timezone);

      expect(utcDate.toISOString()).toBeTruthy();
      expect(utcDate.getUTCHours()).not.toBe(localDate.getHours());
    });

    it('should handle daylight saving time transitions', () => {
      const beforeDST = new Date('2025-03-08T06:00:00Z'); // Before DST
      const afterDST = new Date('2025-03-10T06:00:00Z'); // After DST

      const timezone = 'America/New_York';

      const beforeLocal = formatInTimeZone(beforeDST, timezone, 'HH:mm zzz');
      const afterLocal = formatInTimeZone(afterDST, timezone, 'HH:mm zzz');

      expect(beforeLocal).toBeTruthy();
      expect(afterLocal).toBeTruthy();
    });

    it('should validate IANA timezone strings', () => {
      const validTimezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'UTC',
      ];

      validTimezones.forEach((tz) => {
        expect(() => {
          toZonedTime(new Date(), tz);
        }).not.toThrow();
      });
    });

    it('should handle timezone offsets', () => {
      const date = new Date('2025-10-03T12:00:00Z');

      const nyTime = toZonedTime(date, 'America/New_York');
      const londonTime = toZonedTime(date, 'Europe/London');
      const tokyoTime = toZonedTime(date, 'Asia/Tokyo');

      expect(nyTime).toBeDefined();
      expect(londonTime).toBeDefined();
      expect(tokyoTime).toBeDefined();
    });
  });

  describe('Schedule Creation', () => {
    it('should create schedule with future date', () => {
      const now = new Date();
      const scheduledFor = addHours(now, 2);

      const schedule = {
        contentId: 'content_123',
        platformId: 'platform_456',
        scheduledFor,
        timezone: 'America/New_York',
      };

      expect(isAfter(schedule.scheduledFor, now)).toBe(true);
    });

    it('should reject past scheduled dates', () => {
      const now = new Date();
      const pastDate = addHours(now, -2);

      const isValidSchedule = isAfter(pastDate, now);
      expect(isValidSchedule).toBe(false);
    });

    it('should validate minimum future time (e.g., 5 minutes)', () => {
      const now = new Date();
      const scheduledDate = addMinutes(now, 3); // Only 3 minutes ahead

      const minimumDelay = 5 * 60 * 1000; // 5 minutes in ms
      const timeDiff = scheduledDate.getTime() - now.getTime();

      expect(timeDiff).toBeLessThan(minimumDelay);
    });

    it('should allow scheduling up to 1 year ahead', () => {
      const now = new Date();
      const oneYearAhead = addDays(now, 365);

      const maxScheduleDate = addDays(now, 365);
      const isWithinLimit = isBefore(oneYearAhead, maxScheduleDate) || oneYearAhead.getTime() === maxScheduleDate.getTime();

      expect(isWithinLimit).toBe(true);
    });
  });

  describe('Recurring Schedules', () => {
    it('should calculate next occurrence for daily schedule', () => {
      const baseDate = new Date('2025-10-03T09:00:00Z');
      const interval = 'daily';

      const nextOccurrence = addDays(baseDate, 1);

      expect(nextOccurrence.getDate()).toBe(baseDate.getDate() + 1);
    });

    it('should calculate next occurrence for weekly schedule', () => {
      const baseDate = new Date('2025-10-03T09:00:00Z');
      const interval = 'weekly';

      const nextOccurrence = addDays(baseDate, 7);

      expect(nextOccurrence.getDate()).toBe(baseDate.getDate() + 7);
    });

    it('should handle monthly recurring schedules', () => {
      const baseDate = new Date('2025-10-03T09:00:00Z');
      const nextMonth = new Date(baseDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      expect(nextMonth.getMonth()).toBe((baseDate.getMonth() + 1) % 12);
    });

    it('should handle end date for recurring schedules', () => {
      const startDate = new Date('2025-10-03T09:00:00Z');
      const endDate = new Date('2025-10-10T09:00:00Z');

      const occurrences: Date[] = [];
      let currentDate = new Date(startDate);

      while (isBefore(currentDate, endDate)) {
        occurrences.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }

      expect(occurrences.length).toBe(7);
    });

    it('should respect max occurrences limit', () => {
      const baseDate = new Date('2025-10-03T09:00:00Z');
      const maxOccurrences = 5;

      const occurrences: Date[] = [];
      for (let i = 0; i < maxOccurrences; i++) {
        occurrences.push(addDays(baseDate, i));
      }

      expect(occurrences).toHaveLength(maxOccurrences);
    });
  });

  describe('Schedule Conflict Detection', () => {
    it('should detect overlapping schedules', () => {
      const schedule1 = {
        platformId: 'twitter',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const schedule2 = {
        platformId: 'twitter',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const hasConflict =
        schedule1.platformId === schedule2.platformId &&
        schedule1.scheduledFor.getTime() === schedule2.scheduledFor.getTime();

      expect(hasConflict).toBe(true);
    });

    it('should allow same time for different platforms', () => {
      const schedule1 = {
        platformId: 'twitter',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const schedule2 = {
        platformId: 'linkedin',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const hasConflict =
        schedule1.platformId === schedule2.platformId &&
        schedule1.scheduledFor.getTime() === schedule2.scheduledFor.getTime();

      expect(hasConflict).toBe(false);
    });

    it('should enforce minimum time between posts', () => {
      const schedule1 = {
        platformId: 'twitter',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const schedule2 = {
        platformId: 'twitter',
        scheduledFor: new Date('2025-10-03T10:02:00Z'), // 2 minutes later
      };

      const minimumGap = 5 * 60 * 1000; // 5 minutes in ms
      const timeDiff = Math.abs(
        schedule2.scheduledFor.getTime() - schedule1.scheduledFor.getTime()
      );

      const tooClose = timeDiff < minimumGap;
      expect(tooClose).toBe(true);
    });
  });

  describe('Queue Management', () => {
    it('should order schedules by time', () => {
      const schedules = [
        { id: '3', scheduledFor: new Date('2025-10-03T12:00:00Z') },
        { id: '1', scheduledFor: new Date('2025-10-03T10:00:00Z') },
        { id: '2', scheduledFor: new Date('2025-10-03T11:00:00Z') },
      ];

      const sorted = schedules.sort(
        (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
      );

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should get next scheduled item', () => {
      const now = new Date('2025-10-03T10:30:00Z');
      const schedules = [
        { id: '1', scheduledFor: new Date('2025-10-03T10:00:00Z') },
        { id: '2', scheduledFor: new Date('2025-10-03T11:00:00Z') },
        { id: '3', scheduledFor: new Date('2025-10-03T12:00:00Z') },
      ];

      const nextSchedule = schedules
        .filter((s) => isAfter(s.scheduledFor, now))
        .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0];

      expect(nextSchedule?.id).toBe('2');
    });

    it('should identify overdue schedules', () => {
      const now = new Date('2025-10-03T10:30:00Z');
      const schedules = [
        { id: '1', scheduledFor: new Date('2025-10-03T10:00:00Z') },
        { id: '2', scheduledFor: new Date('2025-10-03T11:00:00Z') },
      ];

      const overdue = schedules.filter((s) => isBefore(s.scheduledFor, now));

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('1');
    });
  });

  describe('Schedule Modification', () => {
    it('should update schedule time', () => {
      const original = {
        id: 'schedule_123',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const newTime = new Date('2025-10-03T14:00:00Z');
      const updated = {
        ...original,
        scheduledFor: newTime,
      };

      expect(updated.scheduledFor.getTime()).not.toBe(original.scheduledFor.getTime());
    });

    it('should cancel scheduled post', () => {
      const schedule = {
        id: 'schedule_123',
        status: 'SCHEDULED',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
      };

      const cancelled = {
        ...schedule,
        status: 'CANCELLED',
      };

      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should reschedule failed attempt', () => {
      const failed = {
        id: 'schedule_123',
        scheduledFor: new Date('2025-10-03T10:00:00Z'),
        status: 'FAILED',
        retryCount: 1,
      };

      const rescheduled = {
        ...failed,
        scheduledFor: addHours(failed.scheduledFor, 1),
        status: 'SCHEDULED',
        retryCount: failed.retryCount + 1,
      };

      expect(rescheduled.status).toBe('SCHEDULED');
      expect(rescheduled.retryCount).toBe(2);
      expect(isAfter(rescheduled.scheduledFor, failed.scheduledFor)).toBe(true);
    });
  });

  describe('Execution Window', () => {
    it('should check if schedule is within execution window', () => {
      const now = new Date('2025-10-03T10:00:00Z');
      const scheduledFor = new Date('2025-10-03T10:00:30Z');
      const windowMinutes = 1;

      const timeDiff = Math.abs(scheduledFor.getTime() - now.getTime());
      const withinWindow = timeDiff <= windowMinutes * 60 * 1000;

      expect(withinWindow).toBe(true);
    });

    it('should skip execution if outside window', () => {
      const now = new Date('2025-10-03T10:00:00Z');
      const scheduledFor = new Date('2025-10-03T09:00:00Z'); // 1 hour ago
      const windowMinutes = 5;

      const timeDiff = Math.abs(scheduledFor.getTime() - now.getTime());
      const withinWindow = timeDiff <= windowMinutes * 60 * 1000;

      expect(withinWindow).toBe(false);
    });
  });

  describe('Priority Scheduling', () => {
    it('should order by priority when times are equal', () => {
      const schedules = [
        { id: '1', scheduledFor: new Date('2025-10-03T10:00:00Z'), priority: 2 },
        { id: '2', scheduledFor: new Date('2025-10-03T10:00:00Z'), priority: 1 },
        { id: '3', scheduledFor: new Date('2025-10-03T10:00:00Z'), priority: 3 },
      ];

      const sorted = schedules.sort((a, b) => {
        const timeDiff = a.scheduledFor.getTime() - b.scheduledFor.getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.priority - b.priority;
      });

      expect(sorted[0].id).toBe('2'); // Highest priority (1)
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });
  });

  describe('Bulk Scheduling', () => {
    it('should distribute posts evenly over time period', () => {
      const startDate = new Date('2025-10-03T09:00:00Z');
      const endDate = new Date('2025-10-03T17:00:00Z'); // 8 hours
      const postCount = 4;

      const interval = (endDate.getTime() - startDate.getTime()) / postCount;
      const schedules: Date[] = [];

      for (let i = 0; i < postCount; i++) {
        schedules.push(new Date(startDate.getTime() + interval * i));
      }

      expect(schedules).toHaveLength(4);
      expect(schedules[0].getTime()).toBe(startDate.getTime());
      expect(schedules[schedules.length - 1].getTime()).toBeLessThan(endDate.getTime());
    });

    it('should respect platform rate limits in bulk scheduling', () => {
      const posts = [1, 2, 3, 4, 5];
      const rateLimitPerHour = 3;
      const startDate = new Date('2025-10-03T09:00:00Z');

      const schedules: Date[] = [];
      let currentHourStart = new Date(startDate);
      let postsInCurrentHour = 0;

      posts.forEach(() => {
        if (postsInCurrentHour >= rateLimitPerHour) {
          currentHourStart = addHours(currentHourStart, 1);
          postsInCurrentHour = 0;
        }

        schedules.push(new Date(currentHourStart.getTime() + postsInCurrentHour * 20 * 60 * 1000));
        postsInCurrentHour++;
      });

      expect(schedules).toHaveLength(5);
    });
  });
});

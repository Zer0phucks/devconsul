'use client';

/**
 * Commit Heatmap Component
 * GitHub-style contribution graph visualization
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HeatmapData {
  days: Array<{
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>;
  weeks: number;
  maxCount: number;
}

interface CommitHeatmapProps {
  data: HeatmapData;
  className?: string;
}

export function CommitHeatmap({ data, className }: CommitHeatmapProps) {
  const { weeks, days: allDays } = data;

  // Organize days into weeks for grid layout
  const weekData = useMemo(() => {
    const result: Array<Array<HeatmapData['days'][0]>> = [];
    let currentWeek: Array<HeatmapData['days'][0]> = [];

    allDays.forEach((day, index) => {
      currentWeek.push(day);

      // Every 7 days or at the end, push the week
      if (currentWeek.length === 7 || index === allDays.length - 1) {
        result.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return result;
  }, [allDays]);

  // Get color based on activity level
  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0:
        return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
      case 1:
        return 'bg-green-200 dark:bg-green-900/50 border border-green-300 dark:border-green-800';
      case 2:
        return 'bg-green-400 dark:bg-green-700 border border-green-500 dark:border-green-600';
      case 3:
        return 'bg-green-600 dark:bg-green-600 border border-green-700 dark:border-green-500';
      case 4:
        return 'bg-green-800 dark:bg-green-500 border border-green-900 dark:border-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col gap-2">
        {/* Month labels */}
        <div className="flex gap-1 ml-8 mb-1">
          {Array.from({ length: Math.ceil(weeks / 4) }).map((_, i) => (
            <div
              key={i}
              className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
              style={{ width: '80px' }}
            >
              {i === 0 && allDays.length > 0 ? new Date(allDays[0].date).toLocaleDateString('en-US', { month: 'short' }) : ''}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 justify-around text-xs text-gray-500 dark:text-gray-400 pr-2">
            <div>Mon</div>
            <div>Wed</div>
            <div>Fri</div>
          </div>

          {/* Days grid */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {weekData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-blue-500',
                      getLevelColor(day.level)
                    )}
                    title={`${formatDate(day.date)}: ${day.count} commit${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn('w-3 h-3 rounded-sm', getLevelColor(level))}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

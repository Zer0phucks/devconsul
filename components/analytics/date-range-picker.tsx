/**
 * Date Range Picker Component
 * Allows users to select predefined or custom date ranges
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESET_RANGES = {
  last7days: { label: 'Last 7 days', days: 7 },
  last30days: { label: 'Last 30 days', days: 30 },
  last90days: { label: 'Last 90 days', days: 90 },
  thisMonth: { label: 'This month', type: 'month' },
  lastMonth: { label: 'Last month', type: 'lastMonth' },
  thisYear: { label: 'This year', type: 'year' },
};

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState('last30days');

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);

    const now = new Date();
    let from: Date;
    let to: Date = new Date();

    switch (preset) {
      case 'last7days':
      case 'last30days':
      case 'last90days': {
        const days = PRESET_RANGES[preset as keyof typeof PRESET_RANGES].days as number;
        from = new Date();
        from.setDate(from.getDate() - days);
        break;
      }

      case 'thisMonth': {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }

      case 'lastMonth': {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }

      case 'thisYear': {
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      }

      default:
        from = new Date();
        from.setDate(from.getDate() - 30);
    }

    onChange({ from, to });
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRESET_RANGES).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

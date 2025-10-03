'use client';

/**
 * Newsworthy Events Feed
 * Display AI-detected newsworthy events with impact indicators
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Shield,
  Rocket,
  Bug,
  Zap,
  Trophy,
  FileCode,
  Users,
  ExternalLink,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NewsworthyType =
  | 'MAJOR_RELEASE'
  | 'FEATURE_RELEASE'
  | 'BREAKING_CHANGE'
  | 'SECURITY_FIX'
  | 'CRITICAL_BUGFIX'
  | 'PERFORMANCE_IMPROVEMENT'
  | 'MILESTONE'
  | 'FIRST_RELEASE'
  | 'MAJOR_REFACTOR'
  | 'DOCUMENTATION'
  | 'COLLABORATION'
  | 'CUSTOM';

type EventImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface NewsworthyEvent {
  type: NewsworthyType;
  title: string;
  description: string;
  date: Date;
  impact: EventImpact;
  score: number;
  reasoning: string;
  category: string[];
  tags: string[];
  htmlUrl?: string;
}

interface NewsworthyFeedProps {
  events: NewsworthyEvent[];
  maxDisplay?: number;
  onEventClick?: (event: NewsworthyEvent) => void;
}

export function NewsworthyFeed({ events, maxDisplay = 10, onEventClick }: NewsworthyFeedProps) {
  const displayedEvents = events.slice(0, maxDisplay);

  const getEventIcon = (type: NewsworthyType) => {
    switch (type) {
      case 'MAJOR_RELEASE':
      case 'FIRST_RELEASE':
        return Rocket;
      case 'FEATURE_RELEASE':
        return Star;
      case 'BREAKING_CHANGE':
        return AlertTriangle;
      case 'SECURITY_FIX':
        return Shield;
      case 'CRITICAL_BUGFIX':
        return Bug;
      case 'PERFORMANCE_IMPROVEMENT':
        return Zap;
      case 'MILESTONE':
        return Trophy;
      case 'MAJOR_REFACTOR':
      case 'DOCUMENTATION':
        return FileCode;
      case 'COLLABORATION':
        return Users;
      default:
        return Star;
    }
  };

  const getImpactColor = (impact: EventImpact): string => {
    switch (impact) {
      case 'CRITICAL':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900';
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900';
      case 'MEDIUM':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900';
      case 'LOW':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  const getImpactBadgeVariant = (impact: EventImpact): 'default' | 'secondary' | 'destructive' => {
    if (impact === 'CRITICAL') return 'destructive';
    if (impact === 'HIGH') return 'default';
    return 'secondary';
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTypeLabel = (type: NewsworthyType): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsworthy Events</CardTitle>
        <CardDescription>
          AI-detected events worth announcing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No newsworthy events detected in this period.</p>
              <p className="text-sm mt-2">Keep contributing and check back soon!</p>
            </div>
          ) : (
            displayedEvents.map((event, index) => {
              const Icon = getEventIcon(event.type);
              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all',
                    getImpactColor(event.impact),
                    onEventClick && 'cursor-pointer hover:shadow-md'
                  )}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm leading-tight">
                          {event.title}
                        </h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge variant={getImpactBadgeVariant(event.impact)} className="text-xs">
                            {event.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(event.score * 100)}%
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <span>{formatTypeLabel(event.type)}</span>
                        <span>•</span>
                        <span>{formatDate(event.date)}</span>
                      </div>

                      {/* Tags */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {event.tags.slice(0, 5).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* AI Reasoning */}
                      <details className="text-xs text-gray-600 dark:text-gray-400">
                        <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                          AI reasoning
                        </summary>
                        <p className="mt-1 pl-4 border-l-2 border-gray-300 dark:border-gray-700">
                          {event.reasoning}
                        </p>
                      </details>

                      {/* View on GitHub link */}
                      {event.htmlUrl && (
                        <div className="mt-2">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(event.htmlUrl, '_blank');
                            }}
                          >
                            View on GitHub
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Activity Timeline Component
 * Interactive timeline of repository events with filtering
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitCommit,
  GitPullRequest,
  GitMerge,
  AlertCircle,
  Tag,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActivityType = 'commit' | 'pull_request' | 'issue' | 'release' | 'merge' | 'comment';
type ActivityStatus = 'open' | 'closed' | 'merged' | 'completed';

interface TimelineEvent {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  author: {
    login: string;
    name?: string;
    avatarUrl?: string;
  };
  timestamp: Date;
  status?: ActivityStatus;
  htmlUrl?: string;
  metadata?: {
    additions?: number;
    deletions?: number;
    changedFiles?: number;
    labels?: string[];
    sha?: string;
  };
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  maxDisplay?: number;
  onEventClick?: (event: TimelineEvent) => void;
}

export function ActivityTimeline({ events, maxDisplay = 50, onEventClick }: ActivityTimelineProps) {
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  // Extract unique authors
  const authors = useMemo(() => {
    const uniqueAuthors = new Map<string, string>();
    events.forEach(event => {
      if (!uniqueAuthors.has(event.author.login)) {
        uniqueAuthors.set(event.author.login, event.author.name || event.author.login);
      }
    });
    return Array.from(uniqueAuthors.entries()).map(([login, name]) => ({ login, name }));
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (authorFilter !== 'all') {
      filtered = filtered.filter(e => e.author.login === authorFilter);
    }

    return filtered;
  }, [events, typeFilter, statusFilter, authorFilter]);

  const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, maxDisplay);

  const getEventIcon = (type: ActivityType) => {
    switch (type) {
      case 'commit':
        return GitCommit;
      case 'pull_request':
        return GitPullRequest;
      case 'merge':
        return GitMerge;
      case 'issue':
        return AlertCircle;
      case 'release':
        return Tag;
      case 'comment':
        return MessageSquare;
      default:
        return GitCommit;
    }
  };

  const getStatusIcon = (status?: ActivityStatus) => {
    switch (status) {
      case 'merged':
        return GitMerge;
      case 'closed':
        return XCircle;
      case 'completed':
        return CheckCircle2;
      default:
        return null;
    }
  };

  const getEventColor = (type: ActivityType): string => {
    switch (type) {
      case 'commit':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'pull_request':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
      case 'merge':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950';
      case 'issue':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
      case 'release':
        return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950';
      case 'comment':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900';
    }
  };

  const getStatusBadgeVariant = (status?: ActivityStatus): 'default' | 'secondary' | 'destructive' => {
    if (status === 'merged' || status === 'completed') return 'default';
    if (status === 'closed') return 'destructive';
    return 'secondary';
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTypeLabel = (type: ActivityType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          Recent repository activity with filtering
        </CardDescription>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ActivityType | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="commit">Commits</SelectItem>
              <SelectItem value="pull_request">Pull Requests</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="release">Releases</SelectItem>
              <SelectItem value="merge">Merges</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActivityStatus | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map(author => (
                <SelectItem key={author.login} value={author.login}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(typeFilter !== 'all' || statusFilter !== 'all' || authorFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setAuthorFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {displayedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No events match the current filters.</p>
              <p className="text-sm mt-2">Try adjusting your filter criteria.</p>
            </div>
          ) : (
            <>
              {/* Timeline */}
              <div className="relative space-y-4">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {displayedEvents.map((event, index) => {
                  const Icon = getEventIcon(event.type);
                  const StatusIcon = getStatusIcon(event.status);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'relative pl-12 pb-4',
                        onEventClick && 'cursor-pointer',
                        index === displayedEvents.length - 1 && 'pb-0'
                      )}
                      onClick={() => onEventClick?.(event)}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border-2 border-white dark:border-gray-950',
                          getEventColor(event.type)
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="bg-white dark:bg-gray-900 rounded-lg border p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm leading-tight truncate">
                                {event.title}
                              </h4>
                              {StatusIcon && (
                                <StatusIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {formatTypeLabel(event.type)}
                            </Badge>
                            {event.status && (
                              <Badge variant={getStatusBadgeVariant(event.status)} className="text-xs">
                                {event.status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span className="font-medium">{event.author.name || event.author.login}</span>
                          <span>•</span>
                          <span>{formatTimestamp(event.timestamp)}</span>
                          {event.metadata?.changedFiles && (
                            <>
                              <span>•</span>
                              <span>{event.metadata.changedFiles} files</span>
                            </>
                          )}
                          {event.metadata?.additions !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 dark:text-green-400">
                                +{event.metadata.additions}
                              </span>
                              <span className="text-red-600 dark:text-red-400">
                                -{event.metadata.deletions}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Labels */}
                        {event.metadata?.labels && event.metadata.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {event.metadata.labels.slice(0, 5).map((label, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* View link */}
                        {event.htmlUrl && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more button */}
              {!showAll && filteredEvents.length > maxDisplay && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAll(true)}
                  >
                    Show All ({filteredEvents.length - maxDisplay} more)
                  </Button>
                </div>
              )}

              {/* Results count */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                Showing {displayedEvents.length} of {filteredEvents.length} events
                {filteredEvents.length !== events.length && ` (${events.length} total)`}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

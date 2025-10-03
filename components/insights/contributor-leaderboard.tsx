'use client';

/**
 * Contributor Leaderboard Component
 * Displays top contributors with stats
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Contributor {
  login: string;
  name?: string;
  avatarUrl?: string;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  linesAdded: number;
  linesDeleted: number;
  impactScore: number;
}

interface ContributorLeaderboardProps {
  contributors: Contributor[];
  maxDisplay?: number;
}

export function ContributorLeaderboard({ contributors, maxDisplay = 10 }: ContributorLeaderboardProps) {
  const topContributors = contributors.slice(0, maxDisplay);
  const maxImpactScore = Math.max(...contributors.map(c => c.impactScore), 1);

  const getImpactBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'default';
    return 'secondary';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Contributors</CardTitle>
        <CardDescription>
          Most impactful contributors in this period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topContributors.map((contributor, index) => (
            <div key={contributor.login} className="flex items-start gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold">
                #{index + 1}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src={contributor.avatarUrl} alt={contributor.login} />
                <AvatarFallback>{contributor.login.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {contributor.name || contributor.login}
                  </p>
                  <Badge variant={getImpactBadgeVariant(contributor.impactScore)}>
                    {contributor.impactScore}
                  </Badge>
                </div>

                {contributor.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    @{contributor.login}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <div>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {contributor.commits}
                    </span>{' '}
                    commits
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {contributor.pullRequests}
                    </span>{' '}
                    PRs
                  </div>
                  <div>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {contributor.issues}
                    </span>{' '}
                    issues
                  </div>
                  <div>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatNumber(contributor.linesAdded + contributor.linesDeleted)}
                    </span>{' '}
                    lines
                  </div>
                </div>

                {/* Impact progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Impact Score</span>
                    <span className="font-medium">{contributor.impactScore}/100</span>
                  </div>
                  <Progress
                    value={(contributor.impactScore / maxImpactScore) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

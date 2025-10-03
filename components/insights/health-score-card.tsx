'use client';

/**
 * Repository Health Score Card
 * Visual representation of repository health metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, CheckCircle, Zap, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthFactors {
  activityScore: number;
  collaborationScore: number;
  qualityScore: number;
  velocityScore: number;
  maintenanceScore: number;
}

interface HealthScoreCardProps {
  overallScore: number;
  factors: HealthFactors;
}

export function HealthScoreCard({ overallScore, factors }: HealthScoreCardProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const factorDetails = [
    {
      name: 'Activity',
      score: factors.activityScore,
      icon: Activity,
      description: 'Commit frequency and consistency',
    },
    {
      name: 'Collaboration',
      score: factors.collaborationScore,
      icon: Users,
      description: 'PR merge rate and contributor diversity',
    },
    {
      name: 'Quality',
      score: factors.qualityScore,
      icon: CheckCircle,
      description: 'Review time and issue resolution',
    },
    {
      name: 'Velocity',
      score: factors.velocityScore,
      icon: Zap,
      description: 'Development speed and momentum',
    },
    {
      name: 'Maintenance',
      score: factors.maintenanceScore,
      icon: Wrench,
      description: 'Issue management and updates',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repository Health</CardTitle>
        <CardDescription>
          Overall health score and contributing factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className={cn('text-6xl font-bold mb-2', getScoreColor(overallScore))}>
              {overallScore}
            </div>
            <Badge variant="outline" className="mb-1">
              {getHealthLabel(overallScore)}
            </Badge>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              out of 100
            </p>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <Progress
              value={overallScore}
              className="h-3"
              indicatorClassName={getScoreBgColor(overallScore)}
            />
          </div>

          {/* Factor Breakdown */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold">Health Factors</h4>
            {factorDetails.map((factor) => {
              const Icon = factor.icon;
              return (
                <div key={factor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{factor.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {factor.description}
                        </p>
                      </div>
                    </div>
                    <span className={cn('text-sm font-semibold', getScoreColor(factor.score))}>
                      {factor.score}
                    </span>
                  </div>
                  <Progress
                    value={factor.score}
                    className="h-2"
                    indicatorClassName={getScoreBgColor(factor.score)}
                  />
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {factors.activityScore < 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Increase commit frequency to maintain momentum</span>
                </li>
              )}
              {factors.collaborationScore < 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Encourage more contributors and code reviews</span>
                </li>
              )}
              {factors.qualityScore < 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Improve PR review time and issue resolution speed</span>
                </li>
              )}
              {factors.maintenanceScore < 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Address stale issues and keep dependencies updated</span>
                </li>
              )}
              {overallScore >= 80 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Excellent health! Keep up the great work.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

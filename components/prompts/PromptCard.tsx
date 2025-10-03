'use client';

/**
 * Prompt Card Component
 * Display prompt summary with effectiveness metrics
 */

import type { Platform } from '@prisma/client';
import {
  FileText,
  Star,
  TrendingUp,
  Zap,
  Copy,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL_UPDATE: 'Technical Update',
  FEATURE_ANNOUNCEMENT: 'Feature Announcement',
  BUG_FIX: 'Bug Fix',
  RELEASE_NOTES: 'Release Notes',
  TUTORIAL: 'Tutorial',
  CASE_STUDY: 'Case Study',
  WEEKLY_DIGEST: 'Weekly Digest',
  MONTHLY_SUMMARY: 'Monthly Summary',
  PRODUCT_UPDATE: 'Product Update',
  COMMUNITY_UPDATE: 'Community Update',
  CUSTOM: 'Custom',
};

const PLATFORM_LABELS: Record<Platform, string> = {
  BLOG: 'Blog',
  NEWSLETTER: 'Newsletter',
  TWITTER: 'Twitter',
  LINKEDIN: 'LinkedIn',
  DEVTO: 'Dev.to',
  HASHNODE: 'Hashnode',
};

interface PromptCardProps {
  prompt: {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    platform: Platform;
    isDefault: boolean;
    isPublic: boolean;
    usageCount: number;
    averageRating: number | null;
    successRate: number | null;
    version: number;
    updatedAt: Date;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUse?: (id: string) => void;
}

export function PromptCard({
  prompt,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
}: PromptCardProps) {
  const getEffectivenessColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return 'bg-green-500';
    if (rate >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{prompt.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {PLATFORM_LABELS[prompt.platform]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[prompt.category]}
              </Badge>
              {prompt.isDefault && (
                <Badge variant="default" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
              {prompt.isPublic && (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(prompt.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onUse && (
                <DropdownMenuItem onClick={() => onUse(prompt.id)}>
                  <Zap className="w-4 h-4 mr-2" />
                  Use Prompt
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(prompt.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onEdit && !prompt.isDefault && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(prompt.id)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && !prompt.isDefault && (
                <DropdownMenuItem
                  onClick={() => onDelete(prompt.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        {/* Description */}
        {prompt.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {prompt.description}
          </p>
        )}

        {/* Effectiveness Metrics */}
        {prompt.usageCount > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Average Rating */}
              {prompt.averageRating !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${getEffectivenessColor(prompt.averageRating)}`} />
                    <span className={`font-semibold ${getEffectivenessColor(prompt.averageRating)}`}>
                      {prompt.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">rating</span>
                </div>
              )}

              {/* Usage Count */}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">{prompt.usageCount}</span>
                <span className="text-xs text-gray-500">uses</span>
              </div>
            </div>

            {/* Success Rate */}
            {prompt.successRate !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">
                    {(prompt.successRate * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={prompt.successRate * 100}
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* No usage yet */}
        {prompt.usageCount === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
            <TrendingUp className="w-4 h-4" />
            <span>Not used yet</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FileText className="w-3 h-3" />
          <span>v{prompt.version}</span>
          <span>•</span>
          <span>
            Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
          </span>
        </div>

        {prompt.usageCount > 5 && prompt.averageRating && prompt.averageRating >= 4 && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            <span>High performing</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

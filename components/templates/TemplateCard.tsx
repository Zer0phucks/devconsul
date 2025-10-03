'use client';

/**
 * Template Card Component
 * Display template summary with actions
 */

import type { Platform } from '@prisma/client';
import {
  FileText,
  Mail,
  MessageSquare,
  Linkedin,
  Globe,
  Calendar,
  Star,
  Copy,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
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
import { formatDistanceToNow } from 'date-fns';

const PLATFORM_CONFIG: Record<Platform, { icon: React.ComponentType<any>; color: string; label: string }> = {
  BLOG: { icon: FileText, color: 'text-blue-600 bg-blue-50', label: 'Blog' },
  NEWSLETTER: { icon: Mail, color: 'text-purple-600 bg-purple-50', label: 'Newsletter' },
  TWITTER: { icon: MessageSquare, color: 'text-sky-600 bg-sky-50', label: 'Twitter' },
  LINKEDIN: { icon: Linkedin, color: 'text-blue-700 bg-blue-50', label: 'LinkedIn' },
  DEVTO: { icon: Globe, color: 'text-gray-800 bg-gray-50', label: 'Dev.to' },
  HASHNODE: { icon: Globe, color: 'text-blue-500 bg-blue-50', label: 'Hashnode' },
};

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description?: string | null;
    platform: Platform;
    isDefault: boolean;
    usageCount: number;
    updatedAt: Date;
    _count?: {
      prompts: number;
    };
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUse?: (id: string) => void;
}

export function TemplateCard({
  template,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
}: TemplateCardProps) {
  const platformConfig = PLATFORM_CONFIG[template.platform];
  const PlatformIcon = platformConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${platformConfig.color}`}>
              <PlatformIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {platformConfig.label}
                </Badge>
                {template.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
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
                <DropdownMenuItem onClick={() => onView(template.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
              )}
              {onUse && (
                <DropdownMenuItem onClick={() => onUse(template.id)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Use Template
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onEdit && !template.isDefault && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(template.id)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && !template.isDefault && (
                <DropdownMenuItem
                  onClick={() => onDelete(template.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {template.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="w-4 h-4" />
            <span>{template._count?.prompts || 0} prompts</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Copy className="w-4 h-4" />
            <span>{template.usageCount} uses</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

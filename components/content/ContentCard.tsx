"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Copy,
  Edit,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";
import { ContentStatus, PlatformType } from "@prisma/client";
import { platformIcons, platformColors, statusColors } from "@/lib/validations/content";

interface Publication {
  id: string;
  platformId: string;
  platformType: PlatformType;
  platformName: string;
  status: string;
  publishedAt: Date | null;
  platformUrl: string | null;
}

interface Content {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  isAIGenerated: boolean;
  aiModel: string | null;
  publications: Publication[];
}

interface ContentCardProps {
  content: Content;
  platform?: PlatformType;
  onCopy?: (content: Content) => Promise<void>;
  onEdit?: (content: Content) => void;
  onPublish?: (content: Content) => Promise<void>;
}

export function ContentCard({
  content,
  platform,
  onCopy,
  onEdit,
  onPublish,
}: ContentCardProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    if (!onCopy) return;
    setIsCopying(true);
    try {
      await onCopy(content);
    } finally {
      setIsCopying(false);
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish(content);
    } finally {
      setIsPublishing(false);
    }
  };

  const statusIcon = {
    DRAFT: FileText,
    SCHEDULED: Clock,
    PUBLISHED: CheckCircle2,
    FAILED: XCircle,
    ARCHIVED: FileText,
  }[content.status];

  const StatusIcon = statusIcon;
  const statusColor = statusColors[content.status];

  const preview = content.excerpt || content.body.substring(0, 150);
  const wordCount = content.body.split(/\s+/).length;
  const charCount = content.body.length;

  const platformColor = platform ? platformColors[platform] : "gray";

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {content.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(content.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-50 text-${statusColor}-700 flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {content.status}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-3">
          <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-3"}`}>
            {isExpanded ? content.body : preview}
            {preview.length < content.body.length && !isExpanded && "..."}
          </p>
          {content.body.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
          {content.isAIGenerated && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                AI ({content.aiModel})
              </span>
            </>
          )}
        </div>

        {/* Publication Status */}
        {content.publications.length > 0 && (
          <div className="mb-3 text-xs">
            <p className="text-gray-600 mb-1">
              Published to {content.publications.length} platform
              {content.publications.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1">
              {content.publications.slice(0, 3).map((pub) => (
                <span
                  key={pub.id}
                  className={`px-2 py-0.5 rounded bg-${platformColors[pub.platformType]}-50 text-${platformColors[pub.platformType]}-700`}
                >
                  {pub.platformName}
                </span>
              ))}
              {content.publications.length > 3 && (
                <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-700">
                  +{content.publications.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={isCopying}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            aria-label="Copy content"
          >
            <Copy className="w-3.5 h-3.5" />
            {isCopying ? "Copying..." : "Copy"}
          </button>
          <button
            onClick={() => onEdit?.(content)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Edit content"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || content.status === "PUBLISHED"}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            aria-label="Publish content"
          >
            <Send className="w-3.5 h-3.5" />
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

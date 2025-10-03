"use client";

import { useState } from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { platformIcons, platformColors } from "@/lib/validations/content";
import { PlatformType } from "@prisma/client";

interface ContentItem {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: string;
  createdAt: Date;
  publications: {
    platformType: PlatformType;
    platformName: string;
    status: string;
  }[];
}

interface GroupedContent {
  date: string;
  label: string;
  items: ContentItem[];
}

interface ContentHistoryProps {
  content: ContentItem[];
  onCopy?: (content: ContentItem) => Promise<void>;
  onEdit?: (content: ContentItem) => void;
  onView?: (content: ContentItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function ContentHistory({
  content,
  onCopy,
  onEdit,
  onView,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: ContentHistoryProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["today"])
  );

  // Group content by date
  const groupedContent: GroupedContent[] = content.reduce(
    (groups: GroupedContent[], item) => {
      const date = new Date(item.createdAt);
      let dateKey: string;
      let label: string;

      if (isToday(date)) {
        dateKey = "today";
        label = "Today";
      } else if (isYesterday(date)) {
        dateKey = "yesterday";
        label = "Yesterday";
      } else {
        dateKey = format(date, "yyyy-MM-dd");
        label = format(date, "MMM d, yyyy");
      }

      const existingGroup = groups.find((g) => g.date === dateKey);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({
          date: dateKey,
          label,
          items: [item],
        });
      }

      return groups;
    },
    []
  );

  const toggleGroup = (dateKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const handleCopy = async (item: ContentItem) => {
    if (onCopy) {
      await onCopy(item);
      // Show toast notification
      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-md text-sm";
      toast.textContent = "Copied to clipboard!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
      </div>

      {/* Content Groups */}
      <div className="divide-y divide-gray-200">
        {groupedContent.map((group) => {
          const isExpanded = expandedGroups.has(group.date);

          return (
            <div key={group.date}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.date)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({group.items.length} item{group.items.length !== 1 ? "s" : ""})
                  </span>
                </div>
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {/* Platform Icons */}
                      <div className="flex-shrink-0 mt-0.5">
                        {item.publications.length > 0 ? (
                          <div className="flex -space-x-1">
                            {item.publications.slice(0, 3).map((pub, idx) => (
                              <div
                                key={idx}
                                className={`w-6 h-6 rounded-full bg-${platformColors[pub.platformType]}-100 border-2 border-white flex items-center justify-center`}
                                title={pub.platformName}
                              >
                                <span className="text-xs">
                                  {pub.platformType.substring(0, 1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white"></div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.excerpt || item.body.substring(0, 80)}...
                        </p>
                        {item.publications.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-gray-600">
                              Published to {item.publications.length} platform
                              {item.publications.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(item)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit?.(item)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onView?.(item)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

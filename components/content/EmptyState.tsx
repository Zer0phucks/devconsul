"use client";

import { FileText, Search, Filter } from "lucide-react";

interface EmptyStateProps {
  variant: "no-content" | "no-search-results" | "no-filter-results";
  onAction?: () => void;
}

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const config = {
    "no-content": {
      icon: FileText,
      title: "No content generated yet",
      description: "Start by generating your first piece of content",
      actionLabel: "Generate Content",
      secondaryText: "Content will appear here once you create it",
    },
    "no-search-results": {
      icon: Search,
      title: "No content found",
      description: "No content matches your search query",
      actionLabel: "Clear Search",
      secondaryText: "Try adjusting your search terms",
    },
    "no-filter-results": {
      icon: Filter,
      title: "No content found",
      description: "No content matches your current filters",
      actionLabel: "Reset Filters",
      secondaryText: "Try adjusting your filter criteria",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">{config.description}</p>

        {/* Action Button */}
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {config.actionLabel}
          </button>
        )}

        {/* Secondary Text */}
        <p className="mt-4 text-xs text-gray-500">{config.secondaryText}</p>
      </div>
    </div>
  );
}

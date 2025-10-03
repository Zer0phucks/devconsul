"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { EmptyState } from "./EmptyState";
import { PlatformType } from "@prisma/client";

interface RecentContentCardsProps {
  projectId: string;
  onCopy?: (content: any) => Promise<void>;
  onEdit?: (content: any) => void;
  onPublish?: (content: any) => Promise<void>;
}

export function RecentContentCards({
  projectId,
  onCopy,
  onEdit,
  onPublish,
}: RecentContentCardsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentContent();
  }, [projectId]);

  const fetchRecentContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/content/recent`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      setContent(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">
            Loading recent content...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <EmptyState
        variant="no-content"
        onAction={() => window.location.href = `/dashboard/projects/${projectId}/generate`}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Most Recent</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Expand</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Content Grid */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                onCopy={onCopy}
                onEdit={onEdit}
                onPublish={onPublish}
              />
            ))}
          </div>
          {content.length === 6 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                + more content available in history below
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

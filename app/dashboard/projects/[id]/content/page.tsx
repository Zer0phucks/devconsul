"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { RecentContentCards } from "@/components/content/RecentContentCards";
import { ContentHistory } from "@/components/content/ContentHistory";
import { ContentFilters } from "@/components/content/ContentFilters";
import { EmptyState } from "@/components/content/EmptyState";

interface ContentPageProps {
  params: Promise<{ id: string }>;
}

export default function ContentPage({ params }: ContentPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchContent();
  }, [projectId, filters]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "")
        ),
      });

      const response = await fetch(
        `/api/projects/${projectId}/content?${queryParams}`
      );
      if (!response.ok) throw new Error("Failed to fetch content");

      const data = await response.json();
      setContent(data.items || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (item: any) => {
    try {
      await navigator.clipboard.writeText(item.body);
      // Toast notification handled in component
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleEdit = (item: any) => {
    router.push(`/dashboard/projects/${projectId}/content/${item.id}/edit`);
  };

  const handleView = (item: any) => {
    router.push(`/dashboard/projects/${projectId}/content/${item.id}`);
  };

  const handlePublish = async (item: any) => {
    try {
      // TODO: Implement publish logic
      console.log("Publishing:", item.id);
    } catch (error) {
      console.error("Failed to publish:", error);
    }
  };

  const handleLoadMore = () => {
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage all your generated content
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/projects/${projectId}/generate`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6">
          <ContentFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Most Recent Content */}
        <div className="mb-8">
          <RecentContentCards
            projectId={projectId}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onPublish={handlePublish}
          />
        </div>

        {/* Historical Content */}
        {isLoading && content.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">
                Loading content...
              </span>
            </div>
          </div>
        ) : content.length === 0 ? (
          <EmptyState
            variant={
              Object.keys(filters).some((k) => filters[k])
                ? filters.search
                  ? "no-search-results"
                  : "no-filter-results"
                : "no-content"
            }
            onAction={
              Object.keys(filters).some((k) => filters[k])
                ? handleResetFilters
                : () => router.push(`/dashboard/projects/${projectId}/generate`)
            }
          />
        ) : (
          <ContentHistory
            content={content}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onView={handleView}
            onLoadMore={handleLoadMore}
            hasMore={pagination.page < pagination.totalPages}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

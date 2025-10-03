"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { platformIcons, platformColors, statusColors } from "@/lib/validations/content";

interface ContentDetailPageProps {
  params: Promise<{ id: string; contentId: string }>;
}

export default function ContentDetailPage({ params }: ContentDetailPageProps) {
  const resolvedParams = use(params);
  const { id: projectId, contentId } = resolvedParams;
  const router = useRouter();

  const [content, setContent] = useState<any | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
    fetchVersions();
  }, [contentId]);

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content.body);
      // Show toast
      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-md text-sm z-50";
      toast.textContent = "Copied to clipboard!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDelete = async () => {
    if (!content) return;
    if (!confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/content/${contentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete content");
      router.push(`/dashboard/projects/${projectId}/content`);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete content");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Content not found</h2>
          <p className="mt-2 text-sm text-gray-600">
            The content you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusIcon = {
    DRAFT: Clock,
    SCHEDULED: Clock,
    PUBLISHED: CheckCircle2,
    FAILED: XCircle,
    ARCHIVED: Clock,
  }[content.status];

  const StatusIcon = statusIcon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to content
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-${statusColors[content.status]}-50 text-${statusColors[content.status]}-700`}>
                  <StatusIcon className="w-4 h-4" />
                  {content.status}
                </span>
                {content.isAIGenerated && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    AI Generated ({content.aiModel})
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy content"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push(`/dashboard/projects/${projectId}/content/${contentId}/edit`)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Edit content"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="prose prose-sm max-w-none">
            {content.body.split("\n").map((paragraph: string, idx: number) => (
              <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Metadata */}
          <div className="lg:col-span-2 space-y-6">
            {/* Publication Tracking */}
            {content.publications.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Publication Status
                </h2>
                <div className="space-y-3">
                  {content.publications.map((pub: any) => (
                    <div
                      key={pub.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-${platformColors[pub.platformType]}-100 flex items-center justify-center`}>
                          <span className="text-xs font-medium">
                            {pub.platformType.substring(0, 1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pub.platformName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pub.publishedAt
                              ? `Published ${format(new Date(pub.publishedAt), "MMM d, yyyy 'at' h:mm a")}`
                              : pub.status}
                          </p>
                        </div>
                      </div>
                      {pub.platformUrl && (
                        <a
                          href={pub.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Version History */}
            {versions.length > 1 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Version History
                </h2>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version.id)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        version.id === contentId
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Version {version.version}
                            {version.id === contentId && " (Current)"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Metadata
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(content.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(content.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  </dd>
                </div>
                {content.publishedAt && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Published</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(content.publishedAt), "MMM d, yyyy 'at' h:mm a")}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500">Word Count</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {content.body.split(/\s+/).length} words
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Character Count</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {content.body.length} characters
                  </dd>
                </div>
                {content.tags.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 mb-2">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {content.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

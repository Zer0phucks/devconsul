import { Button } from "./button";
import { cn } from "@/lib/utils";
import {
  FileText,
  FolderOpen,
  Link2,
  Calendar,
  BarChart3,
  Search,
  Filter,
  Inbox,
  Plus,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Generic empty state component
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            className="gap-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {action.label}
          </Button>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Preset: No projects created yet
 */
export function NoProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No projects yet"
      description="Get started by creating your first project. Projects help you organize your content and publishing workflow."
      action={{
        label: "Create Project",
        onClick: onCreate,
      }}
    />
  );
}

/**
 * Preset: No content generated
 */
export function NoContentEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No content yet"
      description="Start creating content for your project. Use AI to generate blog posts, social media content, and more."
      action={{
        label: "Generate Content",
        onClick: onGenerate,
      }}
    />
  );
}

/**
 * Preset: No platforms connected
 */
export function NoPlatformsEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={Link2}
      title="No platforms connected"
      description="Connect your publishing platforms to start distributing your content. We support Medium, Dev.to, Hashnode, and more."
      action={{
        label: "Connect Platform",
        onClick: onConnect,
      }}
    />
  );
}

/**
 * Preset: No scheduled content
 */
export function NoScheduledContentEmptyState({
  onSchedule,
}: {
  onSchedule: () => void;
}) {
  return (
    <EmptyState
      icon={Calendar}
      title="No scheduled content"
      description="Schedule your content for automatic publishing across all your connected platforms."
      action={{
        label: "Schedule Content",
        onClick: onSchedule,
      }}
    />
  );
}

/**
 * Preset: No analytics data
 */
export function NoAnalyticsEmptyState() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No analytics data yet"
      description="Analytics will appear here once you start publishing content. We'll track views, engagement, and performance across all platforms."
    />
  );
}

/**
 * Preset: Search no results
 */
export function SearchNoResultsEmptyState({
  searchQuery,
  onClear,
}: {
  searchQuery: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${searchQuery}". Try adjusting your search terms.`}
      action={{
        label: "Clear Search",
        onClick: onClear,
        variant: "outline",
      }}
    />
  );
}

/**
 * Preset: Filtered list no results
 */
export function FilteredNoResultsEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <EmptyState
      icon={Filter}
      title="No matches found"
      description="No items match your current filters. Try adjusting or clearing your filters to see more results."
      action={{
        label: "Clear Filters",
        onClick: onClearFilters,
        variant: "outline",
      }}
    />
  );
}

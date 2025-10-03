import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Card skeleton with image, title, and text placeholders
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading card">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 py-3" role="status" aria-label="Loading table row">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

/**
 * Table skeleton with multiple rows
 */
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

/**
 * Avatar + text skeleton (for user lists, comments, etc.)
 */
function AvatarTextSkeleton() {
  return (
    <div className="flex items-center gap-3" role="status" aria-label="Loading user">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Chart skeleton placeholder
 */
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label="Loading chart"
    >
      <div className="flex justify-between items-end h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-12"
            style={{ height: `${Math.random() * 100 + 50}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form skeleton
 */
function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * List skeleton
 */
function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading list">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Page header skeleton
 */
function PageHeaderSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading page header">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  AvatarTextSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
};

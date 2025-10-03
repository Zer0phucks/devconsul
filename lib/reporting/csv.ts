/**
 * CSV Export Utilities
 *
 * Streaming CSV export for large datasets to prevent memory issues
 */

import { Readable } from "stream";
import { prisma } from "@/lib/db";
import type { PlatformType } from "@prisma/client";

/**
 * CSV export options
 */
export interface CSVExportOptions {
  projectId: string;
  dateFrom?: Date;
  dateTo?: Date;
  platformFilters?: PlatformType[];
  includeMetadata?: boolean;
  delimiter?: string;
  includeHeaders?: boolean;
}

/**
 * Content history record for CSV export
 */
interface ContentHistoryRecord {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  createdAt: Date;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  sourceType: string;
  isAIGenerated: boolean;
  aiModel: string | null;
  tags: string[];
  categories: string[];
  platforms: string[];
  publicationStatus: Record<string, string>;
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Check if escaping is needed
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert record to CSV row
 */
function recordToCSVRow(
  record: ContentHistoryRecord,
  options: CSVExportOptions
): string {
  const delimiter = options.delimiter || ",";

  const fields = [
    record.id,
    record.title,
    record.slug || "",
    record.status,
    record.createdAt.toISOString(),
    record.publishedAt?.toISOString() || "",
    record.scheduledFor?.toISOString() || "",
    record.sourceType,
    record.isAIGenerated ? "Yes" : "No",
    record.aiModel || "",
    record.tags.join("; "),
    record.categories.join("; "),
    record.platforms.join("; "),
  ];

  if (options.includeMetadata) {
    const platformStatuses = record.platforms
      .map((p) => `${p}: ${record.publicationStatus[p] || "N/A"}`)
      .join("; ");
    fields.push(platformStatuses);
  }

  return fields.map(escapeCSV).join(delimiter);
}

/**
 * Get CSV headers
 */
function getCSVHeaders(options: CSVExportOptions): string {
  const delimiter = options.delimiter || ",";

  const headers = [
    "ID",
    "Title",
    "Slug",
    "Status",
    "Created At",
    "Published At",
    "Scheduled For",
    "Source Type",
    "AI Generated",
    "AI Model",
    "Tags",
    "Categories",
    "Platforms",
  ];

  if (options.includeMetadata) {
    headers.push("Publication Status");
  }

  return headers.map(escapeCSV).join(delimiter);
}

/**
 * Export content history to CSV with streaming
 *
 * Returns a readable stream for memory-efficient large exports
 */
export async function exportContentHistoryCSV(
  options: CSVExportOptions
): Promise<Readable> {
  const batchSize = 100; // Process in batches
  let skip = 0;
  let hasMore = true;

  const stream = new Readable({
    async read() {
      try {
        if (!hasMore) {
          this.push(null); // End stream
          return;
        }

        // First chunk includes headers
        if (skip === 0 && options.includeHeaders !== false) {
          this.push(getCSVHeaders(options) + "\n");
        }

        // Build query filters
        const where: any = {
          projectId: options.projectId,
        };

        if (options.dateFrom || options.dateTo) {
          where.createdAt = {};
          if (options.dateFrom) {
            where.createdAt.gte = options.dateFrom;
          }
          if (options.dateTo) {
            where.createdAt.lte = options.dateTo;
          }
        }

        // Fetch batch of content
        const contentBatch = await prisma.content.findMany({
          where,
          skip,
          take: batchSize,
          orderBy: { createdAt: "desc" },
          include: {
            publications: {
              include: {
                platform: true,
              },
            },
          },
        });

        // Check if more data exists
        hasMore = contentBatch.length === batchSize;
        skip += batchSize;

        if (contentBatch.length === 0) {
          this.push(null); // End stream
          return;
        }

        // Convert batch to CSV rows
        for (const content of contentBatch) {
          // Filter by platforms if specified
          const platforms = content.publications.map((p) => p.platform.type);

          if (
            options.platformFilters &&
            options.platformFilters.length > 0 &&
            !platforms.some((p) => options.platformFilters!.includes(p))
          ) {
            continue; // Skip if platform filter doesn't match
          }

          const publicationStatus: Record<string, string> = {};
          content.publications.forEach((pub) => {
            publicationStatus[pub.platform.type] = pub.status;
          });

          const record: ContentHistoryRecord = {
            id: content.id,
            title: content.title,
            slug: content.slug,
            status: content.status,
            createdAt: content.createdAt,
            publishedAt: content.publishedAt,
            scheduledFor: content.scheduledFor,
            sourceType: content.sourceType,
            isAIGenerated: content.isAIGenerated,
            aiModel: content.aiModel,
            tags: content.tags,
            categories: content.categories,
            platforms,
            publicationStatus,
          };

          this.push(recordToCSVRow(record, options) + "\n");
        }
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });

  return stream;
}

/**
 * Export analytics snapshot to CSV
 */
export async function exportAnalyticsCSV(
  projectId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<Readable> {
  const stream = new Readable({
    async read() {
      try {
        // Headers
        this.push("Metric,Value,Period\n");

        // Fetch content stats
        const totalContent = await prisma.content.count({
          where: {
            projectId,
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        });

        const publishedContent = await prisma.content.count({
          where: {
            projectId,
            status: "PUBLISHED",
            publishedAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        });

        const aiGeneratedContent = await prisma.content.count({
          where: {
            projectId,
            isAIGenerated: true,
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        });

        // Platform publications
        const publications = await prisma.contentPublication.groupBy({
          by: ["status"],
          where: {
            content: {
              projectId,
            },
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          _count: true,
        });

        const period = `${dateFrom.toISOString().split("T")[0]} to ${dateTo.toISOString().split("T")[0]}`;

        // Write metrics
        this.push(`Total Content,${totalContent},${period}\n`);
        this.push(`Published Content,${publishedContent},${period}\n`);
        this.push(`AI Generated,${aiGeneratedContent},${period}\n`);

        publications.forEach((pub) => {
          this.push(`Publications ${pub.status},${pub._count},${period}\n`);
        });

        this.push(null); // End stream
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });

  return stream;
}

/**
 * Export scheduled content calendar to CSV
 */
export async function exportScheduledContentCSV(
  projectId: string
): Promise<Readable> {
  const stream = new Readable({
    async read() {
      try {
        // Headers
        this.push("Title,Scheduled Time,Timezone,Platforms,Status,Content ID\n");

        // Fetch scheduled content
        const scheduled = await prisma.scheduledContent.findMany({
          where: {
            projectId,
            status: {
              in: ["SCHEDULED", "ACTIVE"],
            },
          },
          include: {
            content: {
              select: {
                title: true,
                id: true,
              },
            },
          },
          orderBy: {
            scheduledFor: "asc",
          },
        });

        // Write rows
        for (const item of scheduled) {
          const row = [
            item.content.title,
            item.scheduledFor.toISOString(),
            item.timezone,
            item.platforms.join("; "),
            item.status,
            item.content.id,
          ];

          this.push(row.map(escapeCSV).join(",") + "\n");
        }

        this.push(null); // End stream
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });

  return stream;
}

/**
 * Helper to stream CSV to file
 */
export async function streamCSVToFile(
  stream: Readable,
  filePath: string
): Promise<number> {
  const fs = await import("fs");
  const writeStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    let bytesWritten = 0;

    stream.on("data", (chunk) => {
      bytesWritten += chunk.length;
    });

    stream.pipe(writeStream);

    writeStream.on("finish", () => {
      resolve(bytesWritten);
    });

    writeStream.on("error", reject);
    stream.on("error", reject);
  });
}

/**
 * Helper to convert stream to string (for small exports)
 */
export async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

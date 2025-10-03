/**
 * Image Library Export
 *
 * Export all project images with metadata in ZIP format
 */

import { prisma } from "@/lib/db";
import archiver from "archiver";
import { createWriteStream, createReadStream } from "fs";
import { Readable } from "stream";
import * as path from "path";

/**
 * Image export options
 */
export interface ImageExportOptions {
  projectId: string;
  includeAIGenerated?: boolean;
  includePlatformVersions?: boolean;
  filterByTags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Image metadata for export
 */
interface ImageExportMetadata {
  id: string;
  filename: string;
  originalName: string;
  storageUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  aspectRatio: number;
  alt: string | null;
  caption: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
  categories: string[];
  isAIGenerated: boolean;
  aiModel: string | null;
  aiPrompt: string | null;
  createdAt: Date;
  usageCount: number;
}

/**
 * Export image library as ZIP archive
 */
export async function exportImageLibraryZIP(
  options: ImageExportOptions,
  outputPath: string
): Promise<{
  fileSize: number;
  imageCount: number;
  metadataFile: string;
}> {
  // Build query filters
  const where: any = {
    projectId: options.projectId,
  };

  if (options.includeAIGenerated === false) {
    where.isAIGenerated = false;
  }

  if (options.filterByTags && options.filterByTags.length > 0) {
    where.tags = {
      hasSome: options.filterByTags,
    };
  }

  if (options.dateFrom || options.dateTo) {
    where.createdAt = {};
    if (options.dateFrom) {
      where.createdAt.gte = options.dateFrom;
    }
    if (options.dateTo) {
      where.createdAt.lte = options.dateTo;
    }
  }

  // Fetch images
  const images = await prisma.image.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Create ZIP archive
  const output = createWriteStream(outputPath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression
  });

  return new Promise((resolve, reject) => {
    let totalSize = 0;

    output.on("close", () => {
      totalSize = archive.pointer();

      resolve({
        fileSize: totalSize,
        imageCount: images.length,
        metadataFile: "metadata.json",
      });
    });

    archive.on("error", (err) => {
      reject(err);
    });

    // Pipe archive to output file
    archive.pipe(output);

    // Add metadata JSON
    const metadata: ImageExportMetadata[] = images.map((img) => ({
      id: img.id,
      filename: img.filename,
      originalName: img.originalName,
      storageUrl: img.storageUrl,
      mimeType: img.mimeType,
      size: img.size,
      width: img.width,
      height: img.height,
      aspectRatio: img.aspectRatio,
      alt: img.alt,
      caption: img.caption,
      title: img.title,
      description: img.description,
      tags: img.tags,
      categories: img.categories,
      isAIGenerated: img.isAIGenerated,
      aiModel: img.aiModel,
      aiPrompt: img.aiPrompt,
      createdAt: img.createdAt,
      usageCount: img.usageCount,
    }));

    archive.append(JSON.stringify(metadata, null, 2), {
      name: "metadata.json",
    });

    // Add README
    const readme = generateReadmeText(images.length, options);
    archive.append(readme, { name: "README.txt" });

    // Add images (download from storage URL)
    // Note: In production, you'd download these from Vercel Blob/R2
    // For now, we'll add placeholder for the structure
    images.forEach((img, index) => {
      // Create directory structure by categories
      const category = img.categories[0] || "uncategorized";
      const filename = img.filename;
      const imagePath = `images/${category}/${filename}`;

      // In production:
      // const imageStream = downloadFromStorage(img.storageUrl);
      // archive.append(imageStream, { name: imagePath });

      // For now, add metadata reference
      archive.append(
        `Image stored at: ${img.storageUrl}\nDownload manually if needed.`,
        { name: `${imagePath}.txt` }
      );
    });

    // Finalize archive
    archive.finalize();
  });
}

/**
 * Generate README for image export
 */
function generateReadmeText(imageCount: number, options: ImageExportOptions): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("FULL SELF PUBLISHING - IMAGE LIBRARY EXPORT");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push(`Export Date: ${new Date().toISOString()}`);
  lines.push(`Total Images: ${imageCount}`);
  lines.push("");

  lines.push("DIRECTORY STRUCTURE:");
  lines.push("  /images/            - All image files organized by category");
  lines.push("  metadata.json       - Complete metadata for all images");
  lines.push("  README.txt          - This file");
  lines.push("");

  lines.push("METADATA FORMAT:");
  lines.push("  Each image entry contains:");
  lines.push("    - id: Unique image identifier");
  lines.push("    - filename: Current filename");
  lines.push("    - originalName: Original upload filename");
  lines.push("    - storageUrl: Cloud storage URL");
  lines.push("    - dimensions: width, height, aspectRatio");
  lines.push("    - alt/caption/title/description: SEO and accessibility text");
  lines.push("    - tags/categories: Organization metadata");
  lines.push("    - AI generation info: model, prompt (if applicable)");
  lines.push("    - usage stats: usageCount, createdAt");
  lines.push("");

  lines.push("FILTER OPTIONS USED:");
  if (options.includeAIGenerated === false) {
    lines.push("  - Excluded AI-generated images");
  }
  if (options.filterByTags && options.filterByTags.length > 0) {
    lines.push(`  - Tags filter: ${options.filterByTags.join(", ")}`);
  }
  if (options.dateFrom) {
    lines.push(`  - From date: ${options.dateFrom.toISOString()}`);
  }
  if (options.dateTo) {
    lines.push(`  - To date: ${options.dateTo.toISOString()}`);
  }
  lines.push("");

  lines.push("USAGE:");
  lines.push("  1. Extract this ZIP archive");
  lines.push("  2. Review metadata.json for image details");
  lines.push("  3. Import images to your destination platform");
  lines.push("  4. Use metadata for proper attribution and organization");
  lines.push("");

  lines.push("For support, visit: https://fullselfpublishing.com/support");
  lines.push("=".repeat(60));

  return lines.join("\n");
}

/**
 * Export image metadata as CSV
 */
export async function exportImageMetadataCSV(
  options: ImageExportOptions
): Promise<string> {
  const where: any = {
    projectId: options.projectId,
  };

  if (options.includeAIGenerated === false) {
    where.isAIGenerated = false;
  }

  if (options.filterByTags && options.filterByTags.length > 0) {
    where.tags = {
      hasSome: options.filterByTags,
    };
  }

  const images = await prisma.image.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  const lines: string[] = [];

  // CSV header
  lines.push(
    "ID,Filename,Original Name,Width,Height,Size (bytes),MIME Type,AI Generated,AI Model,Tags,Categories,Created At,Usage Count,Storage URL"
  );

  // CSV rows
  images.forEach((img) => {
    const row = [
      img.id,
      img.filename,
      img.originalName,
      img.width,
      img.height,
      img.size,
      img.mimeType,
      img.isAIGenerated ? "Yes" : "No",
      img.aiModel || "",
      img.tags.join("; "),
      img.categories.join("; "),
      img.createdAt.toISOString(),
      img.usageCount,
      img.storageUrl,
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`);

    lines.push(row.join(","));
  });

  return lines.join("\n");
}

/**
 * Helper to get image statistics
 */
export async function getImageLibraryStats(projectId: string) {
  const [
    totalImages,
    aiGeneratedCount,
    totalSize,
    usedImages,
  ] = await Promise.all([
    prisma.image.count({
      where: { projectId },
    }),
    prisma.image.count({
      where: { projectId, isAIGenerated: true },
    }),
    prisma.image.aggregate({
      where: { projectId },
      _sum: { size: true },
    }),
    prisma.image.count({
      where: {
        projectId,
        usageCount: { gt: 0 },
      },
    }),
  ]);

  return {
    totalImages,
    aiGeneratedCount,
    manuallyUploadedCount: totalImages - aiGeneratedCount,
    totalSizeBytes: totalSize._sum.size || 0,
    totalSizeMB: ((totalSize._sum.size || 0) / (1024 * 1024)).toFixed(2),
    usedImages,
    unusedImages: totalImages - usedImages,
    usageRate: totalImages > 0 ? ((usedImages / totalImages) * 100).toFixed(1) : "0",
  };
}

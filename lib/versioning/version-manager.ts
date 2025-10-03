/**
 * Content Version Manager
 *
 * Handles content versioning, diff generation, branching, and rollback.
 */

import { VersionChangeType, ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import DiffMatchPatch from "diff-match-patch";

const dmp = new DiffMatchPatch();

export interface VersionDiff {
  added: number;
  removed: number;
  modified: number;
  changes: Array<{
    type: "add" | "remove" | "modify";
    text: string;
    position?: number;
  }>;
  summary: string;
}

export interface CreateVersionOptions {
  contentId: string;
  userId: string;
  changeType: VersionChangeType;
  changeReason?: string;
  versionLabel?: string;
  branchName?: string;
}

/**
 * Create a new version of content
 */
export async function createVersion(options: CreateVersionOptions): Promise<string> {
  const content = await db.content.findUnique({
    where: { id: options.contentId },
    include: {
      versionHistory: {
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  if (!content) {
    throw new Error("Content not found");
  }

  // Get next version number
  const latestVersion = content.versionHistory[0];
  const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

  // Generate diff if there's a previous version
  let diffSummary = null;
  if (latestVersion) {
    const diff = generateDiff(latestVersion.rawContent, content.rawContent);
    diffSummary = {
      added: diff.added,
      removed: diff.removed,
      modified: diff.modified,
      summary: diff.summary
    };
  }

  // Create version
  const version = await db.contentVersion.create({
    data: {
      contentId: options.contentId,
      projectId: content.projectId,
      version: nextVersion,
      versionLabel: options.versionLabel,
      title: content.title,
      body: content.body,
      excerpt: content.excerpt,
      rawContent: content.rawContent,
      htmlContent: content.htmlContent,
      tags: content.tags,
      categories: content.categories,
      coverImage: content.coverImage,
      metadata: content.metadata as any,
      createdBy: options.userId,
      changeType: options.changeType,
      changeReason: options.changeReason,
      diffSummary: diffSummary as any,
      wordCount: countWords(content.rawContent),
      charCount: content.rawContent.length,
      publishedAt: content.publishedAt,
      status: content.status,
      branchName: options.branchName
    }
  });

  // Update content version number
  await db.content.update({
    where: { id: options.contentId },
    data: { version: nextVersion }
  });

  return version.id;
}

/**
 * Generate diff between two versions
 */
export function generateDiff(oldText: string, newText: string): VersionDiff {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  let added = 0;
  let removed = 0;
  let modified = 0;

  const changes: Array<{
    type: "add" | "remove" | "modify";
    text: string;
    position?: number;
  }> = [];

  let position = 0;
  for (const [op, text] of diffs) {
    if (op === 1) {
      // Addition
      added += text.length;
      changes.push({ type: "add", text, position });
    } else if (op === -1) {
      // Deletion
      removed += text.length;
      changes.push({ type: "remove", text, position });
    } else {
      // No change
      position += text.length;
    }
  }

  modified = Math.min(added, removed);

  const summary = generateDiffSummary(added, removed, modified, oldText, newText);

  return { added, removed, modified, changes, summary };
}

/**
 * Generate human-readable diff summary
 */
function generateDiffSummary(
  added: number,
  removed: number,
  modified: number,
  oldText: string,
  newText: string
): string {
  const parts: string[] = [];

  const oldWords = countWords(oldText);
  const newWords = countWords(newText);
  const wordChange = newWords - oldWords;

  if (wordChange > 0) {
    parts.push(`+${wordChange} words`);
  } else if (wordChange < 0) {
    parts.push(`${wordChange} words`);
  }

  if (added > 0) {
    parts.push(`+${added} chars`);
  }
  if (removed > 0) {
    parts.push(`-${removed} chars`);
  }

  return parts.join(", ") || "No changes";
}

/**
 * Compare two versions
 */
export async function compareVersions(
  contentId: string,
  version1: number,
  version2: number
): Promise<{
  version1: any;
  version2: any;
  diff: VersionDiff;
}> {
  const [v1, v2] = await Promise.all([
    db.contentVersion.findFirst({
      where: { contentId, version: version1 }
    }),
    db.contentVersion.findFirst({
      where: { contentId, version: version2 }
    })
  ]);

  if (!v1 || !v2) {
    throw new Error("Version not found");
  }

  const diff = generateDiff(v1.rawContent, v2.rawContent);

  return { version1: v1, version2: v2, diff };
}

/**
 * Rollback to a previous version
 */
export async function rollbackToVersion(
  contentId: string,
  targetVersion: number,
  userId: string
): Promise<void> {
  const version = await db.contentVersion.findFirst({
    where: { contentId, version: targetVersion }
  });

  if (!version) {
    throw new Error("Version not found");
  }

  // Update content to match the target version
  await db.content.update({
    where: { id: contentId },
    data: {
      title: version.title,
      body: version.body,
      excerpt: version.excerpt,
      rawContent: version.rawContent,
      htmlContent: version.htmlContent,
      tags: version.tags,
      categories: version.categories,
      coverImage: version.coverImage,
      metadata: version.metadata as any,
      status: ContentStatus.DRAFT // Reset to draft on rollback
    }
  });

  // Create a new version for the rollback
  await createVersion({
    contentId,
    userId,
    changeType: VersionChangeType.ROLLBACK,
    changeReason: `Rolled back to version ${targetVersion}`,
    versionLabel: `rollback-to-v${targetVersion}`
  });
}

/**
 * Create a branch for A/B testing
 */
export async function createBranch(
  contentId: string,
  branchName: string,
  userId: string
): Promise<string> {
  const content = await db.content.findUnique({
    where: { id: contentId },
    include: {
      versionHistory: {
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  if (!content) {
    throw new Error("Content not found");
  }

  const latestVersion = content.versionHistory[0];

  // Create branched version
  const versionId = await createVersion({
    contentId,
    userId,
    changeType: VersionChangeType.BRANCHED,
    changeReason: `Created branch: ${branchName}`,
    branchName,
    versionLabel: branchName
  });

  return versionId;
}

/**
 * Merge a branch back to main
 */
export async function mergeBranch(
  contentId: string,
  branchName: string,
  userId: string
): Promise<void> {
  // Get the latest version from the branch
  const branchVersion = await db.contentVersion.findFirst({
    where: { contentId, branchName },
    orderBy: { version: "desc" }
  });

  if (!branchVersion) {
    throw new Error("Branch not found");
  }

  // Update content to match the branch version
  await db.content.update({
    where: { id: contentId },
    data: {
      title: branchVersion.title,
      body: branchVersion.body,
      excerpt: branchVersion.excerpt,
      rawContent: branchVersion.rawContent,
      htmlContent: branchVersion.htmlContent,
      tags: branchVersion.tags,
      categories: branchVersion.categories,
      coverImage: branchVersion.coverImage,
      metadata: branchVersion.metadata as any
    }
  });

  // Create a merge version
  await createVersion({
    contentId,
    userId,
    changeType: VersionChangeType.MERGED,
    changeReason: `Merged branch: ${branchName}`,
    versionLabel: `merged-${branchName}`
  });
}

/**
 * Get version history for content
 */
export async function getVersionHistory(
  contentId: string,
  options?: {
    limit?: number;
    branchName?: string;
  }
): Promise<any[]> {
  return db.contentVersion.findMany({
    where: {
      contentId,
      ...(options?.branchName && { branchName: options.branchName })
    },
    orderBy: { version: "desc" },
    take: options?.limit
  });
}

/**
 * Get version statistics
 */
export async function getVersionStats(contentId: string): Promise<{
  totalVersions: number;
  branches: string[];
  lastEditedAt: Date | null;
  totalEdits: number;
  aiRegenerations: number;
}> {
  const versions = await db.contentVersion.findMany({
    where: { contentId },
    orderBy: { version: "desc" }
  });

  const branches = [...new Set(versions.filter(v => v.branchName).map(v => v.branchName!))];
  const totalEdits = versions.filter(v => v.changeType === VersionChangeType.EDITED).length;
  const aiRegenerations = versions.filter(
    v => v.changeType === VersionChangeType.AI_REGENERATED
  ).length;
  const lastVersion = versions[0];

  return {
    totalVersions: versions.length,
    branches,
    lastEditedAt: lastVersion?.createdAt || null,
    totalEdits,
    aiRegenerations
  };
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate HTML diff for visualization
 */
export function generateHTMLDiff(oldText: string, newText: string): string {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  return dmp.diff_prettyHtml(diffs);
}

/**
 * Auto-save content (create version on timer)
 */
export async function autoSave(contentId: string, userId: string): Promise<void> {
  await createVersion({
    contentId,
    userId,
    changeType: VersionChangeType.AUTO_SAVED,
    changeReason: "Auto-saved"
  });
}

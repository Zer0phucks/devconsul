/**
 * Auto-Approval Rules Engine
 *
 * Evaluates content against auto-approval rules and automatically
 * approves content that meets specified criteria.
 */

import { db } from "@/lib/db";
import { ApprovalStatus, ContentStatus } from "@prisma/client";

export interface AutoApprovalConditions {
  safetyScore?: { min?: number; max?: number };
  contentType?: string[];
  aiGenerated?: boolean;
  platforms?: string[];
  wordCount?: { min?: number; max?: number };
  hasImages?: boolean;
  authorId?: string[];
  projectId?: string[];
  tags?: string[];
  categories?: string[];
}

/**
 * Check if content should be auto-approved
 */
export async function checkAutoApproval(
  contentId: string,
  projectId: string
): Promise<{ shouldAutoApprove: boolean; ruleId?: string; ruleName?: string }> {
  // Get active auto-approval rules for this project (ordered by priority)
  const rules = await db.autoApprovalRule.findMany({
    where: {
      projectId,
      isActive: true
    },
    orderBy: { priority: "desc" }
  });

  // Get content and its safety check results
  const content = await db.content.findUnique({
    where: { id: contentId },
    include: {
      safetyChecks: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!content) {
    return { shouldAutoApprove: false };
  }

  // Evaluate each rule (first match wins)
  for (const rule of rules) {
    const conditions = rule.conditions as AutoApprovalConditions;
    const meetsConditions = await evaluateConditions(content, conditions);

    if (meetsConditions) {
      // Update rule usage stats
      await db.autoApprovalRule.update({
        where: { id: rule.id },
        data: {
          applicationCount: { increment: 1 },
          lastAppliedAt: new Date()
        }
      });

      return {
        shouldAutoApprove: true,
        ruleId: rule.id,
        ruleName: rule.name
      };
    }
  }

  return { shouldAutoApprove: false };
}

/**
 * Evaluate conditions against content
 */
async function evaluateConditions(
  content: any,
  conditions: AutoApprovalConditions
): Promise<boolean> {
  // Safety score check
  if (conditions.safetyScore) {
    const latestSafetyCheck = content.safetyChecks[0];
    if (!latestSafetyCheck) return false;

    const score = latestSafetyCheck.safetyScore;
    if (conditions.safetyScore.min !== undefined && score < conditions.safetyScore.min) {
      return false;
    }
    if (conditions.safetyScore.max !== undefined && score > conditions.safetyScore.max) {
      return false;
    }
  }

  // Content type check
  if (conditions.contentType && conditions.contentType.length > 0) {
    if (!conditions.contentType.includes(content.sourceType)) {
      return false;
    }
  }

  // AI generated check
  if (conditions.aiGenerated !== undefined) {
    if (content.isAIGenerated !== conditions.aiGenerated) {
      return false;
    }
  }

  // Word count check
  if (conditions.wordCount) {
    const wordCount = countWords(content.rawContent);
    if (conditions.wordCount.min !== undefined && wordCount < conditions.wordCount.min) {
      return false;
    }
    if (conditions.wordCount.max !== undefined && wordCount > conditions.wordCount.max) {
      return false;
    }
  }

  // Has images check
  if (conditions.hasImages !== undefined) {
    const hasImages = content.coverImage !== null;
    if (hasImages !== conditions.hasImages) {
      return false;
    }
  }

  // Tags check
  if (conditions.tags && conditions.tags.length > 0) {
    const hasMatchingTag = conditions.tags.some((tag: string) => content.tags.includes(tag));
    if (!hasMatchingTag) {
      return false;
    }
  }

  // Categories check
  if (conditions.categories && conditions.categories.length > 0) {
    const hasMatchingCategory = conditions.categories.some((cat: string) =>
      content.categories.includes(cat)
    );
    if (!hasMatchingCategory) {
      return false;
    }
  }

  // All conditions met
  return true;
}

/**
 * Apply auto-approval to content
 */
export async function applyAutoApproval(
  contentId: string,
  ruleId: string,
  ruleName: string
): Promise<void> {
  // Check if there's an existing pending approval
  const existingApproval = await db.contentApproval.findFirst({
    where: {
      contentId,
      status: {
        in: [ApprovalStatus.PENDING, ApprovalStatus.IN_REVIEW]
      }
    }
  });

  if (existingApproval) {
    // Update existing approval to auto-approved
    await db.contentApproval.update({
      where: { id: existingApproval.id },
      data: {
        status: ApprovalStatus.APPROVED,
        autoApproved: true,
        autoApprovalRule: ruleName,
        approvedAt: new Date(),
        approvedBy: "system",
        feedback: `Auto-approved by rule: ${ruleName}`,
        history: {
          push: {
            event: "AUTO_APPROVE",
            timestamp: new Date().toISOString(),
            ruleId,
            ruleName,
            metadata: { automated: true }
          }
        }
      }
    });
  }
}

/**
 * Create and configure auto-approval rule
 */
export async function createAutoApprovalRule(
  projectId: string,
  name: string,
  description: string,
  conditions: AutoApprovalConditions,
  priority: number = 0
): Promise<string> {
  const rule = await db.autoApprovalRule.create({
    data: {
      projectId,
      name,
      description,
      conditions: conditions as any,
      priority,
      isActive: true
    }
  });

  return rule.id;
}

/**
 * Update auto-approval rule
 */
export async function updateAutoApprovalRule(
  ruleId: string,
  updates: {
    name?: string;
    description?: string;
    conditions?: AutoApprovalConditions;
    priority?: number;
    isActive?: boolean;
  }
): Promise<void> {
  await db.autoApprovalRule.update({
    where: { id: ruleId },
    data: {
      ...updates,
      ...(updates.conditions && { conditions: updates.conditions as any })
    }
  });
}

/**
 * Delete auto-approval rule
 */
export async function deleteAutoApprovalRule(ruleId: string): Promise<void> {
  await db.autoApprovalRule.delete({
    where: { id: ruleId }
  });
}

/**
 * Get auto-approval rules for project
 */
export async function getAutoApprovalRules(projectId: string): Promise<any[]> {
  return db.autoApprovalRule.findMany({
    where: { projectId },
    orderBy: { priority: "desc" }
  });
}

/**
 * Test rule against content (without applying)
 */
export async function testAutoApprovalRule(
  ruleId: string,
  contentId: string
): Promise<{ matches: boolean; reason?: string }> {
  const rule = await db.autoApprovalRule.findUnique({
    where: { id: ruleId }
  });

  if (!rule) {
    return { matches: false, reason: "Rule not found" };
  }

  const content = await db.content.findUnique({
    where: { id: contentId },
    include: {
      safetyChecks: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!content) {
    return { matches: false, reason: "Content not found" };
  }

  const conditions = rule.conditions as AutoApprovalConditions;
  const matches = await evaluateConditions(content, conditions);

  return {
    matches,
    reason: matches ? "All conditions met" : "Some conditions not met"
  };
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Suggested default rules for new projects
 */
export const DEFAULT_AUTO_APPROVAL_RULES: Array<{
  name: string;
  description: string;
  conditions: AutoApprovalConditions;
  priority: number;
}> = [
  {
    name: "High Safety Score",
    description: "Auto-approve content with safety score > 90",
    conditions: {
      safetyScore: { min: 90 }
    },
    priority: 10
  },
  {
    name: "AI-Generated Blog Posts",
    description: "Auto-approve AI-generated blog posts with good safety score",
    conditions: {
      safetyScore: { min: 80 },
      aiGenerated: true,
      contentType: ["AI_GENERATED"]
    },
    priority: 5
  },
  {
    name: "Short Updates",
    description: "Auto-approve short updates (< 500 words) with high safety score",
    conditions: {
      safetyScore: { min: 85 },
      wordCount: { max: 500 }
    },
    priority: 3
  }
];

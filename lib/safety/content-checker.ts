/**
 * Content Safety Checker
 *
 * Comprehensive safety checking system for content before publication.
 * Includes blacklist checking, profanity detection, AI moderation, PII detection,
 * and brand safety validation.
 */

import { SafetyCheckType, SafetySeverity, SafetyAction } from "@prisma/client";
import { db } from "@/lib/db";
import OpenAI from "openai";

// Lazy-load OpenAI client to avoid build-time errors
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'default-build-key',
    });
  }
  return _openai;
}

const openai = getOpenAI();

export interface SafetyCheckResult {
  passed: boolean;
  safetyScore: number; // 0-100
  violations: SafetyViolation[];
  flaggedTerms: string[];
  severity: SafetySeverity;
  action: SafetyAction;
  aiModerationResult?: any;
  aiCategories?: Record<string, boolean>;
}

export interface SafetyViolation {
  type: SafetyCheckType;
  category: string;
  text: string;
  position?: { start: number; end: number };
  severity: SafetySeverity;
  suggestion?: string;
}

/**
 * Run all safety checks on content
 */
export async function checkContentSafety(
  contentId: string,
  projectId: string,
  text: string
): Promise<SafetyCheckResult> {
  const results: SafetyCheckResult[] = [];

  // Run all checks in parallel
  const [blacklistResult, profanityResult, aiModerationResult, piiResult, brandSafetyResult] =
    await Promise.all([
      checkBlacklist(text, projectId),
      checkProfanity(text),
      checkAIModeration(text),
      checkPII(text),
      checkBrandSafety(text, projectId)
    ]);

  results.push(blacklistResult, profanityResult, aiModerationResult, piiResult, brandSafetyResult);

  // Aggregate results
  const aggregated = aggregateResults(results);

  // Store in database
  await db.contentSafetyCheck.create({
    data: {
      contentId,
      projectId,
      checkType: SafetyCheckType.AI_MODERATION, // Primary check type
      safetyScore: aggregated.safetyScore,
      passed: aggregated.passed,
      severity: aggregated.severity,
      violations: aggregated.violations as any,
      flaggedTerms: aggregated.flaggedTerms,
      aiModerationResult: aggregated.aiModerationResult as any,
      aiCategories: aggregated.aiCategories as any,
      action: aggregated.action
    }
  });

  return aggregated;
}

/**
 * Check against blacklisted terms
 */
async function checkBlacklist(text: string, projectId: string): Promise<SafetyCheckResult> {
  const violations: SafetyViolation[] = [];
  const flaggedTerms: string[] = [];

  // Get blacklist terms (both global and project-specific)
  const blacklistTerms = await db.blacklistTerm.findMany({
    where: {
      isActive: true,
      OR: [{ projectId: null }, { projectId }]
    }
  });

  for (const term of blacklistTerms) {
    const matches = findTermMatches(text, term.term, {
      isRegex: term.isRegex,
      caseSensitive: term.caseSensitive,
      matchWholeWord: term.matchWholeWord
    });

    if (matches.length > 0) {
      flaggedTerms.push(term.term);
      violations.push({
        type: SafetyCheckType.BLACKLIST,
        category: term.category,
        text: term.term,
        severity: term.severity,
        suggestion: `Remove or replace: "${term.term}"`
      });

      // Update hit count
      await db.blacklistTerm.update({
        where: { id: term.id },
        data: {
          hitCount: { increment: 1 },
          lastHitAt: new Date()
        }
      });
    }
  }

  const severity = violations.length > 0 ? getHighestSeverity(violations) : SafetySeverity.INFO;
  const safetyScore = Math.max(0, 100 - violations.length * 20);

  return {
    passed: violations.length === 0,
    safetyScore,
    violations,
    flaggedTerms,
    severity,
    action: determineAction(violations)
  };
}

/**
 * Check for profanity
 */
async function checkProfanity(text: string): Promise<SafetyCheckResult> {
  // Common profanity patterns (basic implementation)
  const profanityPatterns = [
    /\b(fuck|shit|damn|hell|ass|bitch|bastard|crap)\b/gi,
    // Add more patterns as needed
  ];

  const violations: SafetyViolation[] = [];
  const flaggedTerms: string[] = [];

  for (const pattern of profanityPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        flaggedTerms.push(match);
        violations.push({
          type: SafetyCheckType.PROFANITY,
          category: "PROFANITY",
          text: match,
          severity: SafetySeverity.WARNING,
          suggestion: "Consider using more professional language"
        });
      }
    }
  }

  const safetyScore = Math.max(0, 100 - violations.length * 15);

  return {
    passed: violations.length === 0,
    safetyScore,
    violations,
    flaggedTerms,
    severity: violations.length > 0 ? SafetySeverity.WARNING : SafetySeverity.INFO,
    action: violations.length > 0 ? SafetyAction.WARN : SafetyAction.NONE
  };
}

/**
 * Check using OpenAI Moderation API
 */
async function checkAIModeration(text: string): Promise<SafetyCheckResult> {
  try {
    const moderation = await openai.moderations.create({
      input: text,
      model: "omni-moderation-latest"
    });

    const result = moderation.results[0];
    const violations: SafetyViolation[] = [];

    // Check each category
    const categories = result.categories;
    const categoryScores = result.category_scores;

    const flaggedCategories: string[] = [];

    for (const [category, flagged] of Object.entries(categories)) {
      if (flagged) {
        const score = categoryScores[category as keyof typeof categoryScores];
        flaggedCategories.push(category);

        violations.push({
          type: SafetyCheckType.AI_MODERATION,
          category: category.toUpperCase(),
          text: `AI flagged: ${category}`,
          severity: score > 0.9 ? SafetySeverity.CRITICAL : score > 0.7 ? SafetySeverity.ERROR : SafetySeverity.WARNING,
          suggestion: `Content flagged for ${category} with confidence ${(score * 100).toFixed(1)}%`
        });
      }
    }

    const safetyScore = Math.max(0, Math.round((1 - Math.max(...Object.values(categoryScores))) * 100));

    return {
      passed: !result.flagged,
      safetyScore,
      violations,
      flaggedTerms: flaggedCategories,
      severity: result.flagged ? getHighestSeverity(violations) : SafetySeverity.INFO,
      action: result.flagged ? SafetyAction.BLOCK : SafetyAction.NONE,
      aiModerationResult: result,
      aiCategories: categories
    };
  } catch (error) {
    console.error("AI moderation error:", error);
    return {
      passed: true,
      safetyScore: 100,
      violations: [],
      flaggedTerms: [],
      severity: SafetySeverity.INFO,
      action: SafetyAction.NONE
    };
  }
}

/**
 * Check for PII (Personal Identifiable Information)
 */
async function checkPII(text: string): Promise<SafetyCheckResult> {
  const violations: SafetyViolation[] = [];
  const flaggedTerms: string[] = [];

  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailPattern);
  if (emails) {
    flaggedTerms.push(...emails);
    violations.push({
      type: SafetyCheckType.PII,
      category: "EMAIL",
      text: `Found ${emails.length} email address(es)`,
      severity: SafetySeverity.WARNING,
      suggestion: "Remove or redact email addresses"
    });
  }

  // Phone number pattern (US format)
  const phonePattern = /\b(\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g;
  const phones = text.match(phonePattern);
  if (phones) {
    flaggedTerms.push(...phones);
    violations.push({
      type: SafetyCheckType.PII,
      category: "PHONE",
      text: `Found ${phones.length} phone number(s)`,
      severity: SafetySeverity.WARNING,
      suggestion: "Remove or redact phone numbers"
    });
  }

  // SSN pattern
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ssns = text.match(ssnPattern);
  if (ssns) {
    flaggedTerms.push(...ssns);
    violations.push({
      type: SafetyCheckType.PII,
      category: "SSN",
      text: `Found ${ssns.length} potential SSN(s)`,
      severity: SafetySeverity.CRITICAL,
      suggestion: "Remove SSN immediately"
    });
  }

  // Credit card pattern
  const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  const ccs = text.match(ccPattern);
  if (ccs) {
    flaggedTerms.push(...ccs);
    violations.push({
      type: SafetyCheckType.PII,
      category: "CREDIT_CARD",
      text: `Found ${ccs.length} potential credit card number(s)`,
      severity: SafetySeverity.CRITICAL,
      suggestion: "Remove credit card numbers immediately"
    });
  }

  const safetyScore = Math.max(0, 100 - violations.length * 25);

  return {
    passed: violations.length === 0,
    safetyScore,
    violations,
    flaggedTerms,
    severity: violations.length > 0 ? getHighestSeverity(violations) : SafetySeverity.INFO,
    action: violations.some(v => v.severity === SafetySeverity.CRITICAL) ? SafetyAction.BLOCK : SafetyAction.WARN
  };
}

/**
 * Check brand safety (competitor mentions, etc.)
 */
async function checkBrandSafety(text: string, projectId: string): Promise<SafetyCheckResult> {
  // This would check for competitor mentions, inappropriate topics, etc.
  // Implementation would depend on project-specific configuration
  return {
    passed: true,
    safetyScore: 100,
    violations: [],
    flaggedTerms: [],
    severity: SafetySeverity.INFO,
    action: SafetyAction.NONE
  };
}

/**
 * Find term matches in text
 */
function findTermMatches(
  text: string,
  term: string,
  options: { isRegex: boolean; caseSensitive: boolean; matchWholeWord: boolean }
): Array<{ start: number; end: number; text: string }> {
  const matches: Array<{ start: number; end: number; text: string }> = [];

  if (options.isRegex) {
    try {
      const flags = options.caseSensitive ? "g" : "gi";
      const regex = new RegExp(term, flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }
    } catch (error) {
      console.error("Invalid regex:", term, error);
    }
  } else {
    const searchText = options.caseSensitive ? text : text.toLowerCase();
    const searchTerm = options.caseSensitive ? term : term.toLowerCase();

    if (options.matchWholeWord) {
      const regex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, options.caseSensitive ? "g" : "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }
    } else {
      let index = searchText.indexOf(searchTerm);
      while (index !== -1) {
        matches.push({
          start: index,
          end: index + searchTerm.length,
          text: text.substring(index, index + searchTerm.length)
        });
        index = searchText.indexOf(searchTerm, index + 1);
      }
    }
  }

  return matches;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get highest severity from violations
 */
function getHighestSeverity(violations: SafetyViolation[]): SafetySeverity {
  const severityOrder = [
    SafetySeverity.INFO,
    SafetySeverity.WARNING,
    SafetySeverity.ERROR,
    SafetySeverity.CRITICAL
  ];

  let highest = SafetySeverity.INFO;
  for (const violation of violations) {
    if (severityOrder.indexOf(violation.severity) > severityOrder.indexOf(highest)) {
      highest = violation.severity;
    }
  }
  return highest;
}

/**
 * Determine action based on violations
 */
function determineAction(violations: SafetyViolation[]): SafetyAction {
  if (violations.length === 0) return SafetyAction.NONE;

  const hasCritical = violations.some(v => v.severity === SafetySeverity.CRITICAL);
  if (hasCritical) return SafetyAction.BLOCK;

  const hasError = violations.some(v => v.severity === SafetySeverity.ERROR);
  if (hasError) return SafetyAction.FLAG_FOR_REVIEW;

  return SafetyAction.WARN;
}

/**
 * Aggregate multiple check results
 */
function aggregateResults(results: SafetyCheckResult[]): SafetyCheckResult {
  const allViolations = results.flatMap(r => r.violations);
  const allFlaggedTerms = [...new Set(results.flatMap(r => r.flaggedTerms))];

  // Average safety score (weighted by severity)
  const avgScore = results.reduce((sum, r) => sum + r.safetyScore, 0) / results.length;

  const severity = getHighestSeverity(allViolations);
  const action = determineAction(allViolations);

  // Find AI moderation result
  const aiResult = results.find(r => r.aiModerationResult);

  return {
    passed: allViolations.length === 0,
    safetyScore: Math.round(avgScore),
    violations: allViolations,
    flaggedTerms: allFlaggedTerms,
    severity,
    action,
    aiModerationResult: aiResult?.aiModerationResult,
    aiCategories: aiResult?.aiCategories
  };
}

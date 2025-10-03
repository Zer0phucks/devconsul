/**
 * Cost Tracking System for AI and Platform APIs
 * Tracks usage costs for OpenAI, Anthropic, and platform APIs
 */

import { db } from '@/lib/db';
import { CostService } from '@prisma/client';

// Pricing constants (updated as of 2025)
export const PRICING = {
  OPENAI: {
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
    'dall-e-3': { standard: 0.04, hd: 0.08 },
    'dall-e-2': { '1024x1024': 0.02, '512x512': 0.018, '256x256': 0.016 },
  },
  ANTHROPIC: {
    'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
  },
} as const;

export interface CostTrackingInput {
  projectId: string;
  userId?: string;
  service: CostService;
  operation: string;
  resourceType?: string;
  tokensUsed?: number;
  imagesGenerated?: number;
  apiCalls?: number;
  unitCost: number;
  totalCost: number;
  metadata?: Record<string, any>;
  billingPeriod?: Date;
}

/**
 * Track a cost event
 */
export async function trackCost(input: CostTrackingInput) {
  return await db.costTracking.create({
    data: {
      projectId: input.projectId,
      userId: input.userId,
      service: input.service,
      operation: input.operation,
      resourceType: input.resourceType,
      tokensUsed: input.tokensUsed,
      imagesGenerated: input.imagesGenerated,
      apiCalls: input.apiCalls,
      unitCost: input.unitCost,
      totalCost: input.totalCost,
      metadata: input.metadata || {},
      billingPeriod: input.billingPeriod || new Date(),
    },
  });
}

/**
 * Calculate cost from token usage for text generation
 */
export function calculateTextCost(
  provider: 'openai' | 'anthropic',
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing =
    provider === 'openai'
      ? PRICING.OPENAI[model as keyof typeof PRICING.OPENAI]
      : PRICING.ANTHROPIC[model as keyof typeof PRICING.ANTHROPIC];

  if (!pricing || typeof pricing === 'number') {
    console.error(`Unknown model pricing: ${provider}/${model}`);
    return 0;
  }

  const inputCost = promptTokens * pricing.input;
  const outputCost = completionTokens * pricing.output;

  return inputCost + outputCost;
}

/**
 * Calculate cost from image generation
 */
export function calculateImageCost(
  model: 'dall-e-3' | 'dall-e-2',
  quality?: 'standard' | 'hd',
  size?: string
): number {
  if (model === 'dall-e-3') {
    return quality === 'hd' ? PRICING.OPENAI['dall-e-3'].hd : PRICING.OPENAI['dall-e-3'].standard;
  }

  if (model === 'dall-e-2' && size) {
    const pricing = PRICING.OPENAI['dall-e-2'];
    return pricing[size as keyof typeof pricing] || pricing['1024x1024'];
  }

  return 0;
}

/**
 * Get cost summary for a project
 */
export async function getCostSummary(
  projectId: string,
  dateRange: { from: Date; to: Date }
) {
  const costs = await db.costTracking.findMany({
    where: {
      projectId,
      billingPeriod: { gte: dateRange.from, lte: dateRange.to },
    },
    orderBy: { billingPeriod: 'desc' },
  });

  // Aggregate by service
  const serviceBreakdown: Record<
    string,
    { totalCost: number; tokensUsed: number; apiCalls: number; imagesGenerated: number }
  > = {};

  costs.forEach((cost) => {
    const service = cost.service;
    if (!serviceBreakdown[service]) {
      serviceBreakdown[service] = {
        totalCost: 0,
        tokensUsed: 0,
        apiCalls: 0,
        imagesGenerated: 0,
      };
    }

    serviceBreakdown[service].totalCost += cost.totalCost;
    serviceBreakdown[service].tokensUsed += cost.tokensUsed || 0;
    serviceBreakdown[service].apiCalls += cost.apiCalls || 1;
    serviceBreakdown[service].imagesGenerated += cost.imagesGenerated || 0;
  });

  // Calculate totals
  const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
  const totalTokens = costs.reduce((sum, cost) => sum + (cost.tokensUsed || 0), 0);
  const totalApiCalls = costs.reduce((sum, cost) => sum + (cost.apiCalls || 1), 0);
  const totalImages = costs.reduce((sum, cost) => sum + (cost.imagesGenerated || 0), 0);

  return {
    totalCost,
    totalTokens,
    totalApiCalls,
    totalImages,
    serviceBreakdown,
    costs,
  };
}

/**
 * Get or create cost summary for a billing period
 */
export async function getOrCreateCostSummary(
  projectId: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
) {
  // Try to find existing summary
  let summary = await db.costSummary.findFirst({
    where: {
      projectId,
      billingPeriodStart,
      billingPeriodEnd,
    },
  });

  // If not found, calculate and create
  if (!summary) {
    const costs = await getCostSummary(projectId, {
      from: billingPeriodStart,
      to: billingPeriodEnd,
    });

    summary = await db.costSummary.create({
      data: {
        projectId,
        billingPeriodStart,
        billingPeriodEnd,
        totalCost: costs.totalCost,
        totalTokens: costs.totalTokens,
        totalApiCalls: costs.totalApiCalls,
        totalImages: costs.totalImages,
        serviceBreakdown: costs.serviceBreakdown,
        currency: 'USD',
      },
    });
  }

  return summary;
}

/**
 * Get monthly cost summaries
 */
export async function getMonthlyCostSummaries(
  projectId: string,
  months: number = 12
) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const summaries = await db.costSummary.findMany({
    where: {
      projectId,
      billingPeriodStart: { gte: startDate },
    },
    orderBy: { billingPeriodStart: 'desc' },
  });

  return summaries;
}

/**
 * Calculate cost per content item
 */
export async function getCostPerContent(
  projectId: string,
  dateRange: { from: Date; to: Date }
) {
  const costs = await getCostSummary(projectId, dateRange);
  const content = await db.content.findMany({
    where: {
      projectId,
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    },
  });

  const totalContent = content.length;
  const costPerContent = totalContent > 0 ? costs.totalCost / totalContent : 0;

  return {
    totalCost: costs.totalCost,
    totalContent,
    costPerContent,
  };
}

/**
 * Check budget alerts
 */
export async function checkBudgetAlerts(
  projectId: string,
  monthlyBudget: number,
  currentMonth: { from: Date; to: Date }
) {
  const costs = await getCostSummary(projectId, currentMonth);
  const percentageUsed = (costs.totalCost / monthlyBudget) * 100;

  const alerts = [];

  if (percentageUsed >= 90) {
    alerts.push({
      level: 'critical',
      message: `Budget usage at ${percentageUsed.toFixed(1)}% ($${costs.totalCost.toFixed(2)} / $${monthlyBudget})`,
      recommendation: 'Consider pausing AI content generation or reducing usage',
    });
  } else if (percentageUsed >= 75) {
    alerts.push({
      level: 'warning',
      message: `Budget usage at ${percentageUsed.toFixed(1)}% ($${costs.totalCost.toFixed(2)} / $${monthlyBudget})`,
      recommendation: 'Monitor usage closely for remainder of month',
    });
  } else if (percentageUsed >= 50) {
    alerts.push({
      level: 'info',
      message: `Budget usage at ${percentageUsed.toFixed(1)}% ($${costs.totalCost.toFixed(2)} / $${monthlyBudget})`,
      recommendation: 'On track for monthly budget',
    });
  }

  return {
    percentageUsed,
    totalCost: costs.totalCost,
    monthlyBudget,
    alerts,
  };
}

/**
 * Get cost optimization recommendations
 */
export async function getCostOptimizationRecommendations(
  projectId: string,
  dateRange: { from: Date; to: Date }
) {
  const costs = await getCostSummary(projectId, dateRange);
  const recommendations = [];

  // Check for expensive models
  const expensiveModels = costs.costs.filter(
    (c) =>
      (c.service === 'OPENAI_TEXT' && c.metadata?.model === 'gpt-4') ||
      (c.service === 'ANTHROPIC_TEXT' && c.metadata?.model === 'claude-3-opus')
  );

  if (expensiveModels.length > 0) {
    const expensiveCost = expensiveModels.reduce((sum, c) => sum + c.totalCost, 0);
    recommendations.push({
      type: 'model_optimization',
      message: `$${expensiveCost.toFixed(2)} spent on premium models (GPT-4, Claude Opus)`,
      recommendation:
        'Consider using GPT-3.5-turbo or Claude Sonnet for non-critical content generation',
      potentialSavings: expensiveCost * 0.7, // Estimate 70% savings
    });
  }

  // Check for high image generation costs
  const imageCosts = costs.costs.filter((c) => c.service === 'OPENAI_IMAGE');
  if (imageCosts.length > 0) {
    const totalImageCost = imageCosts.reduce((sum, c) => sum + c.totalCost, 0);
    if (totalImageCost > costs.totalCost * 0.3) {
      recommendations.push({
        type: 'image_optimization',
        message: `Image generation accounts for ${((totalImageCost / costs.totalCost) * 100).toFixed(1)}% of costs`,
        recommendation: 'Consider using DALL-E 2 or external image services for cost savings',
        potentialSavings: totalImageCost * 0.5,
      });
    }
  }

  return recommendations;
}

# Analytics Dashboard Implementation - Phase 6.1

## Completed: Prisma Schema Extension

### Analytics Models Added:
1. **ContentMetrics** - Tracks content generation and publishing metrics by time period
2. **PlatformMetrics** - Platform-specific engagement metrics (views, likes, shares, etc.)
3. **CostTracking** - Granular cost tracking for AI providers and platform APIs
4. **CostSummary** - Aggregated cost summaries for dashboard performance
5. **ContentPerformance** - Best performing content identification and rankings
6. **AnalyticsEvent** - Granular event tracking
7. **UserAnalytics** - User activity and session analytics

### Key Features:
- Time-period based metrics (hourly, daily, weekly, monthly, quarterly, yearly)
- AI provider cost tracking (OpenAI, Anthropic)
- Platform engagement metrics (when available from APIs)
- Content performance scores and rankings
- Budget tracking with alerts

## Implementation Guide

### Step 1: Run Prisma Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_analytics_models
```

### Step 2: Create Analytics Utilities (`/lib/analytics/`)

#### `/lib/analytics/metrics.ts` - Core Metrics Calculation
```typescript
import { db } from '@/lib/db';
import { startOfDay, endOfDay, subDays, subMonths } from 'date-fns';

export async function getContentMetrics(
  projectId: string,
  dateRange: { from: Date; to: Date }
) {
  // Get all content in date range
  const content = await db.content.findMany({
    where: {
      projectId,
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    },
    include: {
      publications: true,
    },
  });

  // Calculate metrics
  const totalGenerated = content.length;
  const totalPublished = content.filter(c => c.status === 'PUBLISHED').length;
  const totalFailed = content.filter(c => c.status === 'FAILED').length;

  const generationSuccessRate = totalGenerated > 0
    ? (totalPublished / totalGenerated) * 100
    : 0;

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  content.forEach(c => {
    c.publications.forEach(p => {
      const platformId = p.platformId;
      platformBreakdown[platformId] = (platformBreakdown[platformId] || 0) + 1;
    });
  });

  return {
    totalGenerated,
    totalPublished,
    totalFailed,
    generationSuccessRate,
    platformBreakdown,
  };
}

export async function aggregateMetricsByPeriod(
  projectId: string,
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  dateRange: { from: Date; to: Date }
) {
  // Implementation for aggregating metrics by time period
  // Returns array of metrics for each period
}
```

#### `/lib/analytics/cost-tracker.ts` - Cost Tracking
```typescript
import { db } from '@/lib/db';

// Pricing constants (as of Jan 2025)
const PRICING = {
  OPENAI: {
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
    'dall-e-3': { standard: 0.040, hd: 0.080 },
  },
  ANTHROPIC: {
    'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
  },
};

export async function trackCost(params: {
  projectId: string;
  userId?: string;
  service: string;
  operation: string;
  resourceType: string;
  tokensUsed?: number;
  imagesGenerated?: number;
  metadata?: any;
}) {
  const { tokensUsed, resourceType, service } = params;

  // Calculate cost based on usage
  let unitCost = 0;
  let totalCost = 0;

  if (service === 'OPENAI_TEXT' && tokensUsed) {
    const pricing = PRICING.OPENAI[resourceType as keyof typeof PRICING.OPENAI] as any;
    totalCost = (tokensUsed / 1000) * (pricing.input + pricing.output);
    unitCost = pricing.input;
  } else if (service === 'ANTHROPIC_TEXT' && tokensUsed) {
    const pricing = PRICING.ANTHROPIC[resourceType as keyof typeof PRICING.ANTHROPIC] as any;
    totalCost = (tokensUsed / 1000) * (pricing.input + pricing.output);
    unitCost = pricing.input;
  }

  // Store cost record
  return await db.costTracking.create({
    data: {
      ...params,
      unitCost,
      totalCost,
      billingPeriod: new Date(),
    },
  });
}

export async function getCostSummary(
  projectId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const costs = await db.costTracking.findMany({
    where: {
      projectId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const summary = {
    totalCost: costs.reduce((sum, c) => sum + c.totalCost, 0),
    aiTextCost: costs
      .filter(c => c.service === 'OPENAI_TEXT' || c.service === 'ANTHROPIC_TEXT')
      .reduce((sum, c) => sum + c.totalCost, 0),
    aiImageCost: costs
      .filter(c => c.service === 'OPENAI_IMAGE')
      .reduce((sum, c) => sum + c.totalCost, 0),
    openaiCost: costs
      .filter(c => c.service.startsWith('OPENAI'))
      .reduce((sum, c) => sum + c.totalCost, 0),
    anthropicCost: costs
      .filter(c => c.service === 'ANTHROPIC_TEXT')
      .reduce((sum, c) => sum + c.totalCost, 0),
    totalTokensUsed: costs.reduce((sum, c) => sum + (c.tokensUsed || 0), 0),
  };

  return summary;
}
```

#### `/lib/analytics/aggregator.ts` - Data Aggregation
```typescript
import { db } from '@/lib/db';
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns';

export async function aggregateContentMetrics(
  projectId: string,
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY'
) {
  // Calculate period boundaries
  const now = new Date();
  const periodStart = getPeriodStart(now, periodType);
  const periodEnd = endOfDay(now);

  // Get metrics
  const content = await db.content.findMany({
    where: {
      projectId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    include: { publications: true },
  });

  // Calculate aggregates
  const totalGenerated = content.length;
  const totalPublished = content.filter(c => c.status === 'PUBLISHED').length;
  const aiGenerated = content.filter(c => c.isAIGenerated);

  const openaiContent = aiGenerated.filter(c =>
    c.aiMetadata && (c.aiMetadata as any).provider === 'openai'
  );
  const anthropicContent = aiGenerated.filter(c =>
    c.aiMetadata && (c.aiMetadata as any).provider === 'anthropic'
  );

  // Calculate costs from metadata
  const openaiCost = openaiContent.reduce((sum, c) =>
    sum + ((c.aiMetadata as any)?.cost || 0), 0
  );
  const anthropicCost = anthropicContent.reduce((sum, c) =>
    sum + ((c.aiMetadata as any)?.cost || 0), 0
  );

  // Upsert metrics
  return await db.contentMetrics.upsert({
    where: {
      projectId_periodStart_periodEnd_periodType: {
        projectId,
        periodStart,
        periodEnd,
        periodType,
      },
    },
    create: {
      projectId,
      periodStart,
      periodEnd,
      periodType,
      totalGenerated,
      totalPublished,
      totalFailed: content.filter(c => c.status === 'FAILED').length,
      openaiGenerations: openaiContent.length,
      anthropicGenerations: anthropicContent.length,
      openaiCost,
      anthropicCost,
      generationSuccessRate: totalGenerated > 0
        ? (totalPublished / totalGenerated) * 100
        : 0,
    },
    update: {
      totalGenerated,
      totalPublished,
      openaiGenerations: openaiContent.length,
      anthropicGenerations: anthropicContent.length,
      openaiCost,
      anthropicCost,
    },
  });
}

function getPeriodStart(date: Date, periodType: string) {
  switch (periodType) {
    case 'DAILY': return startOfDay(date);
    case 'WEEKLY': return startOfWeek(date);
    case 'MONTHLY': return startOfMonth(date);
    default: return startOfDay(date);
  }
}
```

### Step 3: Integrate Cost Tracking into AI Generator

Modify `/lib/ai/generator.ts` to track costs:

```typescript
// Add after successful generation (line ~215)
if (projectId) {
  await storeGeneratedContent(projectId, platform, primaryResult, defaultProvider);

  // Track cost
  await trackCost({
    projectId,
    service: defaultProvider === 'openai' ? 'OPENAI_TEXT' : 'ANTHROPIC_TEXT',
    operation: 'text_generation',
    resourceType: primaryResult.model,
    tokensUsed: primaryResult.tokensUsed.total,
    metadata: {
      platform,
      promptTokens: primaryResult.tokensUsed.prompt,
      completionTokens: primaryResult.tokensUsed.completion,
    },
  });
}
```

### Step 4: Create Analytics API Endpoints

#### `/app/api/analytics/content/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getContentMetrics } from '@/lib/analytics/metrics';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const days = parseInt(searchParams.get('days') || '30');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
  }

  const dateRange = {
    from: subDays(new Date(), days),
    to: new Date(),
  };

  const metrics = await getContentMetrics(projectId, dateRange);

  return NextResponse.json(metrics);
}
```

#### `/app/api/analytics/costs/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCostSummary } from '@/lib/analytics/cost-tracker';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
  }

  const now = new Date();
  const summary = await getCostSummary(
    projectId,
    startOfMonth(now),
    endOfMonth(now)
  );

  return NextResponse.json(summary);
}
```

### Step 5: Create Dashboard UI Components

#### Install chart library:
```bash
npm install recharts
```

#### `/components/analytics/metrics-card.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function MetricsCard({ title, value, change, icon }: MetricsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

#### `/components/analytics/content-chart.tsx`
```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContentChartProps {
  data: Array<{ date: string; generated: number; published: number }>;
}

export function ContentChart({ data }: ContentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Generation Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="generated" stroke="#8884d8" name="Generated" />
            <Line type="monotone" dataKey="published" stroke="#82ca9d" name="Published" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Step 6: Create Analytics Dashboard Page

#### `/app/dashboard/analytics/page.tsx`
```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { MetricsCard } from '@/components/analytics/metrics-card';
import { ContentChart } from '@/components/analytics/content-chart';
import { getContentMetrics, getCostSummary } from '@/lib/analytics';
import { subDays, format } from 'date-fns';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');

  const projectId = searchParams.projectId;
  if (!projectId) {
    return <div>Select a project to view analytics</div>;
  }

  const dateRange = {
    from: subDays(new Date(), 30),
    to: new Date(),
  };

  const metrics = await getContentMetrics(projectId, dateRange);
  const costs = await getCostSummary(projectId, dateRange.from, dateRange.to);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Content Generated"
          value={metrics.totalGenerated}
        />
        <MetricsCard
          title="Content Published"
          value={metrics.totalPublished}
        />
        <MetricsCard
          title="Success Rate"
          value={`${metrics.generationSuccessRate.toFixed(1)}%`}
        />
        <MetricsCard
          title="Total Cost"
          value={`$${costs.totalCost.toFixed(2)}`}
        />
      </div>

      {/* Charts */}
      <ContentChart data={[]} />

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add pie chart or bar chart */}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>OpenAI</span>
              <span>${costs.openaiCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Anthropic</span>
              <span>${costs.anthropicCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${costs.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 7: Export Functionality

#### `/app/api/analytics/export/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const format = searchParams.get('format') || 'csv';

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
  }

  // Get metrics data
  const metrics = await db.contentMetrics.findMany({
    where: { projectId },
    orderBy: { periodStart: 'desc' },
    take: 100,
  });

  if (format === 'csv') {
    const csv = convertToCSV(metrics);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${projectId}.csv"`,
      },
    });
  } else {
    return NextResponse.json(metrics);
  }
}

function convertToCSV(data: any[]) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));

  return [headers, ...rows].join('\n');
}
```

## Next Steps

1. **Run database migration**: `npx prisma migrate dev`
2. **Create remaining utility files** in `/lib/analytics/`
3. **Build API endpoints** for each analytics domain
4. **Implement dashboard components** with charts
5. **Add real-time updates** using WebSocket or polling
6. **Implement budget alerts** when thresholds are exceeded
7. **Add platform engagement tracking** where APIs support it

## Notes

- All costs are tracked in USD
- Token costs are calculated based on provider pricing
- Metrics are cached and aggregated for performance
- Export supports CSV and JSON formats
- Dashboard updates in real-time or on page refresh

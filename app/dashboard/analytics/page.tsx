/**
 * Analytics Dashboard Page
 * Displays comprehensive metrics for content generation, costs, and platform engagement
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MetricsCard } from '@/components/analytics/metrics-card';
import { ContentChart } from '@/components/analytics/content-chart';
import { DateRangePicker, DateRange } from '@/components/analytics/date-range-picker';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
} from 'lucide-react';

function AnalyticsDashboard() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Data states
  const [contentMetrics, setContentMetrics] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  const [platformData, setPlatformData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all metrics
  const fetchMetrics = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const fromStr = dateRange.from.toISOString().split('T')[0];
      const toStr = dateRange.to.toISOString().split('T')[0];

      // Fetch content metrics
      const contentRes = await fetch(
        `/api/analytics/content?projectId=${projectId}&from=${fromStr}&to=${toStr}`
      );
      const contentData = await contentRes.json();
      setContentMetrics(contentData.metrics);

      // Fetch cost data
      const costRes = await fetch(
        `/api/analytics/costs?projectId=${projectId}&action=summary&from=${fromStr}&to=${toStr}`
      );
      const costsData = await costRes.json();
      setCostData(costsData.summary);

      // Fetch platform engagement
      const platformRes = await fetch(
        `/api/analytics/platforms?projectId=${projectId}&action=engagement&from=${fromStr}&to=${toStr}`
      );
      const platforms = await platformRes.json();
      setPlatformData(platforms.engagement);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [projectId, dateRange]);

  // Export functionality
  const handleExport = async (format: 'csv' | 'json', type: string) => {
    if (!projectId) return;

    const fromStr = dateRange.from.toISOString().split('T')[0];
    const toStr = dateRange.to.toISOString().split('T')[0];

    const url = `/api/analytics/export?projectId=${projectId}&type=${type}&format=${format}&from=${fromStr}&to=${toStr}`;
    window.open(url, '_blank');
  };

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track content performance, costs, and engagement metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="icon" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      {contentMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Generated"
            value={contentMetrics.totalGenerated}
            description="Content items created"
            icon={FileText}
          />
          <MetricsCard
            title="Total Published"
            value={contentMetrics.totalPublished}
            description={`${contentMetrics.generationSuccessRate.toFixed(1)}% success rate`}
            icon={TrendingUp}
          />
          <MetricsCard
            title="Total Cost"
            value={`$${costData?.totalCost.toFixed(2) || '0.00'}`}
            description="AI generation costs"
            icon={DollarSign}
          />
          <MetricsCard
            title="Avg per Day"
            value={contentMetrics.contentVelocity.avgPerDay.toFixed(1)}
            description="Content velocity"
            icon={Activity}
          />
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content Metrics</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="platforms">Platform Engagement</TabsTrigger>
        </TabsList>

        {/* Content Metrics Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv', 'content')}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {contentMetrics && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <ContentChart
                  title="Content Type Breakdown"
                  description="Distribution of generated content types"
                  type="pie"
                  data={[
                    { name: 'Blog Posts', value: contentMetrics.contentTypeBreakdown.blogPosts },
                    {
                      name: 'Email Campaigns',
                      value: contentMetrics.contentTypeBreakdown.emailCampaigns,
                    },
                    {
                      name: 'Social Posts',
                      value: contentMetrics.contentTypeBreakdown.socialPosts,
                    },
                  ]}
                />

                <ContentChart
                  title="AI Provider Usage"
                  description="Token usage by AI provider"
                  type="bar"
                  xAxisKey="provider"
                  dataKeys={['tokens']}
                  data={[
                    {
                      provider: 'OpenAI',
                      tokens: contentMetrics.aiProviderStats.openai.tokens,
                    },
                    {
                      provider: 'Anthropic',
                      tokens: contentMetrics.aiProviderStats.anthropic.tokens,
                    },
                  ]}
                />
              </div>

              <ContentChart
                title="Platform Distribution"
                description="Content published per platform"
                type="bar"
                xAxisKey="platform"
                dataKeys={['count']}
                data={Object.entries(contentMetrics.platformBreakdown).map(
                  ([platform, count]) => ({
                    platform,
                    count,
                  })
                )}
              />
            </>
          )}
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv', 'costs')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {costData && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricsCard
                  title="Total Tokens"
                  value={costData.totalTokens.toLocaleString()}
                  description="AI tokens consumed"
                  icon={BarChart3}
                />
                <MetricsCard
                  title="Total API Calls"
                  value={costData.totalApiCalls}
                  description="AI generation requests"
                  icon={Activity}
                />
                <MetricsCard
                  title="Total Images"
                  value={costData.totalImages}
                  description="Images generated"
                  icon={FileText}
                />
              </div>

              <ContentChart
                title="Cost Breakdown by Service"
                description="Spending distribution across AI services"
                type="pie"
                data={Object.entries(costData.serviceBreakdown).map(([service, data]: any) => ({
                  name: service.replace(/_/g, ' '),
                  value: data.totalCost,
                }))}
              />
            </>
          )}
        </TabsContent>

        {/* Platform Engagement Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv', 'platforms')}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {platformData?.platformAggregates && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <ContentChart
                  title="Engagement by Platform"
                  description="Total engagement metrics across platforms"
                  type="bar"
                  xAxisKey="platform"
                  dataKeys={['likes', 'shares', 'comments']}
                  data={Object.entries(platformData.platformAggregates).map(
                    ([platform, metrics]: any) => ({
                      platform,
                      likes: metrics.totalLikes,
                      shares: metrics.totalShares,
                      comments: metrics.totalComments,
                    })
                  )}
                />

                <ContentChart
                  title="Views by Platform"
                  description="Content reach across platforms"
                  type="bar"
                  xAxisKey="platform"
                  dataKeys={['views']}
                  data={Object.entries(platformData.platformAggregates).map(
                    ([platform, metrics]: any) => ({
                      platform,
                      views: metrics.totalViews,
                    })
                  )}
                />
              </div>

              <ContentChart
                title="Engagement Rate Comparison"
                description="Average engagement rate by platform"
                type="bar"
                xAxisKey="platform"
                dataKeys={['engagementRate']}
                data={Object.entries(platformData.platformAggregates).map(
                  ([platform, metrics]: any) => ({
                    platform,
                    engagementRate: (metrics.avgEngagementRate * 100).toFixed(2),
                  })
                )}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AnalyticsDashboard />
    </Suspense>
  );
}

"use client";

/**
 * Performance Dashboard Component
 *
 * Real-time monitoring dashboard for:
 * - Job performance metrics
 * - Queue status
 * - System health
 * - Active alerts
 * - Performance trends
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardData {
  timestamp: Date;
  jobs: JobMetric[];
  queue: QueueMetrics;
  system: SystemMetrics;
  performance: {
    snapshot: PerformanceSnapshot;
    trends: PerformanceTrend[];
    slowest: SlowOperation[];
    resource: ResourceUsage;
  };
  alerts: {
    active: number;
    items: Alert[];
  };
}

interface JobMetric {
  jobId: string;
  jobName: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  failureRate: number;
  avgExecutionTime: number;
  p95ExecutionTime: number;
}

interface QueueMetrics {
  pending: number;
  queued: number;
  processing: number;
  failed: number;
  deadLetter: number;
}

interface SystemMetrics {
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  queueLength: number;
  deadLetterQueueLength: number;
}

interface PerformanceSnapshot {
  timestamp: Date;
  metrics: {
    avgJobExecutionTime: number;
    p95JobExecutionTime: number;
    p99JobExecutionTime: number;
    jobThroughput: number;
    errorRate: number;
  };
  bottlenecks: Bottleneck[];
}

interface Bottleneck {
  type: string;
  name: string;
  severity: "low" | "medium" | "high";
  impact: string;
  recommendation: string;
}

interface PerformanceTrend {
  metric: string;
  direction: "improving" | "stable" | "degrading";
  changePercent: number;
}

interface SlowOperation {
  name: string;
  type: string;
  avgTime: number;
  p95Time: number;
  count: number;
}

interface ResourceUsage {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: Date;
}

export function PerformanceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch metrics data
  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const metricsData = await response.json();
      setData(metricsData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading performance metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No metrics available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${
              autoRefresh
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {data.alerts.active > 0 && (
        <Card className="p-6 border-red-500 border-2">
          <h2 className="text-xl font-bold mb-4 text-red-600">
            Active Alerts ({data.alerts.active})
          </h2>
          <div className="space-y-2">
            {data.alerts.items.map((alert) => (
              <div
                key={alert.id}
                className="flex justify-between items-center p-3 bg-red-50 rounded"
              >
                <div>
                  <div className="font-semibold">{alert.title}</div>
                  <div className="text-sm text-gray-600">{alert.message}</div>
                </div>
                <Badge
                  variant={
                    alert.severity === "critical"
                      ? "destructive"
                      : "default"
                  }
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">System Uptime</div>
          <div className="text-2xl font-bold">
            {formatUptime(data.system.uptime)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Error Rate</div>
          <div className="text-2xl font-bold">
            {data.system.errorRate.toFixed(2)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Queue Length</div>
          <div className="text-2xl font-bold">{data.system.queueLength}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Avg Response Time</div>
          <div className="text-2xl font-bold">
            {data.system.avgResponseTime.toFixed(0)}ms
          </div>
        </Card>
      </div>

      {/* Queue Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Queue Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold">{data.queue.pending}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Queued</div>
            <div className="text-2xl font-bold">{data.queue.queued}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Processing</div>
            <div className="text-2xl font-bold text-blue-600">
              {data.queue.processing}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {data.queue.failed}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Dead Letter</div>
            <div className="text-2xl font-bold text-orange-600">
              {data.queue.deadLetter}
            </div>
          </div>
        </div>
      </Card>

      {/* Job Performance */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Job Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Job</th>
                <th className="text-right p-2">Executions</th>
                <th className="text-right p-2">Success Rate</th>
                <th className="text-right p-2">Avg Time</th>
                <th className="text-right p-2">P95 Time</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr key={job.jobId} className="border-b">
                  <td className="p-2 font-mono text-sm">{job.jobId}</td>
                  <td className="p-2 text-right">{job.totalExecutions}</td>
                  <td className="p-2 text-right">
                    <Badge
                      variant={
                        job.successRate >= 95
                          ? "default"
                          : job.successRate >= 80
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {job.successRate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    {job.avgExecutionTime.toFixed(0)}ms
                  </td>
                  <td className="p-2 text-right">
                    {job.p95ExecutionTime.toFixed(0)}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Bottlenecks */}
      {data.performance.snapshot.bottlenecks.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Performance Bottlenecks</h2>
          <div className="space-y-3">
            {data.performance.snapshot.bottlenecks.map((bottleneck, idx) => (
              <div
                key={idx}
                className={`p-4 rounded border-l-4 ${
                  bottleneck.severity === "high"
                    ? "border-red-500 bg-red-50"
                    : bottleneck.severity === "medium"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-500 bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{bottleneck.name}</div>
                  <Badge
                    variant={
                      bottleneck.severity === "high"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {bottleneck.severity}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {bottleneck.impact}
                </div>
                <div className="text-sm text-blue-600">
                  💡 {bottleneck.recommendation}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Trends */}
      {data.performance.trends.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Performance Trends</h2>
          <div className="space-y-2">
            {data.performance.trends.map((trend, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div className="font-mono text-sm">{trend.metric}</div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      trend.direction === "improving"
                        ? "text-green-600"
                        : trend.direction === "degrading"
                        ? "text-red-600"
                        : "text-gray-600"
                    }
                  >
                    {trend.direction === "improving" ? "↓" : "↑"}{" "}
                    {Math.abs(trend.changePercent).toFixed(1)}%
                  </span>
                  <Badge
                    variant={
                      trend.direction === "improving"
                        ? "default"
                        : trend.direction === "degrading"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {trend.direction}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resource Usage */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Resource Usage</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Memory Usage</span>
              <span className="text-sm font-semibold">
                {data.performance.resource.memory.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={data.performance.resource.memory.percentage}
              className="h-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {formatBytes(data.performance.resource.memory.used)} /{" "}
              {formatBytes(data.performance.resource.memory.total)}
            </div>
          </div>
        </div>
      </Card>

      {/* Slowest Operations */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Slowest Operations</h2>
        <div className="space-y-2">
          {data.performance.slowest.map((op, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div className="font-mono text-sm">{op.name}</div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  Avg: {op.avgTime.toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-500">
                  P95: {op.p95Time.toFixed(0)}ms ({op.count} executions)
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Helper functions
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

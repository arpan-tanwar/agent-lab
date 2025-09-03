'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import { Header } from '@/components/header';

interface DashboardMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageTokensPerRun: number;
  averageCostPerRun: number;
  p95Latency: number;
  averageLatency: number;
  stepMetrics: Array<{
    stepName: string;
    averageTokens: number;
    averageCost: number;
    p95Latency: number;
    failureRate: number;
  }>;
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', timeRange],
    queryFn: async (): Promise<DashboardMetrics> => {
      try {
        // Fetch real metrics from the API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || 'https://agent-lab-production.up.railway.app'}/metrics?timeRange=${timeRange}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching metrics:', error);

        // Fallback to calculated metrics from runs data
        const runsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || 'https://agent-lab-production.up.railway.app'}/runs`,
        );

        if (!runsResponse.ok) {
          throw new Error('Failed to fetch runs data');
        }

        const runsData = await runsResponse.json();
        const runs = runsData.runs || [];

        // Calculate metrics from runs data
        const totalRuns = runs.length;
        const successfulRuns = runs.filter((run: any) => run.status === 'completed').length;
        const failedRuns = runs.filter((run: any) => run.status === 'failed').length;

        const runsWithMetrics = runs.filter((run: any) => run.metrics && run.metrics.totalTokens);
        const averageTokensPerRun =
          runsWithMetrics.length > 0
            ? Math.round(
                runsWithMetrics.reduce(
                  (sum: number, run: any) => sum + (run.metrics.totalTokens || 0),
                  0,
                ) / runsWithMetrics.length,
              )
            : 0;

        const averageCostPerRun =
          runsWithMetrics.length > 0
            ? runsWithMetrics.reduce(
                (sum: number, run: any) => sum + (run.metrics.costEstimateUsd || 0),
                0,
              ) / runsWithMetrics.length
            : 0;

        const latencies = runs
          .filter((run: any) => run.metrics && run.metrics.totalMs)
          .map((run: any) => run.metrics.totalMs)
          .sort((a: number, b: number) => a - b);

        const averageLatency =
          latencies.length > 0
            ? Math.round(
                latencies.reduce((sum: number, latency: number) => sum + latency, 0) /
                  latencies.length,
              )
            : 0;

        const p95Latency =
          latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

        // Calculate step metrics from timeline data
        const stepMetrics: Array<{
          stepName: string;
          averageTokens: number;
          averageCost: number;
          p95Latency: number;
          failureRate: number;
        }> = [];

        // Group steps by type and calculate averages
        const stepGroups: Record<string, any[]> = {};
        runs.forEach((run: any) => {
          if (run.timeline) {
            run.timeline.forEach((step: any) => {
              if (!stepGroups[step.type]) {
                stepGroups[step.type] = [];
              }
              stepGroups[step.type].push(step);
            });
          }
        });

        Object.entries(stepGroups).forEach(([stepName, steps]) => {
          const completedSteps = steps.filter((step: any) => step.status === 'completed');
          const failedSteps = steps.filter((step: any) => step.status === 'failed');

          const averageTokens =
            completedSteps.length > 0
              ? Math.round(
                  completedSteps.reduce(
                    (sum: number, step: any) => sum + (step.metrics?.tokens || 0),
                    0,
                  ) / completedSteps.length,
                )
              : 0;

          const averageCost =
            completedSteps.length > 0
              ? completedSteps.reduce(
                  (sum: number, step: any) => sum + (step.metrics?.cost_estimate || 0),
                  0,
                ) / completedSteps.length
              : 0;

          const stepLatencies = completedSteps
            .map((step: any) => step.metrics?.ms || 0)
            .filter((latency: number) => latency > 0)
            .sort((a: number, b: number) => a - b);

          const p95Latency =
            stepLatencies.length > 0 ? stepLatencies[Math.floor(stepLatencies.length * 0.95)] : 0;

          const failureRate = steps.length > 0 ? failedSteps.length / steps.length : 0;

          stepMetrics.push({
            stepName,
            averageTokens,
            averageCost,
            p95Latency,
            failureRate,
          });
        });

        return {
          totalRuns,
          successfulRuns,
          failedRuns,
          averageTokensPerRun,
          averageCostPerRun,
          p95Latency,
          averageLatency,
          stepMetrics,
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error loading metrics</h2>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );

  const successRate =
    metrics.totalRuns > 0 ? ((metrics.successfulRuns / metrics.totalRuns) * 100).toFixed(1) : '0.0';
  const failureRate =
    metrics.totalRuns > 0 ? ((metrics.failedRuns / metrics.totalRuns) * 100).toFixed(1) : '0.0';

  // Calculate trend indicators (simplified - in production you'd compare with previous period)
  const getTrendIndicator = (current: number, previous: number = 0) => {
    if (previous === 0) return { direction: 'neutral', percentage: 0, color: 'text-gray-500' };
    const change = ((current - previous) / previous) * 100;
    if (change > 0)
      return { direction: 'up', percentage: Math.abs(change).toFixed(1), color: 'text-green-500' };
    if (change < 0)
      return { direction: 'down', percentage: Math.abs(change).toFixed(1), color: 'text-red-500' };
    return { direction: 'neutral', percentage: 0, color: 'text-gray-500' };
  };

  // For demo purposes, we'll show neutral trends since we don't have historical data
  const totalRunsTrend = { direction: 'neutral', percentage: 0, color: 'text-gray-500' };
  const successRateTrend = { direction: 'neutral', percentage: 0, color: 'text-gray-500' };
  const tokensTrend = { direction: 'neutral', percentage: 0, color: 'text-gray-500' };
  const costTrend = { direction: 'neutral', percentage: 0, color: 'text-gray-500' };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor your workflow performance and costs</p>
          </div>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalRuns}</p>
                <div className="flex items-center mt-1">
                  {totalRunsTrend.direction === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {totalRunsTrend.direction === 'down' && (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {totalRunsTrend.direction === 'neutral' && (
                    <span className="h-3 w-3 mr-1">—</span>
                  )}
                  <span className={`text-xs ${totalRunsTrend.color}`}>
                    {totalRunsTrend.direction === 'neutral'
                      ? 'No change'
                      : `${totalRunsTrend.direction === 'up' ? '+' : '-'}${totalRunsTrend.percentage}% from last period`}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div
            className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 animate-scale-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-500">{successRate}%</p>
                <div className="flex items-center mt-1">
                  {successRateTrend.direction === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {successRateTrend.direction === 'down' && (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {successRateTrend.direction === 'neutral' && (
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs ${successRateTrend.color}`}>
                    {successRateTrend.direction === 'neutral'
                      ? 'Stable'
                      : `${successRateTrend.direction === 'up' ? '+' : '-'}${successRateTrend.percentage}% from last period`}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div
            className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Tokens/Run</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.averageTokensPerRun.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {tokensTrend.direction === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {tokensTrend.direction === 'down' && (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {tokensTrend.direction === 'neutral' && <span className="h-3 w-3 mr-1">—</span>}
                  <span className={`text-xs ${tokensTrend.color}`}>
                    {tokensTrend.direction === 'neutral'
                      ? 'Stable'
                      : `${tokensTrend.direction === 'up' ? '+' : '-'}${tokensTrend.percentage}% from last period`}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div
            className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 animate-scale-in"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Cost/Run</p>
                <p className="text-2xl font-bold text-foreground">
                  ${metrics.averageCostPerRun.toFixed(4)}
                </p>
                <div className="flex items-center mt-1">
                  {costTrend.direction === 'up' && (
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {costTrend.direction === 'down' && (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {costTrend.direction === 'neutral' && (
                    <DollarSign className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs ${costTrend.color}`}>
                    {costTrend.direction === 'neutral'
                      ? 'Cost efficient'
                      : `${costTrend.direction === 'up' ? '+' : '-'}${costTrend.percentage}% from last period`}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl border border-border bg-card animate-slide-up">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold">Latency Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Average Latency</span>
                <span className="font-medium text-foreground">{metrics.averageLatency}ms</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">P95 Latency</span>
                <span className="font-medium text-foreground">{metrics.p95Latency}ms</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10">
                <span className="text-sm text-muted-foreground">Failed Runs</span>
                <span className="font-medium text-destructive">
                  {metrics.failedRuns} ({failureRate}%)
                </span>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-xl border border-border bg-card animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold">Cost Breakdown</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Cost (Est.)</span>
                <span className="font-medium text-foreground">
                  ${(metrics.averageCostPerRun * metrics.totalRuns).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Cost per Success</span>
                <span className="font-medium text-foreground">
                  $
                  {(
                    metrics.averageCostPerRun /
                    (metrics.successfulRuns / metrics.totalRuns)
                  ).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10">
                <span className="text-sm text-muted-foreground">Wasted Cost (Failed)</span>
                <span className="font-medium text-destructive">
                  ${(metrics.averageCostPerRun * metrics.failedRuns).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Metrics */}
        <div
          className="p-6 rounded-xl border border-border bg-card animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center mb-6">
            <Activity className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Step Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avg Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avg Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    P95 Latency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Failure Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.stepMetrics.map((step, index) => (
                  <tr key={index} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {step.stepName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {step.averageTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      ${step.averageCost.toFixed(4)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {step.p95Latency}ms
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          step.failureRate > 0.1
                            ? 'bg-destructive/10 text-destructive'
                            : step.failureRate > 0.05
                              ? 'bg-yellow-500/10 text-yellow-600'
                              : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {(step.failureRate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

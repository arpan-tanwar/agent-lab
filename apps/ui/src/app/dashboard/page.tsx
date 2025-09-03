'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
      // Mock data for now - in production, you'd have a dedicated metrics endpoint
      const mockMetrics: DashboardMetrics = {
        totalRuns: 156,
        successfulRuns: 142,
        failedRuns: 14,
        averageTokensPerRun: 1247,
        averageCostPerRun: 0.0034,
        p95Latency: 2847,
        averageLatency: 1234,
        stepMetrics: [
          {
            stepName: 'parseEmail',
            averageTokens: 156,
            averageCost: 0.0004,
            p95Latency: 234,
            failureRate: 0.02,
          },
          {
            stepName: 'enrichCompany',
            averageTokens: 0,
            averageCost: 0.0001,
            p95Latency: 89,
            failureRate: 0.01,
          },
          {
            stepName: 'scoreLead',
            averageTokens: 0,
            averageCost: 0.0001,
            p95Latency: 45,
            failureRate: 0.005,
          },
          {
            stepName: 'createCRMRecord',
            averageTokens: 0,
            averageCost: 0.0001,
            p95Latency: 234,
            failureRate: 0.08,
          },
          {
            stepName: 'notifySlack',
            averageTokens: 0,
            averageCost: 0.0001,
            p95Latency: 567,
            failureRate: 0.12,
          },
        ],
      };
      return mockMetrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return <div>Error loading metrics</div>;

  const successRate = ((metrics.successfulRuns / metrics.totalRuns) * 100).toFixed(1);
  const failureRate = ((metrics.failedRuns / metrics.totalRuns) * 100).toFixed(1);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cost Dashboard</h1>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRuns}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">{successRate}%</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Tokens/Run</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageTokensPerRun.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">🔤</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Cost/Run</p>
              <p className="text-2xl font-bold text-gray-900">
                ${metrics.averageCostPerRun.toFixed(4)}
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Latency Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Latency</span>
              <span className="font-medium">{metrics.averageLatency}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">P95 Latency</span>
              <span className="font-medium">{metrics.p95Latency}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Runs</span>
              <span className="font-medium text-red-600">
                {metrics.failedRuns} ({failureRate}%)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Cost (Est.)</span>
              <span className="font-medium">
                ${(metrics.averageCostPerRun * metrics.totalRuns).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cost per Success</span>
              <span className="font-medium">
                $
                {(metrics.averageCostPerRun / (metrics.successfulRuns / metrics.totalRuns)).toFixed(
                  4,
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Wasted Cost (Failed)</span>
              <span className="font-medium text-red-600">
                ${(metrics.averageCostPerRun * metrics.failedRuns).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Step Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95 Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failure Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.stepMetrics.map((step, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {step.stepName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.averageTokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${step.averageCost.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.p95Latency}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        step.failureRate > 0.1
                          ? 'bg-red-100 text-red-800'
                          : step.failureRate > 0.05
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
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
    </div>
  );
}

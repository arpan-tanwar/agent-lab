'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Run } from '@/lib/api';
import Link from 'next/link';

export default function RunsPage() {
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const queryClient = useQueryClient();

  // Mock data for now - in a real app, you'd have an API endpoint to list runs
  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', filter],
    queryFn: async (): Promise<Run[]> => {
      // Mock data including some failed runs for demonstration
      const mockRuns: Run[] = [
        {
          id: 'run-1',
          workflowId: 'wf-1',
          status: 'completed',
          startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          finishedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
          metrics: {
            totalMs: 1200,
            totalTokens: 1247,
            costEstimateUsd: 0.0034,
            perStep: [
              {
                stepKey: 'parseEmail',
                kind: 'llm',
                ms: 234,
                tokens: 156,
                costEstimateUsd: 0.0004,
                attempts: 1,
              },
              {
                stepKey: 'enrichCompany',
                kind: 'tool',
                ms: 89,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 1,
              },
              {
                stepKey: 'scoreLead',
                kind: 'tool',
                ms: 45,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 1,
              },
              {
                stepKey: 'createCRMRecord',
                kind: 'tool',
                ms: 234,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 1,
              },
              {
                stepKey: 'notifySlack',
                kind: 'tool',
                ms: 567,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 1,
              },
            ],
          },
        },
        {
          id: 'run-2',
          workflowId: 'wf-1',
          status: 'failed',
          startedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          finishedAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
          metrics: {
            totalMs: 800,
            totalTokens: 156,
            costEstimateUsd: 0.0004,
            perStep: [
              {
                stepKey: 'parseEmail',
                kind: 'llm',
                ms: 234,
                tokens: 156,
                costEstimateUsd: 0.0004,
                attempts: 1,
              },
              {
                stepKey: 'enrichCompany',
                kind: 'tool',
                ms: 89,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 1,
              },
              {
                stepKey: 'scoreLead',
                kind: 'tool',
                ms: 45,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 1,
              },
              {
                stepKey: 'createCRMRecord',
                kind: 'tool',
                ms: 234,
                tokens: 0,
                costEstimateUsd: 0.0001,
                attempts: 3,
                errorTag: 'API_TIMEOUT',
              },
              {
                stepKey: 'notifySlack',
                kind: 'tool',
                ms: 0,
                tokens: 0,
                costEstimateUsd: 0,
                attempts: 0,
              },
            ],
          },
        },
        {
          id: 'run-3',
          workflowId: 'wf-1',
          status: 'running',
          startedAt: new Date(Date.now() - 1000 * 30).toISOString(),
          metrics: {
            totalMs: 300,
            totalTokens: 0,
            costEstimateUsd: 0,
            perStep: [],
          },
        },
      ];

      return mockRuns.filter((run) => filter === 'all' || run.status === filter);
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (runId: string) => {
      const response = await fetch(
        `https://agent-lab-production.up.railway.app/runs/${runId}/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (!response.ok) throw new Error('Retry failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRuns = runs?.filter((run: Run) => filter === 'all' || run.status === filter) || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Runs</h1>
        <div className="flex gap-2">
          {(['all', 'running', 'completed', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div>Loading runs...</div>
      ) : filteredRuns.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg mb-2">No runs found</p>
          <p className="text-sm">
            {filter === 'all' ? 'Start a workflow to see runs here' : `No ${filter} runs found`}
          </p>
          <Link
            href="/workflows"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Workflows
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRuns.map((run: Run) => (
            <Link key={run.id} href={`/runs/${run.id}`}>
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Run {run.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-gray-600">
                      Workflow: {run.workflowId.slice(0, 8)}...
                    </p>
                    {run.startedAt && (
                      <p className="text-xs text-gray-500">
                        Started: {new Date(run.startedAt).toLocaleString()}
                      </p>
                    )}
                    {run.finishedAt && (
                      <p className="text-xs text-gray-500">
                        Finished: {new Date(run.finishedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(run.status)}`}
                    >
                      {run.status}
                    </span>
                    {run.status === 'failed' && (
                      <button
                        onClick={() => retryMutation.mutate(run.id)}
                        disabled={retryMutation.isPending}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {retryMutation.isPending ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                    {run.metrics && (
                      <div className="text-right text-sm text-gray-600">
                        <div>{run.metrics.totalMs}ms</div>
                        <div>{run.metrics.totalTokens} tokens</div>
                        <div>${run.metrics.costEstimateUsd.toFixed(4)}</div>
                        {run.metrics.perStep.some((step) => step.attempts && step.attempts > 1) && (
                          <div className="text-orange-600 text-xs">
                            {
                              run.metrics.perStep.filter(
                                (step) => step.attempts && step.attempts > 1,
                              ).length
                            }{' '}
                            retries
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

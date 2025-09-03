'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type Run } from '@/lib/api';
import Link from 'next/link';

export default function RunsPage() {
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');

  // Mock data for now - in a real app, you'd have an API endpoint to list runs
  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', filter],
    queryFn: async () => {
      // For now, return empty array since there's no list runs API
      // In production, you'd call: runsApi.list() or similar
      return [];
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
                    {run.metrics && (
                      <div className="text-right text-sm text-gray-600">
                        <div>{run.metrics.totalMs}ms</div>
                        <div>{run.metrics.totalTokens} tokens</div>
                        <div>${run.metrics.costEstimateUsd.toFixed(4)}</div>
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

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Run } from '@/lib/api';
import Link from 'next/link';
import { Activity, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Header } from '@/components/header';

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
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRuns = runs?.filter((run: Run) => filter === 'all' || run.status === filter) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflow Runs</h1>
            <p className="text-muted-foreground">Monitor and manage your workflow executions</p>
          </div>
          <div className="flex gap-2">
            {(['all', 'running', 'completed', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {getStatusIcon(status)}
                {status}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No runs found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' ? 'Start a workflow to see runs here' : `No ${filter} runs found`}
            </p>
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Workflows
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRuns.map((run: Run, index) => (
              <Link key={run.id} href={`/runs/${run.id}`}>
                <div
                  className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-slide-up cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">Run {run.id.slice(0, 8)}</h3>
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(run.status)}`}
                        >
                          {getStatusIcon(run.status)}
                          {run.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Workflow: {run.workflowId.slice(0, 8)}</p>
                        {run.startedAt && (
                          <p>Started: {new Date(run.startedAt).toLocaleString()}</p>
                        )}
                        {run.finishedAt && (
                          <p>Finished: {new Date(run.finishedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {run.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            retryMutation.mutate(run.id);
                          }}
                          disabled={retryMutation.isPending}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {retryMutation.isPending ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                      {run.metrics && (
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-4">
                            <div className="text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {run.metrics.totalMs}ms
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {run.metrics.totalTokens} tokens
                              </div>
                              <div className="flex items-center gap-1">
                                <span>$</span>
                                {run.metrics.costEstimateUsd.toFixed(4)}
                              </div>
                            </div>
                            {run.metrics.perStep.some(
                              (step) => step.attempts && step.attempts > 1,
                            ) && (
                              <div className="text-orange-600 text-xs bg-orange-500/10 px-2 py-1 rounded">
                                {
                                  run.metrics.perStep.filter(
                                    (step) => step.attempts && step.attempts > 1,
                                  ).length
                                }{' '}
                                retries
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

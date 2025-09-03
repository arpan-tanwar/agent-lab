'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { runsApi, type TimelineStep } from '@/lib/api';

export default function RunPage() {
  const params = useParams();
  const runId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['run', runId],
    queryFn: async () => {
      const res = await runsApi.get(runId);
      return res.data;
    },
    refetchInterval: 2000, // Simple polling every 2s
  });

  const run = data?.run;
  const timeline = data?.timeline || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-400';
      case 'failed':
        return 'bg-red-500 dark:bg-red-400';
      case 'running':
        return 'bg-blue-500 dark:bg-blue-400';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  if (isLoading) return <div className="p-6 text-foreground">Loading run...</div>;
  if (error) return <div className="p-6 text-red-600 dark:text-red-400">Error loading run</div>;
  if (!run) return <div className="p-6 text-foreground">Run not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Run {runId}</h1>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(run.status)}`}>
            {run.status}
          </span>
          {run.startedAt && (
            <span className="text-sm text-muted-foreground">
              Started: {new Date(run.startedAt).toLocaleString()}
            </span>
          )}
          {run.finishedAt && (
            <span className="text-sm text-muted-foreground">
              Finished: {new Date(run.finishedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Timeline</h2>
          <div className="space-y-4">
            {timeline.map((step: TimelineStep) => (
              <div key={step.stepId} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getStepStatusColor(step.status)}`} />
                  <span className="font-medium text-foreground">
                    Step {step.order}: {step.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(step.status)}`}>
                    {step.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                  <div>Tokens: {step.metrics?.tokens || 0}</div>
                  <div>Time: {step.metrics?.ms || 0}ms</div>
                  <div>Cost: ${step.metrics?.cost_estimate?.toFixed(4) || '0.0000'}</div>
                </div>

                {step.inputs != null && (
                  <details className="mb-2">
                    <summary className="cursor-pointer text-sm font-medium text-foreground">
                      Input
                    </summary>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto text-foreground">
                      {JSON.stringify(step.inputs, null, 2)}
                    </pre>
                  </details>
                )}

                {step.outputs != null && (
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-foreground">
                      Output
                    </summary>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto text-foreground">
                      {JSON.stringify(step.outputs, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Sidebar */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Metrics</h2>
          {run.metrics && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">Overall</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Total Time: {run.metrics?.totalMs || 0}ms</div>
                  <div>Total Tokens: {run.metrics?.totalTokens || 0}</div>
                  <div>Total Cost: ${run.metrics?.costEstimateUsd?.toFixed(4) || '0.0000'}</div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-foreground">Per Step</h3>
                <div className="space-y-2">
                  {run.metrics?.perStep?.length ? (
                    run.metrics.perStep.map((step, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium text-foreground">{step.stepKey}</div>
                        <div className="text-muted-foreground">
                          {step.ms || 0}ms • {step.tokens || 0} tokens • $
                          {step.costEstimateUsd?.toFixed(4) || '0.0000'}
                          {step.attempts && step.attempts > 1 && (
                            <span className="text-orange-600 dark:text-orange-400">
                              {' '}
                              • {step.attempts} attempts
                            </span>
                          )}
                          {step.errorTag && (
                            <span className="text-red-600 dark:text-red-400">
                              {' '}
                              • {step.errorTag}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No step metrics available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

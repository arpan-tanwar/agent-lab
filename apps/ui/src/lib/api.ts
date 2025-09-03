import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://agent-lab-production.up.railway.app';

export const api = axios.create({ baseURL: API_BASE });

export interface Workflow {
  id: string;
  name: string;
  version: number;
}

export interface Run {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  metrics?: {
    totalMs: number;
    totalTokens: number;
    costEstimateUsd: number;
    perStep: Array<{
      stepKey: string;
      kind: string;
      ms: number;
      tokens: number;
      costEstimateUsd: number;
      attempts?: number;
      errorTag?: string;
    }>;
  };
}

export interface TimelineStep {
  stepId: number;
  type: string;
  order: number;
  status: string;
  metrics: { tokens: number; ms: number; cost_estimate: number };
  inputs: unknown;
  outputs: unknown;
}

export const workflowsApi = {
  list: () => api.get<{ workflows: Workflow[] }>('/workflows'),
  create: (data: { name: string; version?: number; steps?: unknown[] }) =>
    api.post<{ workflowId: string }>('/workflows', data),
};

export const runsApi = {
  start: (workflowId: string) => api.post<{ runId: string }>(`/runs/${workflowId}/start`),
  get: (runId: string) => api.get<{ run: Run; timeline: TimelineStep[] }>(`/runs/${runId}`),
};

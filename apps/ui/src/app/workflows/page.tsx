'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi, type Workflow } from '@/lib/api';
import { Header } from '@/components/header';
import { Plus, Play, Workflow as WorkflowIcon, XCircle, RotateCcw } from 'lucide-react';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function WorkflowsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', version: 1 });
  const queryClient = useQueryClient();

  const {
    data: workflows,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      try {
        const res = await workflowsApi.list();
        return res.data.workflows;
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const createMutation = useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowCreate(false);
      setFormData({ name: '', version: 1 });
    },
  });

  const startRunMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'https://agent-lab-production.up.railway.app'}/runs/${workflowId}/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' }),
        },
      );
      if (!response.ok) throw new Error('Failed to start run');
      return response.json();
    },
    onSuccess: () => {
      // Show success message or redirect to runs page
      window.location.href = '/runs';
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Workflows</h1>
            <p className="text-muted-foreground">Create and manage your automation workflows</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-card border border-border p-6 rounded-xl w-96 shadow-lg animate-scale-in">
              <h2 className="text-xl font-semibold mb-4">Create Workflow</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Version</label>
                  <input
                    type="number"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: parseInt(e.target.value) })
                    }
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
              <XCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load workflows</h3>
            <p className="text-muted-foreground mb-4">
              {(error as ApiError)?.response?.data?.error || 'Unable to connect to the server'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : workflows && workflows.length > 0 ? (
          <div className="grid gap-4">
            {workflows.map((workflow: Workflow, index) => (
              <div
                key={workflow.id}
                className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <WorkflowIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">Version {workflow.version}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">ID: {workflow.id}</p>
                  </div>
                  <button
                    onClick={() => {
                      startRunMutation.mutate(workflow.id);
                    }}
                    disabled={startRunMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    {startRunMutation.isPending ? 'Starting...' : 'Run'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
              <WorkflowIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
            <p className="text-muted-foreground mb-4">Create your first workflow to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Workflow
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

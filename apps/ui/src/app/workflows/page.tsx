'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi, type Workflow } from '@/lib/api';

export default function WorkflowsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', version: 1 });
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await workflowsApi.list();
      return res.data.workflows;
    },
  });

  const createMutation = useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowCreate(false);
      setFormData({ name: '', version: 1 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Workflow
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Create Workflow</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Version</label>
                <input
                  type="number"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div>Loading workflows...</div>
      ) : (
        <div className="grid gap-4">
          {workflows?.map((workflow: Workflow) => (
            <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <p className="text-sm text-gray-600">Version {workflow.version}</p>
                  <p className="text-xs text-gray-500">ID: {workflow.id}</p>
                </div>
                <button
                  onClick={() => {
                    // TODO: Start run
                    console.log('Start run for', workflow.id);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Run
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

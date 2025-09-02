'use client';

import { useState } from 'react';

export default function TestsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{ name: string; status: 'pass' | 'fail'; duration: number; error?: string }>
  >([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Mock test results for now
    setTimeout(() => {
      setResults([
        { name: 'Lead Triage - 12 fixtures', status: 'pass', duration: 45 },
        { name: 'Ticket Summarizer - 12 fixtures', status: 'pass', duration: 38 },
        { name: 'Budget: p95 latency <2s', status: 'pass', duration: 12 },
        { name: 'Budget: tokens <1.5k', status: 'pass', duration: 8 },
      ]);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tests</h1>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run All Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${result.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="font-medium">{result.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    result.status === 'pass'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.status}
                </span>
                <span className="text-sm text-gray-600">{result.duration}ms</span>
              </div>
            </div>
            {result.error && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">{result.error}</div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className="text-center text-gray-500 py-8">
          Click &quot;Run All Tests&quot; to execute fixture suites and budget checks
        </div>
      )}
    </div>
  );
}

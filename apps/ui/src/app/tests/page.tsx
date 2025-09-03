'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Play, CheckCircle, XCircle, Clock, TestTube } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Test Suite</h1>
            <p className="text-muted-foreground">Run fixture suites and budget checks</p>
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 animate-slide-up"
                 style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.status === 'pass' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium text-foreground">{result.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${
                      result.status === 'pass'
                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}
                  >
                    {result.status === 'pass' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {result.status}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {result.duration}ms
                  </div>
                </div>
              </div>
              {result.error && (
                <div className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
              <TestTube className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No test results</h3>
            <p className="text-muted-foreground mb-4">
              Click &quot;Run All Tests&quot; to execute fixture suites and budget checks
            </p>
            <button
              onClick={runTests}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Play className="h-4 w-4" />
              Run All Tests
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

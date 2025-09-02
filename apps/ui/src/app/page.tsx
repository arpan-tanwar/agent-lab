import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Agent Lab Operator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/workflows" className="block">
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Workflows</h2>
            <p className="text-gray-600">Create and manage agent workflows</p>
          </div>
        </Link>
        
        <Link href="/runs" className="block">
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Runs</h2>
            <p className="text-gray-600">Monitor workflow executions</p>
          </div>
        </Link>
        
        <Link href="/tests" className="block">
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Tests</h2>
            <p className="text-gray-600">Run fixture suites and budget checks</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  TestTube,
  Workflow,
  Zap,
  TrendingUp,
  Shield,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/header';

const features = [
  {
    icon: Zap,
    title: 'Automated Workflows',
    description: 'AI-powered email processing with intelligent lead scoring',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Analytics',
    description: 'Monitor performance, costs, and success rates',
  },
  {
    icon: Shield,
    title: 'Reliable & Secure',
    description: 'Built-in retry logic and comprehensive error handling',
  },
  {
    icon: Clock,
    title: '24/7 Processing',
    description: 'Continuous monitoring and instant notifications',
  },
];

const quickActions = [
  {
    title: 'Workflows',
    description: 'Create and manage agent workflows',
    href: '/workflows',
    icon: Workflow,
    color: 'bg-blue-500',
  },
  {
    title: 'Runs',
    description: 'Monitor workflow executions',
    href: '/runs',
    icon: Activity,
    color: 'bg-green-500',
  },
  {
    title: 'Dashboard',
    description: 'View cost and performance metrics',
    href: '/dashboard',
    icon: BarChart3,
    color: 'bg-purple-500',
  },
  {
    title: 'Tests',
    description: 'Run fixture suites and budget checks',
    href: '/tests',
    icon: TestTube,
    color: 'bg-orange-500',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Agent Lab
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered workflow automation platform that processes emails, enriches leads, and
            delivers insights at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/workflows"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Explore Workflows
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Agent Lab?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group block p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

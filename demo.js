// Demo script to show complete workflow execution
import { createLeadRegistry, makeParseEmailLlm } from './src/workflows/lead.js';
import { runWorkflow } from './src/runner/executor.js';

const memoryRepos = () => {
  const artifacts = [];
  const runs = {};
  const steps = [
    { id: 1, order: 0, type: 'llm', config: { name: 'parseEmail' } },
    { id: 2, order: 1, type: 'tool', config: { name: 'enrichCompany' } },
    { id: 3, order: 2, type: 'tool', config: { name: 'scoreLead' } },
    { id: 4, order: 3, type: 'tool', config: { name: 'createCRMRecord' } },
    { id: 5, order: 4, type: 'tool', config: { name: 'notifySlack' } },
  ];

  return {
    async persistArtifact(a) {
      artifacts.push(a);
      console.log(`📝 Artifact: ${a.kind} for step ${a.stepId}`, a.data);
    },
    async updateRun({ runId, ...rest }) {
      runs[runId] = { ...(runs[runId] || {}), runId, ...rest };
      console.log(
        `🔄 Run ${runId}: ${rest.status}`,
        rest.metrics ? `(${rest.metrics.totalMs}ms, ${rest.metrics.totalTokens} tokens)` : '',
      );
    },
    async createRunIfMissing({ workflowId }) {
      const id = crypto.randomUUID();
      runs[id] = { runId: id, workflowId, status: 'running' };
      console.log(`🚀 Created run ${id} for workflow ${workflowId}`);
      return id;
    },
    async loadWorkflowSteps() {
      return steps;
    },
  };
};

async function demo() {
  console.log('🎯 Agent Lab Workflow Demo\n');

  const registry = createLeadRegistry();
  const llm = makeParseEmailLlm();
  const repos = memoryRepos();

  const input = {
    subject: 'Acme pricing inquiry',
    body: 'Need a quote for enterprise plan',
    from: 'alice@acme.com',
  };

  console.log('📧 Input:', input);
  console.log('\n🔄 Executing Lead Triage Workflow...\n');

  const result = await runWorkflow(repos, registry, llm, {
    workflowId: 'lead-demo',
    input,
    budgets: { maxMs: 2000, maxTokens: 1500 },
  });

  console.log('\n✅ Workflow Complete!');
  console.log('📊 Result:', result);

  if ('metrics' in result) {
    console.log('\n📈 Performance Metrics:');
    console.log(`   Total Time: ${result.metrics.totalMs}ms`);
    console.log(`   Total Tokens: ${result.metrics.totalTokens}`);
    console.log(`   Total Cost: $${result.metrics.costEstimateUsd.toFixed(4)}`);
    console.log('\n🔧 Step Details:');
    result.metrics.perStep.forEach((step, i) => {
      console.log(
        `   ${i + 1}. ${step.stepKey} (${step.kind}): ${step.ms}ms, ${step.tokens} tokens`,
      );
    });
  }
}

demo().catch(console.error);

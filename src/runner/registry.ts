import type { AnyStepDefinition, BranchDefinition, LlmDefinition, ToolDefinition } from './types';

export class StepRegistry {
  private tools = new Map<string, ToolDefinition>();
  private llms = new Map<string, LlmDefinition>();
  private branches = new Map<string, BranchDefinition>();

  register(step: AnyStepDefinition) {
    if (step.kind === 'tool') this.tools.set(step.name, step);
    else if (step.kind === 'llm') this.llms.set(step.name, step);
    else if (step.kind === 'branch') this.branches.set(step.name, step);
    return this;
  }

  getTool(name: string) {
    const s = this.tools.get(name);
    if (!s) throw new Error(`tool not found: ${name}`);
    return s;
  }
  getLlm(name: string) {
    const s = this.llms.get(name);
    if (!s) throw new Error(`llm not found: ${name}`);
    return s;
  }
  getBranch(name: string) {
    const s = this.branches.get(name);
    if (!s) throw new Error(`branch not found: ${name}`);
    return s;
  }
}

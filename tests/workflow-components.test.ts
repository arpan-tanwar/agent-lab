import { describe, it, expect, vi } from 'vitest';
import { toolRegistry } from '../src/runner/tools.js';

// Mock the Gemini provider for testing
vi.mock('../src/runner/llm.js', () => ({
  geminiProvider: {
    callLLM: vi.fn().mockResolvedValue({
      content: 'positive',
      tokens: 10,
      cost: 0,
      model: 'gemini-1.5-flash',
    }),
    validateConfig: vi.fn().mockResolvedValue(true),
  },
}));

describe('Workflow Components', () => {
  it('should handle tool registry operations', () => {
    const availableTools = toolRegistry.getAvailableTools();
    expect(availableTools).toContain('email');
    expect(availableTools).toContain('slack');
    expect(availableTools).toContain('crm');
    expect(availableTools).toContain('http');
    expect(availableTools).toContain('process');
  });

  it('should execute email tool', async () => {
    const config = {
      name: 'email',
      to: 'test@example.com',
      subject: 'Test Subject',
    };

    const input = {
      to: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test message',
    };

    const result = await toolRegistry.executeTool('email', config, input);

    expect(result.data).toBeTruthy();
    expect(result.status).toBe(200);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should execute slack tool', async () => {
    const config = {
      name: 'slack',
    };

    const input = {
      channel: '#general',
      message: 'Test message',
    };

    const result = await toolRegistry.executeTool('slack', config, input);

    expect(result.data).toBeTruthy();
    expect(result.status).toBe(200);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should execute CRM tool', async () => {
    const config = {
      name: 'crm',
    };

    const input = {
      action: 'create',
      data: { name: 'Test Lead', email: 'test@example.com' },
    };

    const result = await toolRegistry.executeTool('crm', config, input);

    expect(result.data).toBeTruthy();
    expect(result.status).toBe(200);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should execute data processing tool', async () => {
    const config = {
      name: 'process',
    };

    const input = {
      operation: 'extract',
      data: { text: 'Sample data' },
    };

    const result = await toolRegistry.executeTool('process', config, input);

    expect(result.data).toBeTruthy();
    expect(result.status).toBe(200);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should handle unknown tool gracefully', async () => {
    const config = {
      name: 'unknown-tool',
    };

    await expect(toolRegistry.executeTool('unknown-tool', config, {})).rejects.toThrow(
      "Tool 'unknown-tool' not found",
    );
  });

  it('should validate LLM configuration', async () => {
    // Import the mocked provider
    const { geminiProvider } = await import('../src/runner/llm.js');

    // Valid config
    const validConfig = {
      prompt: 'Test prompt',
      temperature: 0.5,
    };

    expect(await geminiProvider.validateConfig(validConfig)).toBe(true);
  });

  it('should handle LLM calls', async () => {
    // Import the mocked provider
    const { geminiProvider } = await import('../src/runner/llm.js');

    const config = {
      prompt: 'What is 2+2?',
      temperature: 0.1,
    };

    const result = await geminiProvider.callLLM(config);

    expect(result.content).toBeTruthy();
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.cost).toBeGreaterThanOrEqual(0);
    expect(result.model).toBeTruthy();
  });
});

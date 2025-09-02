import { z } from 'zod';
import { StepRegistry } from '../runner/registry';
import type { LlmClient } from '../runner/llm';

export const TicketInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.object({ name: z.string(), type: z.string() })).optional(),
});

export const ClassificationSchema = z.object({
  category: z.enum(['billing', 'bug', 'howto', 'feature']),
  confidence: z.number().min(0).max(1),
  urgency: z.number().int().min(1).max(5).default(3),
});

export const SummarySchema = z.object({ bullets: z.array(z.string()).length(3), tldr: z.string() });

export const NextActionSchema = z.object({ nextAction: z.string() });
export const DraftSchema = z.object({ replyDraft: z.string() });

export function createTicketRegistry(): StepRegistry {
  const registry = new StepRegistry();

  registry.register({
    kind: 'llm',
    name: 'classifyTicket',
    inputSchema: TicketInputSchema,
    outputSchema: ClassificationSchema,
    prompt: (input) => {
      const i = input as z.infer<typeof TicketInputSchema>;
      return `Classify support ticket into billing|bug|howto|feature. title=${i.title} description=${i.description} tags=${i.tags.join(',')}`;
    },
  });

  registry.register({
    kind: 'llm',
    name: 'summarizeTicket',
    inputSchema: TicketInputSchema,
    outputSchema: SummarySchema,
    prompt: (input) => {
      const i = input as z.infer<typeof TicketInputSchema>;
      return `Summarize in 3 bullets and 1 TL;DR: title=${i.title} description=${i.description}`;
    },
  });

  registry.register({
    kind: 'tool',
    name: 'nextAction',
    inputSchema: ClassificationSchema,
    outputSchema: NextActionSchema,
    async run(input) {
      const cat = (input as { category: 'billing' | 'bug' | 'howto' | 'feature'; urgency: number })
        .category;
      const map: Record<string, string> = {
        billing: 'Send billing troubleshooting guide and check invoice status.',
        bug: 'Acknowledge bug; collect repro steps; escalate to engineering.',
        howto: 'Link to relevant docs; provide quick instructions.',
        feature: 'Thank and link to roadmap; create feature request ticket.',
      };
      return { nextAction: map[cat] ?? 'Escalate to human agent.' };
    },
  });

  registry.register({
    kind: 'tool',
    name: 'saveDraft',
    inputSchema: z.object({ tldr: z.string(), category: z.string(), nextAction: z.string() }),
    outputSchema: DraftSchema,
    async run(input) {
      const i = input as { tldr: string; category: string; nextAction: string };
      const draft = `Hi, Regarding your ${i.category} request: ${i.tldr} Next: ${i.nextAction}`;
      return { replyDraft: draft };
    },
  });

  return registry;
}

export function makeTicketLlm(): LlmClient {
  return {
    async complete(prompt: string) {
      // deterministic mock classification and summary
      let category: 'billing' | 'bug' | 'howto' | 'feature' = 'howto';
      if (/invoice|charge|billing|payment/i.test(prompt)) category = 'billing';
      else if (/error|exception|stack|crash|fail/i.test(prompt)) category = 'bug';
      else if (/feature|request|roadmap/i.test(prompt)) category = 'feature';
      const confidence = category === 'howto' ? 0.6 : 0.9;
      const urgency = /urgent|immediately|asap|down/i.test(prompt) ? 5 : 3;
      if (prompt.startsWith('Classify')) {
        return {
          text: JSON.stringify({ category, confidence, urgency }),
          tokens: Math.ceil(prompt.length / 4),
          costUsd: 0.001,
        };
      }
      // Summary
      const bullets = [
        'User reports issue/question',
        'Context parsed from description',
        `Category guessed: ${category}`,
      ];
      const tldr = `Likely ${category}; provide appropriate guidance.`;
      return {
        text: JSON.stringify({ bullets, tldr }),
        tokens: Math.ceil(prompt.length / 4),
        costUsd: 0.001,
      };
    },
  };
}

export const TicketOutputSchema = z.object({
  summary: z.string(),
  category: z.enum(['billing', 'bug', 'howto', 'feature']),
  urgency: z.number().int().min(1).max(5),
  nextAction: z.string(),
  replyDraft: z.string(),
});

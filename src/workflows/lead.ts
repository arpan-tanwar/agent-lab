import { z } from 'zod';
import { StepRegistry } from '../runner/registry';
import type { LlmClient } from '../runner/llm';

// Schemas
export const LeadInputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  from: z.string(),
});

export const ParseEmailOutputSchema = z.object({
  company: z.string(),
  domain: z.string().optional().default(''),
  intent: z.string(),
  contacts: z
    .array(z.object({ name: z.string().optional(), email: z.string().email().optional() }))
    .default([]),
});

export const EnrichmentSchema = z.object({
  size: z.enum(['smb', 'mid', 'enterprise']),
  industry: z.string(),
  tech: z.array(z.string()),
});

export const ScoreOutputSchema = z.object({ score: z.number().min(0).max(100) });

export const CrmOutputSchema = z.object({ crmId: z.string() });
export const SlackOutputSchema = z.object({ slackMessageId: z.string() });

export function createLeadRegistry(llmName = 'parseEmail'): StepRegistry {
  const registry = new StepRegistry();

  // LLM: parseEmail
  registry.register({
    kind: 'llm',
    name: llmName,
    inputSchema: LeadInputSchema,
    outputSchema: ParseEmailOutputSchema,
    prompt: (input) => {
      const v = input as z.infer<typeof LeadInputSchema>;
      return `Extract JSON with keys company, domain, intent, contacts[] from: subj=${v.subject} body=${v.body} from=${v.from}`;
    },
  });

  // Tool: enrichCompany (mock)
  registry.register({
    kind: 'tool',
    name: 'enrichCompany',
    inputSchema: ParseEmailOutputSchema,
    outputSchema: z.object({ enrichment: EnrichmentSchema }),
    async run(parsed) {
      const p = parsed as z.infer<typeof ParseEmailOutputSchema>;
      const domain = (p.domain || p.company).toLowerCase();
      const size =
        domain.includes('inc') || domain.includes('corp')
          ? 'enterprise'
          : domain.length % 2
            ? 'mid'
            : 'smb';
      const industry = /university|edu|student/i.test(domain) ? 'education' : 'software';
      const tech = industry === 'software' ? ['node', 'react'] : ['python'];
      return { enrichment: { size, industry, tech } };
    },
  });

  // Tool: scoreLead (pure)
  registry.register({
    kind: 'tool',
    name: 'scoreLead',
    inputSchema: z.object({ intent: z.string(), enrichment: EnrichmentSchema }),
    outputSchema: ScoreOutputSchema,
    async run(input) {
      const i = input as { intent: string; enrichment: z.infer<typeof EnrichmentSchema> };
      const intent = i.intent;
      const enrichment = i.enrichment;
      let score = 30;
      if (/buy|pricing|quote|trial/i.test(intent)) score += 40;
      if (enrichment.size === 'enterprise') score += 20;
      if (enrichment.size === 'mid') score += 10;
      return { score: Math.min(100, score) };
    },
  });

  // Tool: createCRMRecord (mock)
  registry.register({
    kind: 'tool',
    name: 'createCRMRecord',
    inputSchema: z.object({
      company: z.string(),
      domain: z.string().optional(),
      intent: z.string(),
      score: z.number(),
    }),
    outputSchema: CrmOutputSchema,
    async run(input) {
      const i = input as { company: string; score: number };
      const id = `crm_${Math.abs(i.company.length + i.score)}`;
      return { crmId: id };
    },
  });

  // Tool: notifySlack (mock)
  registry.register({
    kind: 'tool',
    name: 'notifySlack',
    inputSchema: z.object({ company: z.string(), score: z.number() }),
    outputSchema: SlackOutputSchema,
    async run(input) {
      const i = input as { company: string; score: number };
      return { slackMessageId: `m_${i.company.slice(0, 5)}_${i.score}` };
    },
  });

  return registry;
}

// Deterministic mock LLM for parseEmail
export function makeParseEmailLlm(): LlmClient {
  return {
    async complete(prompt: string) {
      // naive deterministic parse from prompt
      const subj = /subj=(.*?) body=/.exec(prompt)?.[1] ?? '';
      const from = /from=(.*)$/.exec(prompt)?.[1] ?? '';
      const company = (subj.split(' ')[0] || from.split('@')[1]?.split('.')[0] || 'Acme').replace(
        /[^a-zA-Z0-9]/g,
        '',
      );
      const domain = from.includes('@') ? from.split('@')[1] : `${company.toLowerCase()}.com`;
      const intent = /pricing|quote|buy|trial/i.test(prompt) ? 'pricing' : 'info';
      const contacts = from.includes('@') ? [{ email: from }] : [];
      const obj = { company, domain, intent, contacts };
      const text = JSON.stringify(obj);
      return { text, tokens: Math.ceil(prompt.length / 4), costUsd: 0.001 };
    },
  };
}

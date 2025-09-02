import { z } from 'zod';
import { StepRegistry } from './registry';

export function createDefaultRegistry() {
  const registry = new StepRegistry();

  registry.register({
    kind: 'tool',
    name: 'echo',
    inputSchema: z.object({ message: z.string() }),
    outputSchema: z.object({ echoed: z.string() }),
    async run(input) {
      return { echoed: (input as { message: string }).message };
    },
  });

  registry.register({
    kind: 'branch',
    name: 'byFlag',
    inputSchema: z.object({ flag: z.boolean() }),
    chooseNext(input) {
      return (input as { flag: boolean }).flag ? 'A' : 'B';
    },
  });

  return registry;
}

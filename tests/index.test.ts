import { describe, it, expect } from 'vitest';
import { hello } from '../src/index';

describe('hello', () => {
  it('returns readiness message', () => {
    expect(hello()).toBe('agent-lab ready');
  });
});

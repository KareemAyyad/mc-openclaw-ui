import { describe, it, expect } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test-ip-1', { limit: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests over limit', () => {
    const key = 'test-ip-block-' + Date.now();
    const config = { limit: 3, windowMs: 60000 };

    checkRateLimit(key, config); // 1
    checkRateLimit(key, config); // 2
    checkRateLimit(key, config); // 3

    const result = checkRateLimit(key, config); // 4 - should be blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks remaining correctly', () => {
    const key = 'test-ip-remain-' + Date.now();
    const config = { limit: 5, windowMs: 60000 };

    const r1 = checkRateLimit(key, config);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(key, config);
    expect(r2.remaining).toBe(3);

    const r3 = checkRateLimit(key, config);
    expect(r3.remaining).toBe(2);
  });

  it('uses different keys independently', () => {
    const config = { limit: 2, windowMs: 60000 };
    const keyA = 'test-ip-a-' + Date.now();
    const keyB = 'test-ip-b-' + Date.now();

    checkRateLimit(keyA, config); // A: 1
    checkRateLimit(keyA, config); // A: 2

    const resultA = checkRateLimit(keyA, config); // A: 3 - blocked
    expect(resultA.allowed).toBe(false);

    const resultB = checkRateLimit(keyB, config); // B: 1 - allowed
    expect(resultB.allowed).toBe(true);
  });

  it('provides correct limit value in result', () => {
    const key = 'test-ip-limit-' + Date.now();
    const result = checkRateLimit(key, { limit: 100, windowMs: 60000 });
    expect(result.limit).toBe(100);
  });
});

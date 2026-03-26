import { describe, it, expect, beforeEach } from 'vitest';
import { invalidateReviewStatsCache } from '../useReviewStats';

// The module-level cache variables are internal, but we can verify
// that invalidateReviewStatsCache doesn't throw and can be called repeatedly.

describe('invalidateReviewStatsCache', () => {
  beforeEach(() => {
    // Call it to reset state before each test
    invalidateReviewStatsCache();
  });

  it('does not throw when called', () => {
    expect(() => invalidateReviewStatsCache()).not.toThrow();
  });

  it('can be called multiple times without error', () => {
    invalidateReviewStatsCache();
    invalidateReviewStatsCache();
    invalidateReviewStatsCache();
    // No error means success
    expect(true).toBe(true);
  });

  it('is a function export', () => {
    expect(typeof invalidateReviewStatsCache).toBe('function');
  });
});

import { describe, it, expect } from 'vitest';
import { formatTHB } from '../formatPrice';

describe('formatTHB', () => {
  it('formats a standard price with decimals', () => {
    expect(formatTHB(1234)).toBe('฿1,234.00 THB');
  });

  it('formats zero', () => {
    expect(formatTHB(0)).toBe('฿0.00 THB');
  });

  it('formats negative numbers', () => {
    expect(formatTHB(-500)).toBe('฿-500.00 THB');
  });

  it('formats large numbers with comma separators', () => {
    expect(formatTHB(1000000)).toBe('฿1,000,000.00 THB');
  });

  it('formats small decimal amounts', () => {
    expect(formatTHB(0.99)).toBe('฿0.99 THB');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatTHB(19.999)).toBe('฿20.00 THB');
  });

  it('hides decimals when showDecimals is false', () => {
    expect(formatTHB(1234, false)).toBe('฿1,234 THB');
  });

  it('returns fallback for NaN', () => {
    expect(formatTHB(NaN)).toBe('฿0.00 THB');
  });

  it('returns fallback for Infinity', () => {
    expect(formatTHB(Infinity)).toBe('฿0.00 THB');
  });

  it('returns fallback for -Infinity', () => {
    expect(formatTHB(-Infinity)).toBe('฿0.00 THB');
  });
});

import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (class name merger)', () => {
  it('merges simple class strings', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('filters out falsy values', () => {
    expect(cn('base', false, null, undefined, 0, '', 'end')).toBe('base end');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    // twMerge resolves conflicts: last one wins
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('deduplicates conflicting padding classes', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('keeps non-conflicting classes', () => {
    expect(cn('px-4', 'py-8')).toBe('px-4 py-8');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles array of classes via clsx', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('handles object syntax via clsx', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });
});

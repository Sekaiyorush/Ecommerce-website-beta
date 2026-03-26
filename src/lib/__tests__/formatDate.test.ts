import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeDate, formatDateTime, formatShortDate } from '../formatDate';

describe('formatDate', () => {
  it('formats an ISO date string with default format', () => {
    expect(formatDate('2025-06-15T10:30:00Z')).toBe('Jun 15, 2025');
  });

  it('formats a Date object', () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe('Jan 1, 2024');
  });

  it('formats with custom format string', () => {
    expect(formatDate('2025-12-25T00:00:00Z', 'yyyy/MM/dd')).toBe('2025/12/25');
  });

  it('returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('returns N/A for empty string', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('returns N/A for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('N/A');
  });
});

describe('formatRelativeDate', () => {
  it('returns N/A for null', () => {
    expect(formatRelativeDate(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatRelativeDate(undefined)).toBe('N/A');
  });

  it('returns a relative string for a recent date', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatRelativeDate(fiveMinutesAgo);
    expect(result).toContain('ago');
  });

  it('returns N/A for invalid date', () => {
    expect(formatRelativeDate('garbage')).toBe('N/A');
  });
});

describe('formatDateTime', () => {
  it('formats date with time', () => {
    // Use a date that won't be affected by timezone offset
    const result = formatDateTime('2025-03-15T14:30:00');
    expect(result).toContain('2025');
    expect(result).toContain('at');
  });

  it('returns N/A for null', () => {
    expect(formatDateTime(null)).toBe('N/A');
  });
});

describe('formatShortDate', () => {
  it('formats to short date', () => {
    expect(formatShortDate('2025-07-04T00:00:00')).toBe('Jul 4');
  });

  it('returns N/A for null', () => {
    expect(formatShortDate(null)).toBe('N/A');
  });
});

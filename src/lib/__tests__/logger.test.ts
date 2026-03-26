import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset module registry so each test gets a fresh import
    vi.resetModules();
  });

  it('calls console.error in dev mode', async () => {
    vi.stubEnv('DEV', true);
    // import.meta.env.DEV is already true in vitest by default
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('../logger');
    logger.error('test error');
    expect(spy).toHaveBeenCalledWith('test error');
  });

  it('calls console.warn in dev mode', async () => {
    vi.stubEnv('DEV', true);
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logger } = await import('../logger');
    logger.warn('test warning');
    expect(spy).toHaveBeenCalledWith('test warning');
  });

  it('passes multiple arguments through', async () => {
    vi.stubEnv('DEV', true);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('../logger');
    logger.error('msg', 42, { key: 'val' });
    expect(spy).toHaveBeenCalledWith('msg', 42, { key: 'val' });
  });
});

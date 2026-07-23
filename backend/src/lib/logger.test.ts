import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { logError } from './logger.js';

// test/setup.ts points LOG_DIR at a throwaway temp directory for the whole
// test run, so these tests never touch the real backend/logs folder.
const logDir = process.env.LOG_DIR!;

function readTodayLog(): string {
  const today = new Date().toISOString().slice(0, 10);
  return fs.readFileSync(path.join(logDir, `${today}.log`), 'utf-8');
}

beforeEach(() => {
  fs.rmSync(logDir, { recursive: true, force: true });
});

describe('logError', () => {
  it('creates the log directory and writes a line for the error', () => {
    logError({
      method: 'GET',
      path: '/api/products/does-not-exist',
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product not found.',
    });

    const contents = readTodayLog();
    expect(contents).toContain('GET');
    expect(contents).toContain('/api/products/does-not-exist');
    expect(contents).toContain('404');
    expect(contents).toContain('PRODUCT_NOT_FOUND');
    expect(contents).toContain('Product not found.');
  });

  it('includes the stack trace when one is provided', () => {
    logError({
      method: 'POST',
      path: '/api/products',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'boom',
      stack: 'Error: boom\n    at somewhere.ts:1:1',
    });

    expect(readTodayLog()).toContain('at somewhere.ts:1:1');
  });

  it('omits a stack section when none is provided', () => {
    logError({
      method: 'GET',
      path: '/api/products',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input.',
    });

    const lines = readTodayLog().trim().split('\n');
    expect(lines).toHaveLength(1);
  });

  it('appends multiple entries to the same daily file', () => {
    logError({ method: 'GET', path: '/a', statusCode: 400, code: 'X', message: 'one' });
    logError({ method: 'GET', path: '/b', statusCode: 400, code: 'Y', message: 'two' });

    const entries = readTodayLog()
      .trim()
      .split('\n')
      .filter((line) => line.includes(' | '));
    expect(entries).toHaveLength(2);
  });

  it('never throws, even if the filesystem write fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() =>
      logError({ method: 'GET', path: '/a', statusCode: 500, code: 'X', message: 'boom' })
    ).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to write error log:', expect.any(Error));

    mkdirSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

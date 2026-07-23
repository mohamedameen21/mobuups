import fs from 'node:fs';
import path from 'node:path';

// Overridable so tests can point this at a throwaway directory instead of
// writing into the real backend/logs folder on every error-path test.
const LOG_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), 'logs');

interface ErrorLogEntry {
  method: string;
  path: string;
  statusCode: number;
  code: string;
  message: string;
  stack?: string;
}

function todayFileName(): string {
  return `${new Date().toISOString().slice(0, 10)}.log`;
}

// One line per error, appended to a file named after the current UTC date
// (e.g. logs/2026-07-23.log) - a new file starts automatically each day.
//
// This must never be able to take the request down with it: it runs inside
// the global error handler, on the hot path of every single error response
// (including a brand new visitor's very first, cookie-less /auth/refresh).
// A filesystem hiccup here (permissions, disk, a synced/watched folder,
// anything) must degrade to "no log line" rather than an uncaught throw
// that kills the response - or the whole process - mid-request.
export function logError(entry: ErrorLogEntry): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });

    const line = [
      new Date().toISOString(),
      entry.method,
      entry.path,
      entry.statusCode,
      entry.code,
      entry.message,
    ].join(' | ');

    const body = entry.stack ? `${line}\n${entry.stack}\n` : `${line}\n`;
    fs.appendFileSync(path.join(LOG_DIR, todayFileName()), body);
  } catch (err) {
    console.error('Failed to write error log:', err);
  }
}

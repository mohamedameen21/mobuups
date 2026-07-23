import os from 'node:os';
import path from 'node:path';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
// Keep error-path tests from writing into the real backend/logs folder.
process.env.LOG_DIR = path.join(os.tmpdir(), 'mobupps-test-logs');

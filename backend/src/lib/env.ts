// Fail fast at boot if the server is misconfigured, instead of throwing deep
// inside a request handler (e.g. jwt.sign blowing up on the first login because
// JWT_ACCESS_SECRET was never set). Called from server.ts before listen().

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_ACCESS_EXPIRES'] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Copy backend/.env.example to backend/.env and fill them in.`
    );
  }

  if (!process.env.CORS_ORIGIN) {
    console.warn(
      '[env] CORS_ORIGIN is not set - browser clients sending credentials may be blocked by CORS.'
    );
  }
}

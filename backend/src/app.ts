import express from 'express';

export const app = express();

app.use(express.json());

// Placeholder root route - proves the TS/ESM Express app boots.
// Auth and product routes get mounted here once we build them together.
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Product Store API (TypeScript)' });
});

import 'dotenv/config';
import { validateEnv } from './lib/env.js';
import { app } from './app.js';

validateEnv();

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

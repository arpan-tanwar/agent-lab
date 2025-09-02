import { serve } from '@hono/node-server';
import app from './server';

const port = Number(process.env.PORT || 8787);
serve({ fetch: app.fetch, port });
console.log(`[api] listening on http://localhost:${port}`);

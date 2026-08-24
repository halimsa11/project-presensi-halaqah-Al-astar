import { serve } from '@hono/node-server';
import app from './api/app.js';

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});

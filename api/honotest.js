import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

app.get('/honotest', (c) => c.json({ status: 'hono_ok' }));

export default handle(app);

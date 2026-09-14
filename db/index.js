import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

// Pada Vercel, env vars diambil dari dashboard (bukan file .env)
// Pada lokal, pakai dotenv jika tersedia
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (_) {
  // dotenv tidak tersedia — tidak apa-apa, env vars dari sistem
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('CRITICAL: DATABASE_URL is not set! Set it in Vercel Dashboard > Settings > Environment Variables.');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });


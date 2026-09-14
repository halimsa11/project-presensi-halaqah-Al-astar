import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL is not set in environment variables!');
}

const sql = neon(connectionString || 'postgresql://placeholder:placeholder@localhost:5432/placeholder');
export const db = drizzle(sql, { schema });


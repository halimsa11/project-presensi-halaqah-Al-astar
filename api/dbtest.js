import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  // Show partial URL for debugging (hide password)
  const safeUrl = dbUrl.replace(/:([^@]+)@/, ':***@');

  try {
    const sql = neon(dbUrl);
    const result = await sql`SELECT 1 as test`;
    return res.status(200).json({ 
      status: 'db_ok', 
      connection: safeUrl,
      result 
    });
  } catch (err) {
    return res.status(500).json({ 
      status: 'db_error', 
      connection: safeUrl,
      error: err.message 
    });
  }
}

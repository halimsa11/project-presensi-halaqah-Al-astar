import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Adding NIS column to students table...');
  
  try {
    // Add column if not exists
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS nis VARCHAR(20)`;
    console.log('✓ Column "nis" added');
  } catch (err) {
    console.log('Column may already exist:', err.message);
  }

  try {
    // Add unique constraint
    await sql`ALTER TABLE students ADD CONSTRAINT students_nis_unique UNIQUE (nis)`;
    console.log('✓ Unique constraint on "nis" added');
  } catch (err) {
    console.log('Constraint may already exist:', err.message);
  }

  console.log('\nDone! NIS column is ready.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

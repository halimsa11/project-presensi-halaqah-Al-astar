import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { students } from './db/schema.js';
import { eq, or } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const regulerNames = [
  'Ibroh Al-Hadid',
  'Alfaruq Julian Felixyano',
  'Bifa Rajendra Abdul Jabbar Sadid',
  "Matas'ad Akram Ilyas",
  'Muhammad Fadhil Aqilah Al-Ghazali Irawan',
  'Saamy Husni Baradja'
];

async function migrate() {
  console.log('Fetching all students...');
  const allStudents = await db.select().from(students);
  console.log(`Found ${allStudents.length} students total.`);

  let updated = 0;
  for (const s of allStudents) {
    // Check if name matches (case-insensitive partial match)
    const isReguler = regulerNames.some(rn => 
      s.name.toLowerCase().includes(rn.toLowerCase()) || 
      rn.toLowerCase().includes(s.name.toLowerCase())
    );
    if (isReguler) {
      console.log(`  Updating "${s.name}" to reguler...`);
      await db.update(students).set({ type: 'reguler' }).where(eq(students.id, s.id));
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated} students to "reguler".`);
  console.log('All other students remain as "boarding".');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

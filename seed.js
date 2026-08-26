import { db } from './db/index.js';
import { students, users } from './db/schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding data...');
  
  // Insert Admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    username: 'admin',
    passwordHash,
  }).onConflictDoNothing(); // Prevent error if run multiple times

  // Insert Musyrif
  const musyrifHash = await bcrypt.hash('musyrif123', 10);
  await db.insert(users).values({
    username: 'musyrif',
    passwordHash: musyrifHash,
  }).onConflictDoNothing();

  
  // Insert Students
  const initialStudents = [
    { id: '1001', name: 'Ahmad', class: 10 },
    { id: '1002', name: 'Budi', class: 10 },
    { id: '1101', name: 'Citra', class: 11 },
    { id: '1201', name: 'Deni', class: 12 },
  ];
  
  for (const s of initialStudents) {
    await db.insert(students).values(s).onConflictDoNothing();
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

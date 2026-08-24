import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db/index.js';
import { students, attendances, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = new Hono().basePath('/api');

app.use('*', cors());

// Middleware for authentication
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

app.get('/', (c) => c.json({ message: 'API is running' }));

// Auth: Login
app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  const userList = await db.select().from(users).where(eq(users.username, username));
  
  if (userList.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const user = userList[0];
  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'supersecret', {
    expiresIn: '1d',
  });
  
  return c.json({ token, username: user.username });
});

// Students: Get all
app.get('/students', async (c) => {
  const allStudents = await db.select().from(students);
  return c.json(allStudents);
});

// Attendance: Get by date and session
app.get('/attendance', async (c) => {
  const date = c.req.query('date');
  const session = c.req.query('session');
  
  if (!date || !session) {
    return c.json({ error: 'Date and session are required' }, 400);
  }
  
  const records = await db.select().from(attendances).where(
    and(
      eq(attendances.date, date),
      eq(attendances.session, session)
    )
  );
  
  return c.json(records);
});

// Attendance: Save or update
app.post('/attendance', authMiddleware, async (c) => {
  const { date, session, records } = await c.req.json();
  // records: [{ studentId, status }, ...]
  
  if (!date || !session || !Array.isArray(records)) {
    return c.json({ error: 'Invalid payload' }, 400);
  }
  
  // We can just iterate and insert/update
  // For simplicity, we can delete existing records for this date/session and re-insert,
  // or use conflict resolution (upsert)
  
  // Easiest is delete and insert
  await db.delete(attendances).where(
    and(
      eq(attendances.date, date),
      eq(attendances.session, session)
    )
  );
  
  const dataToInsert = records.map(r => ({
    studentId: r.studentId,
    date,
    session,
    status: r.status,
  }));
  
  if (dataToInsert.length > 0) {
    await db.insert(attendances).values(dataToInsert);
  }
  
  return c.json({ message: 'Attendance saved successfully' });
});

export default app;

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db/index.js';
import { students, attendances, holidays } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

const app = new Hono().basePath('/api');

app.use('*', cors());

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

app.get('/', (c) => c.json({ message: 'API is running' }));

// ============ HOLIDAYS ============

app.get('/holidays', async (c) => {
  const date = c.req.query('date');
  if (date) {
    const list = await db.select().from(holidays).where(eq(holidays.date, date));
    return c.json(list);
  }
  const allHolidays = await db.select().from(holidays);
  return c.json(allHolidays);
});

app.post('/holidays', async (c) => {
  const { date, reason } = await c.req.json();
  if (!date) return c.json({ error: 'Date is required' }, 400);
  try {
    await db.insert(holidays).values({ date, reason: reason || 'Libur Halaqah' }).onConflictDoNothing();
    return c.json({ message: 'Hari libur berhasil ditambahkan' }, 201);
  } catch (err) {
    return c.json({ error: 'Gagal menambahkan hari libur' }, 500);
  }
});

app.delete('/holidays/:date', async (c) => {
  const date = c.req.param('date');
  try {
    await db.delete(holidays).where(eq(holidays.date, date));
    return c.json({ message: 'Hari libur dihapus' });
  } catch (err) {
    return c.json({ error: 'Gagal menghapus hari libur' }, 500);
  }
});

// ============ STUDENTS ============

app.get('/students', async (c) => {
  const allStudents = await db.select().from(students);
  return c.json(allStudents);
});

// Auto-generate ID — user only provides name + class
app.post('/students', async (c) => {
  const { name, class: studentClass } = await c.req.json();
  if (!name || !studentClass) {
    return c.json({ error: 'Nama dan kelas harus diisi' }, 400);
  }
  // Generate unique ID from timestamp + random suffix
  const autoId = `S${Date.now().toString(36).toUpperCase()}`;
  try {
    await db.insert(students).values({
      id: autoId,
      name: name.trim(),
      class: parseInt(studentClass)
    });
    return c.json({ message: 'Santri berhasil ditambahkan', id: autoId }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Gagal menambahkan santri' }, 500);
  }
});

app.put('/students/:id', async (c) => {
  const id = c.req.param('id');
  const { name, class: studentClass } = await c.req.json();
  if (!name || !studentClass) {
    return c.json({ error: 'Nama dan kelas harus diisi' }, 400);
  }
  try {
    await db.update(students)
      .set({ name: name.trim(), class: parseInt(studentClass) })
      .where(eq(students.id, id));
    return c.json({ message: 'Santri berhasil diperbarui' });
  } catch (error) {
    return c.json({ error: 'Gagal memperbarui santri' }, 500);
  }
});

app.delete('/students/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(attendances).where(eq(attendances.studentId, id));
    await db.delete(students).where(eq(students.id, id));
    return c.json({ message: 'Santri berhasil dihapus' });
  } catch (error) {
    return c.json({ error: 'Gagal menghapus santri' }, 500);
  }
});

// ============ ATTENDANCE ============

app.get('/attendance', async (c) => {
  const date = c.req.query('date');
  const session = c.req.query('session');
  if (!date || !session) {
    return c.json({ error: 'Date and session are required' }, 400);
  }
  const records = await db.select().from(attendances).where(
    and(eq(attendances.date, date), eq(attendances.session, session))
  );
  return c.json(records);
});

// Summary by month — uses gte/lte instead of LIKE (works with date columns)
app.get('/attendance/summary', async (c) => {
  const month = c.req.query('month'); // YYYY-MM
  if (!month) {
    return c.json({ error: 'Month (YYYY-MM) is required' }, 400);
  }
  const startDate = `${month}-01`;
  const endDate   = `${month}-31`; // safe upper bound for any month
  try {
    const records = await db.select().from(attendances).where(
      and(
        gte(attendances.date, startDate),
        lte(attendances.date, endDate)
      )
    );
    return c.json(records);
  } catch (err) {
    console.error('Summary error:', err);
    return c.json({ error: 'Gagal mengambil data rangkuman' }, 500);
  }
});

app.post('/attendance', async (c) => {
  const { date, session, records } = await c.req.json();
  if (!date || !session || !Array.isArray(records)) {
    return c.json({ error: 'Invalid payload' }, 400);
  }
  await db.delete(attendances).where(
    and(eq(attendances.date, date), eq(attendances.session, session))
  );
  if (records.length > 0) {
    await db.insert(attendances).values(
      records.map(r => ({ studentId: r.studentId, date, session, status: r.status }))
    );
  }
  return c.json({ message: 'Presensi berhasil disimpan' });
});

export default app;

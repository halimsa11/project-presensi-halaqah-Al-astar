import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db/index.js';
import { students, attendances, holidays } from '../db/schema.js';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';

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
  const { date, reason, type, session } = await c.req.json();
  if (!date) return c.json({ error: 'Date is required' }, 400);

  const holidayType = type || 'day';

  if (holidayType === 'session' && !session) {
    return c.json({ error: 'Session is required for session holiday' }, 400);
  }

  try {
    // Check if duplicate exists
    if (holidayType === 'day') {
      const existing = await db.select().from(holidays).where(
        and(eq(holidays.date, date), eq(holidays.type, 'day'))
      );
      if (existing.length > 0) {
        return c.json({ message: 'Hari libur sudah ada' }, 200);
      }
    } else {
      const existing = await db.select().from(holidays).where(
        and(eq(holidays.date, date), eq(holidays.type, 'session'), eq(holidays.session, session))
      );
      if (existing.length > 0) {
        return c.json({ message: 'Libur sesi sudah ada' }, 200);
      }
    }

    await db.insert(holidays).values({
      date,
      type: holidayType,
      session: holidayType === 'session' ? session : null,
      reason: reason || (holidayType === 'day' ? 'Libur Halaqah' : `Libur Sesi ${session}`)
    });
    return c.json({ message: 'Hari libur berhasil ditambahkan' }, 201);
  } catch (err) {
    console.error('Holiday insert error:', err);
    return c.json({ error: 'Gagal menambahkan hari libur' }, 500);
  }
});

app.delete('/holidays/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(holidays).where(eq(holidays.id, parseInt(id)));
    return c.json({ message: 'Hari libur dihapus' });
  } catch (err) {
    return c.json({ error: 'Gagal menghapus hari libur' }, 500);
  }
});

// ============ STUDENTS ============

app.get('/students', async (c) => {
  const session = c.req.query('session');
  let allStudents = await db.select().from(students);

  // Filter by session eligibility
  if (session === 'pagi' || session === 'malam') {
    allStudents = allStudents.filter(s => s.type === 'boarding');
  }
  // siang = semua (boarding + reguler)

  return c.json(allStudents);
});

// Auto-generate ID — user only provides name + class + type + nis
app.post('/students', async (c) => {
  const { name, class: studentClass, type, nis } = await c.req.json();
  if (!name || !studentClass) {
    return c.json({ error: 'Nama dan kelas harus diisi' }, 400);
  }
  // Generate unique ID from timestamp + random suffix
  const autoId = `S${Date.now().toString(36).toUpperCase()}`;
  try {
    await db.insert(students).values({
      id: autoId,
      nis: nis ? nis.trim() : null,
      name: name.trim(),
      class: parseInt(studentClass),
      type: type || 'boarding'
    });
    return c.json({ message: 'Santri berhasil ditambahkan', id: autoId }, 201);
  } catch (error) {
    console.error(error);
    if (error.message?.includes('students_nis_unique')) {
      return c.json({ error: 'NIS sudah digunakan santri lain' }, 400);
    }
    return c.json({ error: 'Gagal menambahkan santri' }, 500);
  }
});

app.put('/students/:id', async (c) => {
  const id = c.req.param('id');
  const { name, class: studentClass, type, nis } = await c.req.json();
  if (!name || !studentClass) {
    return c.json({ error: 'Nama dan kelas harus diisi' }, 400);
  }
  try {
    const updateData = { name: name.trim(), class: parseInt(studentClass) };
    if (type) updateData.type = type;
    if (nis !== undefined) updateData.nis = nis ? nis.trim() : null;
    await db.update(students)
      .set(updateData)
      .where(eq(students.id, id));
    return c.json({ message: 'Santri berhasil diperbarui' });
  } catch (error) {
    if (error.message?.includes('students_nis_unique')) {
      return c.json({ error: 'NIS sudah digunakan santri lain' }, 400);
    }
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
  // Ambil hari terakhir bulan yang valid (bukan hardcode -31)
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate(); // day=0 dari bulan berikutnya = hari terakhir bulan ini
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
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

// ============ WALI SISWA (PUBLIC) ============

app.get('/wali/lookup', async (c) => {
  const nis = c.req.query('nis');
  const month = c.req.query('month'); // YYYY-MM, optional
  
  if (!nis) {
    return c.json({ error: 'NIS harus diisi' }, 400);
  }
  
  try {
    const studentList = await db.select().from(students).where(eq(students.nis, nis.trim()));
    if (studentList.length === 0) {
      return c.json({ error: 'Santri dengan NIS tersebut tidak ditemukan' }, 404);
    }
    
    const student = studentList[0];
    
    // Determine month range
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const [y, m] = targetMonth.split('-').map(Number);
    const startDate = `${targetMonth}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;
    
    // Get attendance records for the month
    const attRecords = await db.select().from(attendances).where(
      and(
        eq(attendances.studentId, student.id),
        gte(attendances.date, startDate),
        lte(attendances.date, endDate)
      )
    );
    
    // Get holidays for the month
    const holidayRecords = await db.select().from(holidays).where(
      and(
        gte(holidays.date, startDate),
        lte(holidays.date, endDate)
      )
    );
    
    // Calculate summary
    const summary = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    attRecords.forEach(a => {
      if (summary[a.status] !== undefined) summary[a.status]++;
    });
    
    return c.json({
      student: {
        name: student.name,
        nis: student.nis,
        class: student.class,
        type: student.type
      },
      month: targetMonth,
      attendance: attRecords.map(a => ({
        date: a.date,
        session: a.session,
        status: a.status
      })),
      holidays: holidayRecords.map(h => ({
        date: h.date,
        type: h.type,
        session: h.session,
        reason: h.reason
      })),
      summary
    });
  } catch (err) {
    console.error('Wali lookup error:', err);
    return c.json({ error: 'Gagal mengambil data santri' }, 500);
  }
});

export default app;

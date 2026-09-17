import { pgTable, serial, varchar, date, pgEnum, integer } from 'drizzle-orm/pg-core';

export const sessionEnum = pgEnum('session', ['pagi', 'siang', 'malam']);
export const statusEnum = pgEnum('status', ['hadir', 'alpa', 'izin', 'sakit']);
export const studentTypeEnum = pgEnum('student_type', ['boarding', 'reguler']);
export const holidayTypeEnum = pgEnum('holiday_type', ['day', 'session']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
});

export const students = pgTable('students', {
  id: varchar('id', { length: 50 }).primaryKey(),
  nis: varchar('nis', { length: 20 }).unique(),
  name: varchar('name', { length: 100 }).notNull(),
  class: integer('class').notNull(), // 10, 11, 12
  type: studentTypeEnum('type').notNull().default('boarding'),
});

export const attendances = pgTable('attendances', {
  id: serial('id').primaryKey(),
  studentId: varchar('student_id', { length: 50 }).references(() => students.id).notNull(),
  date: date('date').notNull(), // format YYYY-MM-DD
  session: sessionEnum('session').notNull(),
  status: statusEnum('status').notNull(),
});

export const holidays = pgTable('holidays', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  type: holidayTypeEnum('type').notNull().default('day'),
  session: sessionEnum('session'),
  reason: varchar('reason', { length: 255 }),
});

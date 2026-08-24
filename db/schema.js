import { pgTable, serial, varchar, date, pgEnum, integer } from 'drizzle-orm/pg-core';

export const sessionEnum = pgEnum('session', ['pagi', 'siang', 'malam']);
export const statusEnum = pgEnum('status', ['hadir', 'alpa', 'izin']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
});

export const students = pgTable('students', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  class: integer('class').notNull(), // 10, 11, 12
});

export const attendances = pgTable('attendances', {
  id: serial('id').primaryKey(),
  studentId: varchar('student_id', { length: 50 }).references(() => students.id).notNull(),
  date: date('date').notNull(), // format YYYY-MM-DD
  session: sessionEnum('session').notNull(),
  status: statusEnum('status').notNull(),
});

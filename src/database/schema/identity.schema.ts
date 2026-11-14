
import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

import { userStatusEnum, userRoleEnum } from "./enums.js";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", { length: 255 }).unique(),

    passwordHash: text("password_hash"),

    role: userRoleEnum("role")
        .default("STUDENT")
        .notNull(),

    status: userStatusEnum("status")
        .default("PENDING_VERIFICATION")
        .notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }),
});

export const students = pgTable("students", {
    id: uuid("id")
        .primaryKey()
        .references(() => users.id),

    name: varchar("name", { length: 255 }).notNull(),

    nim: varchar("nim", { length: 30 }).unique(),

    whatsapp: varchar("whatsapp", { length: 30 }),
    studyProgram: varchar("study_program", { length: 150 }),
    address: text("address"),
});

export const lecturers = pgTable("lecturers", {
    id: uuid("id")
        .primaryKey()
        .references(() => users.id),

    name: varchar("name", { length: 255 }).notNull(),

    nip: varchar("nip", { length: 30 })
        .notNull()
        .unique(),

    whatsapp: varchar("whatsapp", { length: 30 }),
});

// Inferred types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Lecturer = typeof lecturers.$inferSelect;
export type NewLecturer = typeof lecturers.$inferInsert;

// Update types
export type UpdateUser = Partial<
    Omit<NewUser, "id" | "createdAt">
>;

export type UpdateStudent = Partial<
    Omit<NewStudent, "id">
>;

export type UpdateLecturer = Partial<
    Omit<NewLecturer, "id">
>;

  import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    check,
  } from "drizzle-orm/pg-core";
  import { sql } from "drizzle-orm";

  import { labs } from "./laboratory.schema.js";
  import { lecturers } from "./identity.schema.js";
  import { toolStatusEnum, toolOwnerTypeEnum } from "./enums.js";

  export const toolCategories = pgTable("tool_categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull().unique(),
    description: text("description"),
  });

  export const tools = pgTable(
    "tools",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      ownerType: toolOwnerTypeEnum("owner_type")
        .notNull()
        .default("LAB"),

      // Ownership reference when ownerType = LAB
      labId: uuid("lab_id").references(() => labs.id),

      // Ownership reference when ownerType = LECTURER
      lecturerId: uuid("lecturer_id").references(() => lecturers.id),

      // Laboratory assignment for lecturer-owned equipment
      assignedLabId: uuid("assigned_lab_id").references(() => labs.id),

      categoryId: uuid("category_id").references(() => toolCategories.id),

      name: varchar("name", { length: 255 }).notNull(),

      inventoryCode: varchar("inventory_code", { length: 100 }).unique(),

      status: toolStatusEnum("status").notNull().default("AVAILABLE"),

      description: text("description"),

      createdAt: timestamp("created_at", {
        withTimezone: true,
      }).defaultNow().notNull(),

      updatedAt: timestamp("updated_at", {
        withTimezone: true,
      }),
    },
    (table) => [
      check(
        "tool_owner_check",
        sql`
          (
            ${table.ownerType} = 'LAB'
            AND ${table.labId} IS NOT NULL
            AND ${table.lecturerId} IS NULL
            AND ${table.assignedLabId} IS NULL
          )
          OR
          (
            ${table.ownerType} = 'LECTURER'
            AND ${table.lecturerId} IS NOT NULL
            AND ${table.labId} IS NULL
            AND ${table.assignedLabId} IS NOT NULL
          )
        `,
      ),
    ],
  );

  export type ToolCategory = typeof toolCategories.$inferSelect;
  export type NewToolCategory = typeof toolCategories.$inferInsert;
  export type UpdateToolCategory = Partial<
    Omit<NewToolCategory, "id">
  >;

  export type Tool = typeof tools.$inferSelect;
  export type NewTool = typeof tools.$inferInsert;
  export type UpdateTool = Partial<
    Omit<NewTool, "id" | "createdAt">
  >;
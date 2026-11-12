
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import { labs } from './laboratory.schema.js';
import { lecturers } from './identity.schema.js';
import { researches } from './research.schema.js';
import { materialOwnerTypeEnum } from './enums.js';

export const materials = pgTable(
  'materials',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: varchar('name', { length: 255 }).notNull(),

    description: text('description'),

    ownerType: materialOwnerTypeEnum('owner_type').notNull(),

    labId: uuid('lab_id').references(() => labs.id),

    lecturerId: uuid('lecturer_id').references(() => lecturers.id),

    quantity: numeric('quantity', {
      precision: 15,
      scale: 4,
    }).default('0').notNull(),

    unit: varchar('unit', { length: 50 }).notNull(),

    isMonitored: boolean('is_monitored')
      .default(true)
      .notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    }),
  },
  (table) => [
    check(
      'material_owner_check',
      sql`
        (
          ${table.ownerType} = 'LAB'
          AND ${table.labId} IS NOT NULL
          AND ${table.lecturerId} IS NULL
        )
        OR
        (
          ${table.ownerType} = 'LECTURER'
          AND ${table.lecturerId} IS NOT NULL
          AND ${table.labId} IS NULL
        )
      `,
    ),
  ],
);

export const researchMaterials = pgTable(
  'research_materials',
  {
    researchId: uuid('research_id')
      .references(() => researches.id)
      .notNull(),

    materialId: uuid('material_id')
      .references(() => materials.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.researchId, table.materialId],
    }),
  ],
);

// Materials
export type Material =
  typeof materials.$inferSelect;

export type NewMaterial =
  typeof materials.$inferInsert;

export type UpdateMaterial = Partial<
  Omit<NewMaterial, 'id' | 'createdAt'>
>;

// Research Materials
export type ResearchMaterial =
  typeof researchMaterials.$inferSelect;

export type NewResearchMaterial =
  typeof researchMaterials.$inferInsert;
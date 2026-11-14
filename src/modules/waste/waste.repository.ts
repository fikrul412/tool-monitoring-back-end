import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { wastes, wasteOptions, researchWastes } from '../../database/schema/waste.schema.js';
import { researches } from '../../database/schema/research.schema.js';
import { students } from '../../database/schema/identity.schema.js';

@Injectable()
export class WasteRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  options() { return this.db.select({ id: wasteOptions.id, type: wasteOptions.type, value: wasteOptions.value }).from(wasteOptions).where(eq(wasteOptions.active, true)).orderBy(asc(wasteOptions.type), asc(wasteOptions.value)); }

  async createOption(type: 'CATEGORY' | 'UNIT' | 'PHASE' | 'HANDLING', value: string, userId: string) {
    const normalized = value.trim().replace(/\s+/g, ' ');
    const [existing] = await this.db.select().from(wasteOptions).where(and(eq(wasteOptions.type, type), eq(wasteOptions.value, normalized))).limit(1);
    if (existing?.active) return existing;
    if (existing) {
      const [restored] = await this.db.update(wasteOptions).set({ active: true }).where(eq(wasteOptions.id, existing.id)).returning();
      return restored;
    }
    try {
      const [created] = await this.db.insert(wasteOptions).values({ type, value: normalized, createdBy: userId }).returning();
      return created;
    } catch {
      throw new ConflictException('This waste option already exists.');
    }
  }

  records() {
    return this.db.select({ id: wastes.id, category: wastes.name, quantity: wastes.quantity, unit: wastes.unit, phase: wastes.phase, handling: wastes.handling, notes: wastes.description, createdAt: wastes.createdAt, researchId: researches.id, researchTitle: researches.title, student: { id: students.id, name: students.name, nim: students.nim } })
      .from(wastes).innerJoin(researchWastes, eq(researchWastes.wasteId, wastes.id)).innerJoin(researches, eq(researches.id, researchWastes.researchId)).innerJoin(students, eq(students.id, researches.studentId)).orderBy(desc(wastes.createdAt));
  }

  async deactivateOption(id: string) {
    const [option] = await this.db.update(wasteOptions).set({ active: false }).where(eq(wasteOptions.id, id)).returning();
    if (!option) throw new NotFoundException('Waste option not found.');
    return option;
  }
}

import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  labs,
  labManagers,
  type Lab,
  type NewLab,
  type UpdateLab,
} from "../database/schema/laboratory.schema.js";
import { users, lecturers } from "../database/schema/identity.schema.js";

export interface LabWithManagers extends Lab {
  managers: {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
  }[];
}

export interface GetLabsParams {
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class LaboratoryRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async findAllLabs(params: GetLabsParams = {}): Promise<{ data: LabWithManagers[]; total: number }> {
    const { search, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const whereCondition = search
      ? or(ilike(labs.name, `%${search}%`), ilike(labs.location, `%${search}%`))
      : undefined;

    // Total count
    const [countResult] = await this.db
      .select({ total: count() })
      .from(labs)
      .where(whereCondition);

    const total = Number(countResult?.total ?? 0);

    // Labs query
    const labsList = await this.db
      .select()
      .from(labs)
      .where(whereCondition)
      .orderBy(desc(labs.createdAt))
      .limit(limit)
      .offset(offset);

    if (labsList.length === 0) {
      return { data: [], total };
    }

    // Fetch managers for all retrieved labs
    const managersRaw = await this.db
      .select({
        id: labManagers.id,
        labId: labManagers.labId,
        userId: users.id,
        name: lecturers.name,
        email: users.email,
        role: users.role,
      })
      .from(labManagers)
      .innerJoin(users, eq(labManagers.userId, users.id))
      .leftJoin(lecturers, eq(lecturers.id, users.id));

    const managersByLabId = new Map<string, LabWithManagers["managers"]>();
    for (const m of managersRaw) {
      const list = managersByLabId.get(m.labId) || [];
      list.push({
        id: m.id,
        userId: m.userId,
        name: m.name ?? m.email ?? "Lab Manager",
        email: m.email ?? "",
        role: m.role,
      });
      managersByLabId.set(m.labId, list);
    }

    const data: LabWithManagers[] = labsList.map((lab) => ({
      ...lab,
      managers: managersByLabId.get(lab.id) || [],
    }));

    return { data, total };
  }

  async findLabById(labId: string): Promise<LabWithManagers | null> {
    const [lab] = await this.db
      .select()
      .from(labs)
      .where(eq(labs.id, labId))
      .limit(1);

    if (!lab) return null;

    const managersRaw = await this.db
      .select({
        id: labManagers.id,
        userId: users.id,
        name: lecturers.name,
        email: users.email,
        role: users.role,
      })
      .from(labManagers)
      .innerJoin(users, eq(labManagers.userId, users.id))
      .leftJoin(lecturers, eq(lecturers.id, users.id))
      .where(eq(labManagers.labId, labId));

    const formattedManagers = managersRaw.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name ?? m.email ?? "Lab Manager",
      email: m.email ?? "",
      role: m.role,
    }));

    return {
      ...lab,
      managers: formattedManagers,
    };
  }

  async createLab(data: NewLab): Promise<Lab> {
    const [created] = await this.db
      .insert(labs)
      .values(data)
      .returning();

    return created;
  }

  async updateLab(labId: string, data: UpdateLab): Promise<Lab | null> {
    const [updated] = await this.db
      .update(labs)
      .set(data)
      .where(eq(labs.id, labId))
      .returning();

    return updated ?? null;
  }

  async deleteLab(labId: string): Promise<boolean> {
    // Delete manager relations first
    await this.db.delete(labManagers).where(eq(labManagers.labId, labId));
    const [deleted] = await this.db
      .delete(labs)
      .where(eq(labs.id, labId))
      .returning();

    return !!deleted;
  }

  async assignManager(labId: string, userId: string) {
    const [assigned] = await this.db
      .insert(labManagers)
      .values({
        labId,
        userId,
      })
      .onConflictDoNothing()
      .returning();

    return assigned ?? null;
  }

  async removeManager(labId: string, userId: string): Promise<boolean> {
    const [removed] = await this.db
      .delete(labManagers)
      .where(and(eq(labManagers.labId, labId), eq(labManagers.userId, userId)))
      .returning();

    return !!removed;
  }

  async isManager(labId: string, userId: string): Promise<boolean> {
    const [record] = await this.db
      .select({ id: labManagers.id })
      .from(labManagers)
      .where(and(eq(labManagers.labId, labId), eq(labManagers.userId, userId)))
      .limit(1);

    return !!record;
  }
}

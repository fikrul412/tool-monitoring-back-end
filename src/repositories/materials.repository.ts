import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  materials,
  type Material,
  type NewMaterial,
  type UpdateMaterial,
} from "../database/schema/materials.schema.js";
import { labs } from "../database/schema/laboratory.schema.js";
import { lecturers } from "../database/schema/identity.schema.js";

export interface MaterialWithRelations extends Material {
  labName: string | null;
  lecturerName: string | null;
}

export interface GetMaterialsParams {
  search?: string;
  ownerType?: Material["ownerType"];
  labId?: string;
  lecturerId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class MaterialsRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async findAllMaterials(
    params: GetMaterialsParams = {},
  ): Promise<{ data: MaterialWithRelations[]; total: number }> {
    const { search, ownerType, labId, lecturerId, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(ilike(materials.name, `%${search}%`));
    }

    if (ownerType) {
      conditions.push(eq(materials.ownerType, ownerType));
    }

    if (labId) {
      conditions.push(eq(materials.labId, labId));
    }

    if (lecturerId) {
      conditions.push(eq(materials.lecturerId, lecturerId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(materials)
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);

    const rows = await this.db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        ownerType: materials.ownerType,
        labId: materials.labId,
        lecturerId: materials.lecturerId,
        quantity: materials.quantity,
        unit: materials.unit,
        isMonitored: materials.isMonitored,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
        labName: labs.name,
        lecturerName: lecturers.name,
      })
      .from(materials)
      .leftJoin(labs, eq(materials.labId, labs.id))
      .leftJoin(lecturers, eq(materials.lecturerId, lecturers.id))
      .where(whereClause)
      .orderBy(desc(materials.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total };
  }

  async findMaterialById(id: string): Promise<MaterialWithRelations | null> {
    const [row] = await this.db
      .select({
        id: materials.id,
        name: materials.name,
        description: materials.description,
        ownerType: materials.ownerType,
        labId: materials.labId,
        lecturerId: materials.lecturerId,
        quantity: materials.quantity,
        unit: materials.unit,
        isMonitored: materials.isMonitored,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
        labName: labs.name,
        lecturerName: lecturers.name,
      })
      .from(materials)
      .leftJoin(labs, eq(materials.labId, labs.id))
      .leftJoin(lecturers, eq(materials.lecturerId, lecturers.id))
      .where(eq(materials.id, id))
      .limit(1);

    return row ?? null;
  }

  async createMaterial(data: NewMaterial): Promise<Material> {
    const [created] = await this.db.insert(materials).values(data).returning();
    return created;
  }

  async updateMaterial(id: string, data: UpdateMaterial): Promise<Material | null> {
    const [updated] = await this.db
      .update(materials)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(materials)
      .where(eq(materials.id, id))
      .returning();

    return !!deleted;
  }
}

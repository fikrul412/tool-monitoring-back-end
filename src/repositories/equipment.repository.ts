import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { alias } from "drizzle-orm/pg-core";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  tools,
  toolCategories,
  type Tool,
  type NewTool,
  type UpdateTool,
  type ToolCategory,
  type NewToolCategory,
} from "../database/schema/equipment.schema.js";
import { labs } from "../database/schema/laboratory.schema.js";
import { lecturers } from "../database/schema/identity.schema.js";

const assignedLabs = alias(labs, "assigned_labs");

export interface ToolWithRelations extends Tool {
  labName: string | null;
  labLocation: string | null;
  assignedLabName: string | null;
  assignedLabLocation: string | null;
  categoryName: string | null;
  lecturerName: string | null;
}

export interface GetToolsParams {
  search?: string;
  ownerType?: Tool["ownerType"];
  labId?: string;
  lecturerId?: string;
  assignedLabId?: string;
  categoryId?: string;
  status?: Tool["status"];
  page?: number;
  limit?: number;
}

@Injectable()
export class EquipmentRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async findAllTools(
    params: GetToolsParams = {},
  ): Promise<{ data: ToolWithRelations[]; total: number }> {
    const {
      search,
      ownerType,
      labId,
      lecturerId,
      assignedLabId,
      categoryId,
      status,
      page = 1,
      limit = 10,
    } = params;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(tools.name, `%${search}%`),
          ilike(tools.inventoryCode, `%${search}%`),
          ilike(toolCategories.name, `%${search}%`),
          ilike(labs.name, `%${search}%`),
          ilike(assignedLabs.name, `%${search}%`),
          ilike(lecturers.name, `%${search}%`),
        ),
      );
    }

    if (ownerType) conditions.push(eq(tools.ownerType, ownerType));
    if (labId) conditions.push(eq(tools.labId, labId));
    if (lecturerId) conditions.push(eq(tools.lecturerId, lecturerId));
    if (assignedLabId) {
      conditions.push(eq(tools.assignedLabId, assignedLabId));
    }
    if (categoryId) conditions.push(eq(tools.categoryId, categoryId));
    if (status) conditions.push(eq(tools.status, status));

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(tools)
      .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
      .leftJoin(labs, eq(tools.labId, labs.id))
      .leftJoin(assignedLabs, eq(tools.assignedLabId, assignedLabs.id))
      .leftJoin(lecturers, eq(tools.lecturerId, lecturers.id))
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);

    const rows = await this.db
      .select({
        id: tools.id,
        ownerType: tools.ownerType,
        labId: tools.labId,
        lecturerId: tools.lecturerId,
        assignedLabId: tools.assignedLabId,
        categoryId: tools.categoryId,
        name: tools.name,
        inventoryCode: tools.inventoryCode,
        status: tools.status,
        description: tools.description,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
        labName: labs.name,
        labLocation: labs.location,
        assignedLabName: assignedLabs.name,
        assignedLabLocation: assignedLabs.location,
        categoryName: toolCategories.name,
        lecturerName: lecturers.name,
      })
      .from(tools)
      .leftJoin(labs, eq(tools.labId, labs.id))
      .leftJoin(assignedLabs, eq(tools.assignedLabId, assignedLabs.id))
      .leftJoin(lecturers, eq(tools.lecturerId, lecturers.id))
      .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
      .where(whereClause)
      .orderBy(desc(tools.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total };
  }

  async findToolById(id: string): Promise<ToolWithRelations | null> {
    const [row] = await this.db
      .select({
        id: tools.id,
        ownerType: tools.ownerType,
        labId: tools.labId,
        lecturerId: tools.lecturerId,
        assignedLabId: tools.assignedLabId,
        categoryId: tools.categoryId,
        name: tools.name,
        inventoryCode: tools.inventoryCode,
        status: tools.status,
        description: tools.description,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
        labName: labs.name,
        labLocation: labs.location,
        assignedLabName: assignedLabs.name,
        assignedLabLocation: assignedLabs.location,
        categoryName: toolCategories.name,
        lecturerName: lecturers.name,
      })
      .from(tools)
      .leftJoin(labs, eq(tools.labId, labs.id))
      .leftJoin(assignedLabs, eq(tools.assignedLabId, assignedLabs.id))
      .leftJoin(lecturers, eq(tools.lecturerId, lecturers.id))
      .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
      .where(eq(tools.id, id))
      .limit(1);

    return row ?? null;
  }

  async createTool(data: NewTool): Promise<Tool> {
    const [created] = await this.db
      .insert(tools)
      .values(data)
      .returning();

    return created;
  }

  async updateTool(id: string, data: UpdateTool): Promise<Tool | null> {
    const [updated] = await this.db
      .update(tools)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tools.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteTool(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(tools)
      .where(eq(tools.id, id))
      .returning();

    return !!deleted;
  }

  async findAllCategories(): Promise<ToolCategory[]> {
    return this.db
      .select()
      .from(toolCategories)
      .orderBy(toolCategories.name);
  }

  async createCategory(data: NewToolCategory): Promise<ToolCategory> {
    const [created] = await this.db
      .insert(toolCategories)
      .values(data)
      .returning();

    return created;
  }
}

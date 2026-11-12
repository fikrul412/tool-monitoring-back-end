
import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  inArray,
  asc
} from "drizzle-orm";

import type { SQL } from "drizzle-orm";

import type { UpdateResearchDto } from "../modules/research/dto/update-research.dto.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { CreateResearchDto } from "../modules/research/dto/create-research.dto.js";
import type { ReviewResearchDto } from "../modules/research/dto/review-research.dto.js";
import {
  researches,
  researchSupervisors,
  researchLabs,
  researchTools,
} from "../database/schema/research.schema.js";

import { researchApplicationLogs } from "../database/schema/research-application.schema.js";

import {
  students,
  lecturers,
  users,
} from "../database/schema/identity.schema.js";
import { labs } from "../database/schema/laboratory.schema.js";
import { tools } from "../database/schema/equipment.schema.js";

@Injectable()
export class ResearchRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) { }

  async create(
    studentId: string,
    data: CreateResearchDto,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Create research
      const [research] = await tx
        .insert(researches)
        .values({
          studentId,
          title: data.title,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          status: "PENDING",
        })
        .returning();

      // 2. Assign supervisors
      if (data.supervisorIds.length > 0) {
        await tx.insert(researchSupervisors).values(
          data.supervisorIds.map((lecturerId) => ({
            researchId: research.id,
            lecturerId,
          })),
        );
      }

      // 3. Assign laboratories
      if (data.labIds.length > 0) {
        await tx.insert(researchLabs).values(
          data.labIds.map((labId) => ({
            researchId: research.id,
            labId,
          })),
        );
      }

      // 4. Assign equipment
      if (data.toolIds?.length) {
        await tx.insert(researchTools).values(
          data.toolIds.map((toolId) => ({
            researchId: research.id,
            toolId,
          })),
        );
      }

      // 5. Create initial application log
      await tx.insert(researchApplicationLogs).values({
        researchId: research.id,
        status: "PENDING",
        comments: "Research application submitted.",
      });

      return research;
    });
  }
  // ==========================================
  // RESEARCH APPLICATION VALIDATION
  // ==========================================

  async findAll(
    page: number,
    limit: number,
    filters?: {
      search?: string;
      status?: "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "COMPLETED" | "CANCELLED";
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters?.status) {
      conditions.push(eq(researches.status, filters.status));
    }

    const search = filters?.search?.trim();

    if (search) {
      conditions.push(
        or(
          ilike(researches.title, `%${search}%`),
          ilike(students.name, `%${search}%`),
          ilike(students.nim, `%${search}%`),
        )!,
      );
    }

    const whereClause = conditions.length
      ? and(...conditions)
      : undefined;

    const data = await this.db
      .select({
        id: researches.id,
        studentId: researches.studentId,
        title: researches.title,
        startDate: researches.startDate,
        endDate: researches.endDate,
        status: researches.status,
        createdAt: researches.createdAt,
        updatedAt: researches.updatedAt,
        student: {
          id: students.id,
          name: students.name,
          nim: students.nim,
        },
      })
      .from(researches)
      .innerJoin(students, eq(researches.studentId, students.id))
      .where(whereClause)
      .orderBy(desc(researches.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await this.db
      .select({ total: count() })
      .from(researches)
      .innerJoin(students, eq(researches.studentId, students.id))
      .where(whereClause);

    return {
      data,
      total: Number(countResult.total),
      page,
      limit,
    };
  }
  async update(
    researchId: string,
    studentId: string,
    data: UpdateResearchDto,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Lock and verify research ownership
      const [existing] = await tx
        .select({
          id: researches.id,
          status: researches.status,
        })
        .from(researches)
        .where(
          and(
            eq(researches.id, researchId),
            eq(researches.studentId, studentId),
          ),
        )
        .for("update");

      if (!existing) {
        return { outcome: "NOT_FOUND" as const };
      }

      if (existing.status !== "PENDING") {
        return { outcome: "NOT_EDITABLE" as const };
      }

      // 2. Validate supervisors
      if (data.supervisorIds !== undefined) {
        const lecturersFound = await tx
          .select({ id: lecturers.id })
          .from(lecturers)
          .innerJoin(users, eq(lecturers.id, users.id))
          .where(
            and(
              inArray(lecturers.id, data.supervisorIds),
              eq(users.status, "ACTIVE"),
            ),
          );

        if (lecturersFound.length !== data.supervisorIds.length) {
          return { outcome: "INVALID_SUPERVISORS" as const };
        }
      }

      // 3. Validate laboratories
      if (data.labIds !== undefined) {
        const labsFound = await tx
          .select({ id: labs.id })
          .from(labs)
          .where(inArray(labs.id, data.labIds));

        if (labsFound.length !== data.labIds.length) {
          return { outcome: "INVALID_LABS" as const };
        }
      }

      // 4. Validate equipment availability
      if (data.toolIds !== undefined && data.toolIds.length > 0) {
        const toolsFound = await tx
          .select({ id: tools.id })
          .from(tools)
          .where(
            and(
              inArray(tools.id, data.toolIds),
              eq(tools.status, "AVAILABLE"),
            ),
          );

        if (toolsFound.length !== data.toolIds.length) {
          return { outcome: "INVALID_TOOLS" as const };
        }
      }

      // 5. Prepare research updates
      const updateData: Partial<typeof researches.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) {
        updateData.title = data.title;
      }

      if (data.startDate !== undefined) {
        updateData.startDate = data.startDate;
      }

      if (data.endDate !== undefined) {
        updateData.endDate = data.endDate;
      }

      const [updatedResearch] = await tx
        .update(researches)
        .set(updateData)
        .where(eq(researches.id, researchId))
        .returning();

      // 6. Replace supervisors if provided
      if (data.supervisorIds !== undefined) {
        await tx
          .delete(researchSupervisors)
          .where(eq(researchSupervisors.researchId, researchId));

        if (data.supervisorIds.length > 0) {
          await tx.insert(researchSupervisors).values(
            data.supervisorIds.map((lecturerId) => ({
              researchId,
              lecturerId,
            })),
          );
        }
      }

      // 7. Replace laboratories if provided
      if (data.labIds !== undefined) {
        await tx
          .delete(researchLabs)
          .where(eq(researchLabs.researchId, researchId));

        if (data.labIds.length > 0) {
          await tx.insert(researchLabs).values(
            data.labIds.map((labId) => ({
              researchId,
              labId,
            })),
          );
        }
      }

      // 8. Replace equipment if provided
      if (data.toolIds !== undefined) {
        await tx
          .delete(researchTools)
          .where(eq(researchTools.researchId, researchId));

        if (data.toolIds.length > 0) {
          await tx.insert(researchTools).values(
            data.toolIds.map((toolId) => ({
              researchId,
              toolId,
            })),
          );
        }
      }

      return {
        outcome: "SUCCESS" as const,
        research: updatedResearch,
      };
    });
  }

  async review(
    researchId: string,
    reviewerId: string,
    data: ReviewResearchDto,
  ) {
    return this.db.transaction(async (tx) => {
      // Lock the research row to prevent concurrent reviews
      const [existing] = await tx
        .select({
          id: researches.id,
          status: researches.status,
        })
        .from(researches)
        .where(eq(researches.id, researchId))
        .for("update");

      if (!existing) {
        return { outcome: "NOT_FOUND" as const };
      }

      // Only pending applications can be reviewed
      if (existing.status !== "PENDING") {
        return { outcome: "ALREADY_REVIEWED" as const };
      }

      // Update research status
      const [updatedResearch] = await tx
        .update(researches)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(researches.id, researchId))
        .returning();

      // Record review history
      await tx.insert(researchApplicationLogs).values({
        researchId,
        status: data.status,
        comments: data.comments?.trim() || null,
        reviewedBy: reviewerId,
      });

      return {
        outcome: "SUCCESS" as const,
        research: updatedResearch,
      };
    });
  }

  async updateStatus(
    researchId: string,
    reviewerId: string,
    data: { status: "ONGOING" | "COMPLETED" | "CANCELLED"; comments?: string },
  ) {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: researches.id, status: researches.status })
        .from(researches).where(eq(researches.id, researchId)).for("update");
      if (!existing) return { outcome: "NOT_FOUND" as const };
      const allowed: string[] = existing.status === "APPROVED"
        ? ["ONGOING", "CANCELLED"]
        : existing.status === "ONGOING" ? ["COMPLETED", "CANCELLED"] : [];
      if (!allowed.includes(data.status)) return { outcome: "INVALID_TRANSITION" as const };
      const [research] = await tx.update(researches)
        .set({ status: data.status, updatedAt: new Date() })
        .where(eq(researches.id, researchId)).returning();
      await tx.insert(researchApplicationLogs).values({
        researchId,
        status: data.status,
        comments: data.comments?.trim() || null,
        reviewedBy: reviewerId,
      });
      return { outcome: "SUCCESS" as const, research };
    });
  }

  async findActiveLecturerIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    const result = await this.db
      .select({
        id: lecturers.id,
      })
      .from(lecturers)
      .innerJoin(users, eq(lecturers.id, users.id))
      .where(
        and(
          inArray(lecturers.id, ids),
          eq(users.status, "ACTIVE"),
        ),
      );

    return result.map((lecturer) => lecturer.id);
  }

  async findExistingLabIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    const result = await this.db
      .select({
        id: labs.id,
      })
      .from(labs)
      .where(inArray(labs.id, ids));

    return result.map((lab) => lab.id);
  }

  async findAvailableToolIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    const result = await this.db
      .select({
        id: tools.id,
      })
      .from(tools)
      .where(
        and(
          inArray(tools.id, ids),
          eq(tools.status, "AVAILABLE"),
        ),
      );

    return result.map((tool) => tool.id);
  }
  async findById(researchId: string) {
    // Research and student information
    const [research] = await this.db
      .select({
        id: researches.id,
        studentId: researches.studentId,
        title: researches.title,
        startDate: researches.startDate,
        endDate: researches.endDate,
        status: researches.status,
        createdAt: researches.createdAt,
        updatedAt: researches.updatedAt,

        student: {
          id: students.id,
          name: students.name,
          nim: students.nim,
        },
      })
      .from(researches)
      .innerJoin(students, eq(researches.studentId, students.id))
      .where(eq(researches.id, researchId))
      .limit(1);

    if (!research) {
      return null;
    }

    // Research supervisors
    const supervisors = await this.db
      .select({
        id: lecturers.id,
        name: lecturers.name,
        nip: lecturers.nip,
      })
      .from(researchSupervisors)
      .innerJoin(
        lecturers,
        eq(researchSupervisors.lecturerId, lecturers.id),
      )
      .where(eq(researchSupervisors.researchId, researchId))
      .orderBy(asc(lecturers.name));

    // Associated laboratories
    const laboratories = await this.db
      .select({
        id: labs.id,
        name: labs.name,
        location: labs.location,
      })
      .from(researchLabs)
      .innerJoin(
        labs,
        eq(researchLabs.labId, labs.id),
      )
      .where(eq(researchLabs.researchId, researchId))
      .orderBy(asc(labs.name));

    // Associated equipment
    const equipment = await this.db
      .select({
        id: tools.id,
        name: tools.name,
        inventoryCode: tools.inventoryCode,
        status: tools.status,
      })
      .from(researchTools)
      .innerJoin(
        tools,
        eq(researchTools.toolId, tools.id),
      )
      .where(eq(researchTools.researchId, researchId))
      .orderBy(asc(tools.name));

    return {
      ...research,
      supervisors,
      laboratories,
      equipment,
    };
  }

  async findByIdAndStudent(
    researchId: string,
    studentId: string,
  ) {
    const [research] = await this.db
      .select({
        id: researches.id,
        studentId: researches.studentId,
        title: researches.title,
        startDate: researches.startDate,
        endDate: researches.endDate,
        status: researches.status,
        createdAt: researches.createdAt,
        updatedAt: researches.updatedAt,
      })
      .from(researches)
      .where(
        eq(researches.id, researchId),
      )
      .limit(1);

    if (!research || research.studentId !== studentId) {
      return null;
    }

    return this.findById(researchId);
  }

  async findByStudent(
    studentId: string,
    page = 1,
    limit = 10,
    filters?: { search?: string; status?: "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "COMPLETED" | "CANCELLED" },
  ) {
    const conditions = [eq(researches.studentId, studentId)];
    if (filters?.status) conditions.push(eq(researches.status, filters.status));
    const search = filters?.search?.trim();
    if (search) conditions.push(ilike(researches.title, `%${search}%`));
    const whereClause = and(...conditions);
    const [data, totalResult] = await Promise.all([
      this.db
        .select({
          id: researches.id,
          studentId: researches.studentId,
          title: researches.title,
          startDate: researches.startDate,
          endDate: researches.endDate,
          status: researches.status,
          createdAt: researches.createdAt,
          updatedAt: researches.updatedAt,
        })
        .from(researches)
        .where(whereClause)
        .orderBy(desc(researches.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),

      this.db
        .select({
          total: count(),
        })
        .from(researches)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.total ?? 0);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findLogsByResearchId(researchId: string) {
    return this.db
      .select({
        id: researchApplicationLogs.id,
        researchId: researchApplicationLogs.researchId,
        status: researchApplicationLogs.status,
        comments: researchApplicationLogs.comments,
        createdAt: researchApplicationLogs.createdAt,
        reviewedBy: researchApplicationLogs.reviewedBy,

        reviewer: {
          id: users.id,
          email: users.email,
        },
      })
      .from(researchApplicationLogs)
      .leftJoin(
        users,
        eq(researchApplicationLogs.reviewedBy, users.id),
      )
      .where(eq(researchApplicationLogs.researchId, researchId))
      .orderBy(desc(researchApplicationLogs.createdAt));
  }
}

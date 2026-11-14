import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { researches } from '../../database/schema/research.schema.js';
import { researchApplicationLogs } from '../../database/schema/research-application.schema.js';
import { letterApplications } from '../../database/schema/persuratan.schema.js';
import { students } from '../../database/schema/identity.schema.js';
import { researchClearanceReports } from '../../database/schema/persuratan.schema.js';
import { researchMaterials } from '../../database/schema/materials.schema.js';
import { tools } from '../../database/schema/equipment.schema.js';
import { researchTools } from '../../database/schema/research.schema.js';
import { materialBorrowingLogs } from '../../database/schema/borrowing.schema.js';
import { wasteOptions, wastes, researchWastes } from '../../database/schema/waste.schema.js';

@Injectable()
export class PersuratanRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async requestClearance(studentId: string, body: { researchId: string; materialUsage: Array<{ materialId: string; name: string; quantity: number; unit: string }>; equipmentConditions: Array<{ toolId: string; condition: string; notes?: string }>; wasteHandling: Array<{ name: string; phase: string; handling: string; quantity: number; unit: string; notes?: string }> }) {
    return this.db.transaction(async tx => {
      const [research] = await tx.select({ id: researches.id, status: researches.status }).from(researches).where(and(eq(researches.id, body.researchId), eq(researches.studentId, studentId))).for('update');
      if (!research || research.status !== 'ONGOING') return 'NOT_ELIGIBLE' as const;
      const [existing] = await tx.select({ id: letterApplications.id }).from(letterApplications).where(and(eq(letterApplications.researchId, body.researchId), eq(letterApplications.type, 'LAB_CLEARANCE'), eq(letterApplications.status, 'SUBMITTED'))).limit(1);
      if (existing) return 'EXISTS' as const;

      const materialIds = body.materialUsage.map(item => item.materialId);
      if (materialIds.length !== new Set(materialIds).size) return 'INVALID_MATERIAL' as const;
      const equipmentNames = new Map<string, string>();
      if (materialIds.length) {
        const linked = await tx.select({ id: researchMaterials.materialId }).from(researchMaterials).where(and(eq(researchMaterials.researchId, body.researchId), inArray(researchMaterials.materialId, materialIds)));
        if (linked.length !== new Set(materialIds).size) return 'INVALID_MATERIAL' as const;
      }
      const toolIds = body.equipmentConditions.map(item => item.toolId);
      if (toolIds.length) {
        const linked = await tx.select({ id: researchTools.toolId, name: tools.name }).from(researchTools).innerJoin(tools, eq(researchTools.toolId, tools.id)).where(and(eq(researchTools.researchId, body.researchId), inArray(researchTools.toolId, toolIds)));
        if (linked.length !== new Set(toolIds).size) return 'INVALID_TOOL' as const;
        for (const item of linked) equipmentNames.set(item.id, item.name);
        for (const item of body.equipmentConditions) {
          const condition = item.condition.toLowerCase();
          const status = condition.includes('damag') || condition.includes('rusak') ? 'MAINTENANCE' : condition.includes('lost') || condition.includes('hilang') ? 'UNAVAILABLE' : 'AVAILABLE';
          await tx.update(tools).set({ status, updatedAt: new Date() }).where(eq(tools.id, item.toolId));
        }
      }

      const submittedWasteOptions = body.wasteHandling.flatMap(item => [
        { type: 'CATEGORY' as const, value: item.name.trim() },
        { type: 'UNIT' as const, value: item.unit.trim() },
        { type: 'PHASE' as const, value: item.phase.trim() },
        { type: 'HANDLING' as const, value: item.handling.trim() },
      ]);
      const availableOptions = await tx.select({ type: wasteOptions.type, value: wasteOptions.value }).from(wasteOptions).where(eq(wasteOptions.active, true));
      if (submittedWasteOptions.some(option => !availableOptions.some(available => available.type === option.type && available.value === option.value))) return 'INVALID_WASTE_OPTION' as const;

      const materialUsage = body.materialUsage.map(item => ({ ...item, name: item.name.trim(), unit: item.unit.trim(), quantity: Number(item.quantity) }));
      const equipmentConditions = body.equipmentConditions.map(item => ({ ...item, name: equipmentNames.get(item.toolId) ?? 'Equipment', condition: item.condition.trim() }));
      const wasteHandling = body.wasteHandling.map(item => ({ ...item, name: item.name.trim(), phase: item.phase.trim(), handling: item.handling.trim() }));
      const [previousReport] = await tx.select({ id: researchClearanceReports.id }).from(researchClearanceReports).where(eq(researchClearanceReports.researchId, body.researchId)).limit(1);
      if (previousReport) {
        const oldWasteRows = await tx.select({ id: wastes.id }).from(wastes).where(eq(wastes.clearanceReportId, previousReport.id));
        if (oldWasteRows.length) await tx.delete(researchWastes).where(and(eq(researchWastes.researchId, body.researchId), inArray(researchWastes.wasteId, oldWasteRows.map(item => item.id))));
        await tx.delete(wastes).where(eq(wastes.clearanceReportId, previousReport.id));
      }
      const [clearanceReport] = await tx.insert(researchClearanceReports).values({ researchId: body.researchId, materialUsage, equipmentConditions, wasteHandling }).onConflictDoUpdate({ target: researchClearanceReports.researchId, set: { materialUsage, equipmentConditions, wasteHandling, createdAt: new Date() } }).returning({ id: researchClearanceReports.id });
      if (wasteHandling.length) {
        const insertedWastes = await tx.insert(wastes).values(wasteHandling.map(item => ({ clearanceReportId: clearanceReport.id, name: item.name, phase: item.phase, quantity: String(item.quantity), unit: item.unit, handling: item.handling, description: item.notes?.trim() || null }))).returning({ id: wastes.id });
        await tx.insert(researchWastes).values(insertedWastes.map(item => ({ researchId: body.researchId, wasteId: item.id })));
      }
      const stockUsage = materialUsage;
      await tx.delete(materialBorrowingLogs).where(and(eq(materialBorrowingLogs.researchId, body.researchId), eq(materialBorrowingLogs.description, 'Actual usage recorded with lab clearance report.')));
      if (stockUsage.length) await tx.insert(materialBorrowingLogs).values(stockUsage.map(item => ({ researchId: body.researchId, studentId, materialId: item.materialId!, quantity: String(item.quantity), type: 'BORROW' as const, approvalStatus: 'APPROVED' as const, description: 'Actual usage recorded with lab clearance report.' })));
      const [application] = await tx.insert(letterApplications).values({ researchId: body.researchId, studentId, type: 'LAB_CLEARANCE' }).returning();
      await tx.update(researches).set({ status: 'COMPLETION_REQUESTED', updatedAt: new Date() }).where(eq(researches.id, body.researchId));
      await tx.insert(researchApplicationLogs).values({ researchId: body.researchId, status: 'COMPLETION_REQUESTED', comments: 'Student submitted lab clearance report.' });
      return application;
    });
  }

  async eligible(studentId: string) {
    const [approved, completed, applications] = await Promise.all([
      this.db.select({ id: researches.id, title: researches.title, status: researches.status }).from(researches).where(and(eq(researches.studentId, studentId), eq(researches.status, 'APPROVED'))),
      this.db.select({ id: researches.id, title: researches.title, status: researches.status }).from(researches).where(and(eq(researches.studentId, studentId), eq(researches.status, 'COMPLETION_REQUESTED'))),
      this.db.select({ researchId: letterApplications.researchId, type: letterApplications.type, status: letterApplications.status }).from(letterApplications).where(eq(letterApplications.studentId, studentId)),
    ]);
    const hasOpenApplication = (id: string, type: string) => applications.some(a => a.researchId === id && a.type === type && a.status !== 'REJECTED');
    return {
      labAccess: approved.filter(r => !hasOpenApplication(r.id, 'LAB_ACCESS')),
      labClearance: completed.filter(r => !hasOpenApplication(r.id, 'LAB_CLEARANCE')),
    };
  }

  archive(studentId: string) {
    return this.db.select({ id: letterApplications.id, researchId: letterApplications.researchId, researchTitle: researches.title, type: letterApplications.type, status: letterApplications.status, reviewComments: letterApplications.reviewComments, createdAt: letterApplications.createdAt })
      .from(letterApplications).innerJoin(researches, eq(letterApplications.researchId, researches.id))
      .where(eq(letterApplications.studentId, studentId)).orderBy(desc(letterApplications.createdAt));
  }

  async apply(studentId: string, researchId: string, type: 'LAB_ACCESS' | 'LAB_CLEARANCE') {
    const requiredStatus = type === 'LAB_ACCESS' ? 'APPROVED' : 'COMPLETION_REQUESTED';
    const [research] = await this.db.select({ id: researches.id }).from(researches).where(and(eq(researches.id, researchId), eq(researches.studentId, studentId), eq(researches.status, requiredStatus))).limit(1);
    if (!research) return 'NOT_FOUND' as const;
    const [existing] = await this.db.select({ id: letterApplications.id }).from(letterApplications)
      .where(and(eq(letterApplications.researchId, researchId), eq(letterApplications.type, type), eq(letterApplications.status, 'SUBMITTED'))).limit(1);
    if (existing) return 'EXISTS' as const;
    const [application] = await this.db.insert(letterApplications).values({ researchId, studentId, type }).returning();
    return application;
  }

  adminApplications() {
    return this.db.select({ id: letterApplications.id, researchId: researches.id, researchTitle: researches.title, researchStatus: researches.status, type: letterApplications.type, status: letterApplications.status, createdAt: letterApplications.createdAt, student: { id: students.id, name: students.name, nim: students.nim }, clearanceReport: { materialUsage: researchClearanceReports.materialUsage, equipmentConditions: researchClearanceReports.equipmentConditions, wasteHandling: researchClearanceReports.wasteHandling } })
      .from(letterApplications).innerJoin(researches, eq(letterApplications.researchId, researches.id))
      .innerJoin(students, eq(letterApplications.studentId, students.id))
      .leftJoin(researchClearanceReports, eq(researchClearanceReports.researchId, researches.id))
      .where(eq(letterApplications.status, 'SUBMITTED')).orderBy(desc(letterApplications.createdAt));
  }

  async review(id: string, decision: 'RECEIVED' | 'REJECTED', comments?: string) {
    return this.db.transaction(async tx => {
      const [application] = await tx.select({ id: letterApplications.id, researchId: letterApplications.researchId, type: letterApplications.type, status: letterApplications.status, researchStatus: researches.status })
        .from(letterApplications).innerJoin(researches, eq(letterApplications.researchId, researches.id))
        .where(eq(letterApplications.id, id)).for('update');
      if (!application) return 'NOT_FOUND' as const;
      if (application.status !== 'SUBMITTED') return 'ALREADY_REVIEWED' as const;
      if (decision === 'RECEIVED' && application.type === 'LAB_ACCESS' && application.researchStatus !== 'APPROVED') return 'INVALID_RESEARCH_STATE' as const;
      if (decision === 'RECEIVED' && application.type === 'LAB_CLEARANCE' && application.researchStatus !== 'COMPLETION_REQUESTED') return 'INVALID_RESEARCH_STATE' as const;

      const [updated] = await tx.update(letterApplications).set({ status: decision, reviewComments: comments?.trim() || null, updatedAt: new Date() }).where(eq(letterApplications.id, id)).returning();
      if (decision === 'RECEIVED' && application.type === 'LAB_ACCESS') {
        await tx.update(researches).set({ status: 'ONGOING', updatedAt: new Date() }).where(eq(researches.id, application.researchId));
        await tx.insert(researchApplicationLogs).values({ researchId: application.researchId, status: 'ONGOING', comments: `Lab permit received${comments?.trim() ? `: ${comments.trim()}` : '.'}` });
      } else if (decision === 'RECEIVED' && application.type === 'LAB_CLEARANCE') {
        await tx.update(researches).set({ status: 'COMPLETED', updatedAt: new Date() }).where(eq(researches.id, application.researchId));
        await tx.insert(researchApplicationLogs).values({ researchId: application.researchId, status: 'COMPLETED', comments: `Lab clearance approved${comments?.trim() ? `: ${comments.trim()}` : '.'}` });
      } else if (decision === 'REJECTED' && application.type === 'LAB_CLEARANCE') {
        await tx.update(researches).set({ status: 'ONGOING', updatedAt: new Date() }).where(eq(researches.id, application.researchId));
        await tx.insert(researchApplicationLogs).values({ researchId: application.researchId, status: 'ONGOING', comments: `Lab clearance needs revision${comments?.trim() ? `: ${comments.trim()}` : '.'}` });
      }
      return updated;
    });
  }
}

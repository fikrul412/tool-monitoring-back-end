import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, gt, inArray, lt, ne } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { materials } from '../../database/schema/materials.schema.js';
import { tools } from '../../database/schema/equipment.schema.js';
import { materialBorrowingLogs, toolBorrowingLogs } from '../../database/schema/borrowing.schema.js';
import { toolScheduleLogs, toolSchedules } from '../../database/schema/scheduling.schema.js';
import { students } from '../../database/schema/identity.schema.js';
import { labs } from '../../database/schema/laboratory.schema.js';

@Injectable()
export class BorrowingRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async createMaterialRequest(studentId: string, materialId: string, quantity: number, description?: string) {
    const [material] = await this.db.select({ id: materials.id }).from(materials).where(and(eq(materials.id, materialId), eq(materials.isAvailable, true))).limit(1);
    if (!material) throw new NotFoundException('Available material not found.');
    const [row] = await this.db.insert(materialBorrowingLogs).values({ studentId, materialId, quantity: String(quantity), type: 'BORROW', description: description?.trim() || null, approvalStatus: 'PENDING' }).returning();
    return row;
  }

  myMaterialRequests(studentId: string) {
    return this.db.select({ id: materialBorrowingLogs.id, materialId: materials.id, materialName: materials.name, unit: materials.unit, quantity: materialBorrowingLogs.quantity, status: materialBorrowingLogs.approvalStatus, reviewComments: materialBorrowingLogs.reviewComments, description: materialBorrowingLogs.description, createdAt: materialBorrowingLogs.time })
      .from(materialBorrowingLogs).innerJoin(materials, eq(materialBorrowingLogs.materialId, materials.id)).where(and(eq(materialBorrowingLogs.studentId, studentId), eq(materialBorrowingLogs.type, 'BORROW'))).orderBy(desc(materialBorrowingLogs.time));
  }

  pendingMaterialRequests() {
    return this.db.select({ id: materialBorrowingLogs.id, materialName: materials.name, unit: materials.unit, quantity: materialBorrowingLogs.quantity, status: materialBorrowingLogs.approvalStatus, description: materialBorrowingLogs.description, createdAt: materialBorrowingLogs.time, student: { id: students.id, name: students.name, nim: students.nim } })
      .from(materialBorrowingLogs).innerJoin(materials, eq(materialBorrowingLogs.materialId, materials.id)).innerJoin(students, eq(materialBorrowingLogs.studentId, students.id)).where(and(eq(materialBorrowingLogs.type, 'BORROW'), eq(materialBorrowingLogs.approvalStatus, 'PENDING'))).orderBy(asc(materialBorrowingLogs.time));
  }

  async reviewMaterialRequest(id: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const [row] = await this.db.update(materialBorrowingLogs).set({ approvalStatus: status, reviewComments: comments?.trim() || null }).where(and(eq(materialBorrowingLogs.id, id), eq(materialBorrowingLogs.approvalStatus, 'PENDING'))).returning();
    if (!row) throw new ConflictException('Request was already reviewed or no longer exists.');
    return row;
  }

  async createToolBorrow(studentId: string, toolId: string, durationMinutes: number) {
    const [tool] = await this.db.select({ id: tools.id, status: tools.status }).from(tools).where(eq(tools.id, toolId)).limit(1);
    if (!tool) throw new NotFoundException('Tool not found.');
    const start = new Date(); const end = new Date(start.getTime() + durationMinutes * 60_000);
    const [conflict] = await this.db.select({ id: toolSchedules.id }).from(toolSchedules).where(and(eq(toolSchedules.toolId, toolId), lt(toolSchedules.startTime, end), gt(toolSchedules.endTime, start))).limit(1);
    if (tool.status !== 'AVAILABLE' || conflict) return { toolId, result: 'REJECTED' as const };
    return { toolId, result: 'QR_REQUIRED' as const, qrPayload: toolId };
  }

  async confirmToolBorrow(studentId: string, toolId: string, durationMinutes: number) {
    return this.db.transaction(async tx => {
      const [tool] = await tx.select({ id: tools.id, status: tools.status }).from(tools).where(eq(tools.id, toolId)).for('update');
      if (!tool) throw new NotFoundException('Tool not found.');
      if (tool.status !== 'AVAILABLE') return { result: 'REJECTED' as const };
      const start = new Date(); const plannedEnd = new Date(start.getTime() + durationMinutes * 60_000);
      const [scheduleConflict] = await tx.select({ id: toolSchedules.id }).from(toolSchedules).where(and(eq(toolSchedules.toolId, toolId), lt(toolSchedules.startTime, plannedEnd), gt(toolSchedules.endTime, start))).limit(1);
      if (scheduleConflict) return { result: 'REJECTED' as const };
      const [log] = await tx.insert(toolBorrowingLogs).values({ toolId, studentId, type: 'BORROW', status: 'BORROWED', description: `Tool borrow authenticated; duration: ${durationMinutes} minutes` }).returning();
      await tx.update(tools).set({ status: 'IN_USE', updatedAt: new Date() }).where(eq(tools.id, toolId));
      return log;
    });
  }

  async createToolReturn(studentId: string, toolId: string) {
    const [tool] = await this.db.select({ id: tools.id, status: tools.status }).from(tools).where(eq(tools.id, toolId)).limit(1);
    if (!tool || tool.status !== 'IN_USE') throw new ConflictException('No active borrowing found for this tool.');
    const [lastEvent] = await this.db.select().from(toolBorrowingLogs).where(and(eq(toolBorrowingLogs.toolId, toolId), eq(toolBorrowingLogs.studentId, studentId), inArray(toolBorrowingLogs.status, ['BORROWED', 'AVAILABLE']))).orderBy(desc(toolBorrowingLogs.time)).limit(1);
    if (!lastEvent || lastEvent.type !== 'BORROW' || lastEvent.status !== 'BORROWED') throw new ConflictException('No active borrowing found for this tool.');
    return { toolId, qrPayload: toolId };
  }

  async confirmToolReturn(studentId: string, toolId: string) {
    return this.db.transaction(async tx => {
      const [tool] = await tx.select({ id: tools.id, status: tools.status }).from(tools).where(eq(tools.id, toolId)).for('update');
      if (!tool || tool.status !== 'IN_USE') throw new ConflictException('Tool is no longer in use.');
      const [lastEvent] = await tx.select().from(toolBorrowingLogs).where(and(eq(toolBorrowingLogs.toolId, toolId), eq(toolBorrowingLogs.studentId, studentId), inArray(toolBorrowingLogs.status, ['BORROWED', 'AVAILABLE']))).orderBy(desc(toolBorrowingLogs.time)).limit(1);
      if (!lastEvent || lastEvent.type !== 'BORROW' || lastEvent.status !== 'BORROWED') throw new ConflictException('No active borrowing found for this tool.');
      const [log] = await tx.insert(toolBorrowingLogs).values({ toolId, studentId, type: 'RETURN', status: 'AVAILABLE', description: 'Tool return authenticated.' }).returning();
      await tx.update(tools).set({ status: 'AVAILABLE', updatedAt: new Date() }).where(eq(tools.id, toolId));
      return log;
    });
  }

  myTools(studentId: string) {
    return this.db.select({ id: toolBorrowingLogs.id, toolId: tools.id, toolName: tools.name, inventoryCode: tools.inventoryCode, type: toolBorrowingLogs.type, status: toolBorrowingLogs.status, description: toolBorrowingLogs.description, time: toolBorrowingLogs.time })
      .from(toolBorrowingLogs).innerJoin(tools, eq(toolBorrowingLogs.toolId, tools.id)).where(and(eq(toolBorrowingLogs.studentId, studentId), ne(toolBorrowingLogs.status, 'PENDING'))).orderBy(desc(toolBorrowingLogs.time));
  }

  async createSchedule(studentId: string, toolId: string, start: Date, end: Date, description?: string) {
    if (end <= start) throw new ConflictException('End time must be after start time.');
    return this.db.transaction(async tx => {
      const [tool] = await tx.select({ id: tools.id, labId: tools.labId, assignedLabId: tools.assignedLabId }).from(tools).where(eq(tools.id, toolId)).for('update');
      if (!tool) throw new NotFoundException('Tool not found.');
      const locationLabId = tool.assignedLabId ?? tool.labId;
      const [lab] = locationLabId ? await tx.select({ location: labs.location }).from(labs).where(eq(labs.id, locationLabId)).limit(1) : [];
      const location = lab?.location ?? 'Lab location not set';
      const [conflict] = await tx.select({ id: toolSchedules.id }).from(toolSchedules).where(and(eq(toolSchedules.toolId, toolId), lt(toolSchedules.startTime, end), gt(toolSchedules.endTime, start))).limit(1);
      if (conflict) {
        await tx.insert(toolScheduleLogs).values({ toolId, studentId, timeStart: start, timeEnd: end, type: 'REQUEST', description: 'REJECTED: this tool is already scheduled for that period.' });
        return { result: 'REJECTED' as const };
      }
      const [schedule] = await tx.insert(toolSchedules).values({ toolId, studentId, startTime: start, endTime: end, location, description: description?.trim() || null }).returning();
      await tx.insert(toolScheduleLogs).values({ toolId, studentId, scheduleId: schedule.id, timeStart: start, timeEnd: end, type: 'REQUEST', description: 'Automatically accepted; no schedule conflict.' });
      return schedule;
    });
  }

  schedules(toolId?: string) {
    return this.db.select({ id: toolSchedules.id, toolId: tools.id, toolName: tools.name, studentId: students.id, studentName: students.name, startTime: toolSchedules.startTime, endTime: toolSchedules.endTime, location: toolSchedules.location, description: toolSchedules.description })
      .from(toolSchedules).innerJoin(tools, eq(toolSchedules.toolId, tools.id)).innerJoin(students, eq(toolSchedules.studentId, students.id)).where(toolId ? eq(toolSchedules.toolId, toolId) : undefined).orderBy(asc(toolSchedules.startTime));
  }

  mySchedules(studentId: string) {
    return this.db.select({ id: toolSchedules.id, toolId: tools.id, toolName: tools.name, studentId: students.id, studentName: students.name, startTime: toolSchedules.startTime, endTime: toolSchedules.endTime, location: toolSchedules.location, description: toolSchedules.description })
      .from(toolSchedules).innerJoin(tools, eq(toolSchedules.toolId, tools.id)).innerJoin(students, eq(toolSchedules.studentId, students.id)).where(eq(toolSchedules.studentId, studentId)).orderBy(asc(toolSchedules.startTime));
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { labAttendanceLogs } from '../../database/schema/attendance.schema.js';
import { labs } from '../../database/schema/laboratory.schema.js';
import { students, lecturers, users } from '../../database/schema/identity.schema.js';
import { researches, researchSupervisors } from '../../database/schema/research.schema.js';
import { materialBorrowingLogs, toolBorrowingLogs } from '../../database/schema/borrowing.schema.js';
import { materials } from '../../database/schema/materials.schema.js';
import { tools } from '../../database/schema/equipment.schema.js';
import { toolSchedules } from '../../database/schema/scheduling.schema.js';
import { letterApplications } from '../../database/schema/persuratan.schema.js';

@Injectable()
export class AttendanceRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async options(userId: string, role: string) {
    const labRows = await this.db.select({ id: labs.id, name: labs.name, location: labs.location }).from(labs).orderBy(labs.name);
    const researchRows = role === 'STUDENT'
      ? await this.db.select({ id: researches.id, title: researches.title }).from(researches).where(eq(researches.studentId, userId)).orderBy(desc(researches.createdAt))
      : role === 'LECTURER'
        ? await this.db.select({ id: researches.id, title: researches.title }).from(researchSupervisors).innerJoin(researches, eq(researches.id, researchSupervisors.researchId)).where(eq(researchSupervisors.lecturerId, userId)).orderBy(desc(researches.createdAt))
        : [];
    const current = await this.current(userId, role);
    return { labs: labRows, researches: researchRows, current };
  }

  private async current(userId: string, role: string) {
    const owner = role === 'LECTURER' ? { lecturerId: userId } : { studentId: userId };
    const [last] = await this.db.select().from(labAttendanceLogs).where(role === 'LECTURER' ? eq(labAttendanceLogs.lecturerId, userId) : eq(labAttendanceLogs.studentId, userId)).orderBy(desc(labAttendanceLogs.recordedAt)).limit(1);
    if (!last || last.status !== 'ENTRY') return null;
    const [lab] = await this.db.select({ name: labs.name, location: labs.location }).from(labs).where(eq(labs.id, last.labId)).limit(1);
    const [research] = last.researchId ? await this.db.select({ title: researches.title }).from(researches).where(eq(researches.id, last.researchId)).limit(1) : [];
    return { ...last, ...owner, labName: lab?.name, location: lab?.location, researchTitle: research?.title ?? null };
  }

  async request(userId: string, role: string, labId: string, researchId?: string) {
    const [lab] = await this.db.select({ id: labs.id }).from(labs).where(eq(labs.id, labId)).limit(1);
    if (!lab) throw new NotFoundException('Laboratory not found.');
    const current = await this.current(userId, role);
    if (current) return { result: 'QR_REQUIRED' as const, type: 'EXIT' as const, labId: current.labId, researchId: current.researchId, qrPayload: JSON.stringify({ userId, labId: current.labId, type: 'EXIT' }) };
    if (researchId) {
      const valid = role === 'STUDENT'
        ? await this.db.select({ id: researches.id }).from(researches).where(and(eq(researches.id, researchId), eq(researches.studentId, userId))).limit(1)
        : role === 'LECTURER'
          ? await this.db.select({ id: researchSupervisors.researchId }).from(researchSupervisors).where(and(eq(researchSupervisors.researchId, researchId), eq(researchSupervisors.lecturerId, userId))).limit(1)
          : [];
      if (!valid.length) throw new ConflictException('Research is not associated with your account.');
    }
    return { result: 'QR_REQUIRED' as const, type: 'ENTRY' as const, labId, researchId: researchId ?? null, qrPayload: JSON.stringify({ userId, labId, type: 'ENTRY' }) };
  }

  async confirm(userId: string, role: string, dto: { labId: string; researchId?: string; type: 'ENTRY' | 'EXIT'; result: 'OK' | 'FAILED' }) {
    if (dto.result === 'FAILED') return { authenticated: false, changed: false };
    const active = await this.current(userId, role);
    if (dto.type === 'ENTRY' && active) throw new ConflictException('You are already checked in.');
    if (dto.type === 'EXIT' && (!active || active.labId !== dto.labId)) throw new ConflictException('No active attendance session found.');
    const [lab] = await this.db.select({ id: labs.id }).from(labs).where(eq(labs.id, dto.labId)).limit(1);
    if (!lab) throw new NotFoundException('Laboratory not found.');
    if (dto.type === 'ENTRY' && dto.researchId) {
      const valid = role === 'STUDENT'
        ? await this.db.select({ id: researches.id }).from(researches).where(and(eq(researches.id, dto.researchId), eq(researches.studentId, userId))).limit(1)
        : await this.db.select({ id: researchSupervisors.researchId }).from(researchSupervisors).where(and(eq(researchSupervisors.researchId, dto.researchId), eq(researchSupervisors.lecturerId, userId))).limit(1);
      if (!valid.length) throw new ConflictException('Research is not associated with your account.');
    }
    const [log] = await this.db.insert(labAttendanceLogs).values({ labId: dto.labId, studentId: role === 'STUDENT' ? userId : null, lecturerId: role === 'LECTURER' ? userId : null, researchId: dto.type === 'EXIT' ? active?.researchId ?? null : dto.researchId ?? null, status: dto.type }).returning();
    return { authenticated: true, changed: true, log };
  }

  async logs() {
    const rows = await this.db.select({ id: labAttendanceLogs.id, userId: users.id, name: students.name, lecturerName: lecturers.name, studentId: students.id, lecturerId: lecturers.id, nim: students.nim, nip: lecturers.nip, labName: labs.name, researchTitle: researches.title, status: labAttendanceLogs.status, recordedAt: labAttendanceLogs.recordedAt, activity: labAttendanceLogs.activity })
      .from(labAttendanceLogs).leftJoin(students, eq(students.id, labAttendanceLogs.studentId)).leftJoin(lecturers, eq(lecturers.id, labAttendanceLogs.lecturerId)).leftJoin(users, or(eq(users.id, labAttendanceLogs.studentId), eq(users.id, labAttendanceLogs.lecturerId))).leftJoin(labs, eq(labs.id, labAttendanceLogs.labId)).leftJoin(researches, eq(researches.id, labAttendanceLogs.researchId)).orderBy(desc(labAttendanceLogs.recordedAt));
    return rows.map(({ name, lecturerName, ...row }) => ({ ...row, userId: row.userId!, name: name ?? lecturerName, role: row.studentId ? 'STUDENT' : 'LECTURER' }));
  }

  async summary() {
    const logs = await this.logs();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const active = new Map<string, (typeof logs)[number]>();
    for (const log of logs) if (!active.has(log.userId)) active.set(log.userId, log);
    return { totalLogs: logs.length, entriesToday: logs.filter(log => log.status === 'ENTRY' && new Date(log.recordedAt) >= today).length, exitsToday: logs.filter(log => log.status === 'EXIT' && new Date(log.recordedAt) >= today).length, currentlyInLabs: [...active.values()].filter(log => log.status === 'ENTRY').length, recentLogs: logs.slice(0, 10) };
  }

  async recent(userId: string, role: string) {
    const logs = await this.logs();
    const activities: Array<{ id: string; type: string; title: string; detail: string; createdAt: Date }> = logs.filter(log => log.userId === userId).map(log => ({ id: log.id, type: 'ATTENDANCE', title: log.status === 'ENTRY' ? 'Masuk laboratorium' : 'Keluar laboratorium', detail: `${log.labName}${log.researchTitle ? ` · ${log.researchTitle}` : ''}`, createdAt: log.recordedAt }));
    if (role === 'STUDENT') {
      const [toolLogs, materialLogs, researchRows, schedules, letters] = await Promise.all([
        this.db.select({ id: toolBorrowingLogs.id, type: toolBorrowingLogs.type, status: toolBorrowingLogs.status, name: tools.name, time: toolBorrowingLogs.time }).from(toolBorrowingLogs).innerJoin(tools, eq(tools.id, toolBorrowingLogs.toolId)).where(eq(toolBorrowingLogs.studentId, userId)),
        this.db.select({ id: materialBorrowingLogs.id, name: materials.name, quantity: materialBorrowingLogs.quantity, approval: materialBorrowingLogs.approvalStatus, time: materialBorrowingLogs.time }).from(materialBorrowingLogs).innerJoin(materials, eq(materials.id, materialBorrowingLogs.materialId)).where(eq(materialBorrowingLogs.studentId, userId)),
        this.db.select({ id: researches.id, title: researches.title, status: researches.status, time: researches.createdAt }).from(researches).where(eq(researches.studentId, userId)),
        this.db.select({ id: toolSchedules.id, toolName: tools.name, startTime: toolSchedules.startTime, endTime: toolSchedules.endTime, time: toolSchedules.createdAt }).from(toolSchedules).innerJoin(tools, eq(tools.id, toolSchedules.toolId)).where(eq(toolSchedules.studentId, userId)),
        this.db.select({ id: letterApplications.id, type: letterApplications.type, status: letterApplications.status, time: letterApplications.createdAt }).from(letterApplications).where(eq(letterApplications.studentId, userId)),
      ]);
      activities.push(...toolLogs.map(row => ({ id: row.id, type: 'TOOL', title: row.type === 'BORROW' ? 'Peminjaman alat' : 'Pengembalian alat', detail: `${row.name} · ${row.status}`, createdAt: row.time })));
      activities.push(...materialLogs.map(row => ({ id: row.id, type: 'MATERIAL', title: 'Pengajuan peminjaman bahan', detail: `${row.name} · ${row.quantity} · ${row.approval}`, createdAt: row.time })));
      activities.push(...researchRows.map(row => ({ id: row.id, type: 'RESEARCH', title: 'Research', detail: `${row.title} · ${row.status}`, createdAt: row.time })));
      activities.push(...schedules.map(row => ({ id: row.id, type: 'SCHEDULE', title: 'Schedule alat', detail: `${row.toolName} · ${row.startTime.toLocaleString('id-ID')} – ${row.endTime.toLocaleString('id-ID')}`, createdAt: row.time })));
      activities.push(...letters.map(row => ({ id: row.id, type: 'LETTER', title: row.type === 'LAB_ACCESS' ? 'Pengajuan izin lab' : 'Pengajuan bebas lab', detail: row.status, createdAt: row.time })));
    } else if (role === 'LECTURER') {
      const supervised = await this.db.select({ id: researches.id, title: researches.title, status: researches.status, time: researches.updatedAt, createdAt: researches.createdAt }).from(researchSupervisors).innerJoin(researches, eq(researches.id, researchSupervisors.researchId)).where(eq(researchSupervisors.lecturerId, userId));
      activities.push(...supervised.map(row => ({ id: row.id, type: 'RESEARCH', title: 'Research bimbingan', detail: `${row.title} · ${row.status}`, createdAt: row.time ?? row.createdAt })));
    }
    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  }
}

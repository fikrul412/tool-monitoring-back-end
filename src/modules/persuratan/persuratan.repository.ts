import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { researches } from '../../database/schema/research.schema.js';
import { researchApplicationLogs } from '../../database/schema/research-application.schema.js';
import { letterApplications } from '../../database/schema/persuratan.schema.js';
import { students } from '../../database/schema/identity.schema.js';

@Injectable()
export class PersuratanRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

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
    return this.db.select({ id: letterApplications.id, researchId: researches.id, researchTitle: researches.title, researchStatus: researches.status, type: letterApplications.type, status: letterApplications.status, createdAt: letterApplications.createdAt, student: { id: students.id, name: students.name, nim: students.nim } })
      .from(letterApplications).innerJoin(researches, eq(letterApplications.researchId, researches.id))
      .innerJoin(students, eq(letterApplications.studentId, students.id))
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
      }
      return updated;
    });
  }
}

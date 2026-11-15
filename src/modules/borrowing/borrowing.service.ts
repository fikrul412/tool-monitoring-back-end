import { BadRequestException, Injectable } from '@nestjs/common';
import { BorrowingRepository } from './borrowing.repository.js';
import type { CreateMaterialRequestDto, CreateToolBorrowDto, CreateToolScheduleDto, ConfirmToolBorrowDto, ConfirmToolReturnDto, ReviewMaterialRequestDto } from './borrowing.dto.js';
import { QrService } from '../qr/qr.service.js';

@Injectable()
export class BorrowingService {
  constructor(private readonly repo: BorrowingRepository, private readonly qr: QrService) {}
  requestMaterial(studentId: string, dto: CreateMaterialRequestDto) { return this.repo.createMaterialRequest(studentId, dto.materialId, dto.quantity, dto.description); }
  myMaterialRequests(studentId: string) { return this.repo.myMaterialRequests(studentId); }
  pendingMaterialRequests() { return this.repo.pendingMaterialRequests(); }
  reviewMaterial(id: string, dto: ReviewMaterialRequestDto) { return this.repo.reviewMaterialRequest(id, dto.status, dto.comments); }
  async requestToolBorrow(studentId: string, dto: CreateToolBorrowDto) {
    const result = await this.repo.createToolBorrow(studentId, dto.toolId, dto.durationMinutes);
    if (result.result !== 'QR_REQUIRED') return result;
    const qr = await this.qr.issue(studentId, 'STUDENT', 'TOOL_BORROW', { toolId: dto.toolId, durationMinutes: dto.durationMinutes });
    return { ...result, qrPayload: qr.token, jti: qr.jti, expiresAt: qr.expiresAt };
  }
  async confirmBorrow(studentId: string, dto: ConfirmToolBorrowDto) {
    await this.qr.consumeVerification(dto.qrJti, studentId, 'TOOL_BORROW', { toolId: dto.toolId, durationMinutes: dto.durationMinutes });
    if (dto.result === 'FAILED') return { authenticated: false, changed: false };
    return this.repo.confirmToolBorrow(studentId, dto.toolId, dto.durationMinutes);
  }
  async requestReturn(studentId: string, toolId: string) {
    const result = await this.repo.createToolReturn(studentId, toolId);
    const qr = await this.qr.issue(studentId, 'STUDENT', 'TOOL_RETURN', { toolId });
    return { ...result, qrPayload: qr.token, jti: qr.jti, expiresAt: qr.expiresAt };
  }
  async confirmReturn(studentId: string, dto: ConfirmToolReturnDto) {
    await this.qr.consumeVerification(dto.qrJti, studentId, 'TOOL_RETURN', { toolId: dto.toolId });
    if (dto.result === 'FAILED') return { authenticated: false, changed: false };
    if (!dto.condition?.trim()) throw new BadRequestException('Returned equipment condition is required.');
    return this.repo.confirmToolReturn(studentId, dto.toolId, dto.condition, dto.notes);
  }
  myTools(studentId: string) { return this.repo.myTools(studentId); }
  schedules(toolId?: string) { return this.repo.schedules(toolId); }
  mySchedules(studentId: string) { return this.repo.mySchedules(studentId); }
  pendingSchedules() { return this.repo.pendingSchedules(); }
  reviewSchedule(id: string, decision: 'APPROVED' | 'REJECTED') { return this.repo.reviewSchedule(id, decision); }
  requestSchedule(studentId: string, dto: CreateToolScheduleDto) {
    const start = new Date(dto.startTime); const end = new Date(dto.endTime);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new BadRequestException('Valid schedule start and end times are required.');
    if (start <= new Date()) throw new BadRequestException('Schedule start time must be in the future.');
    return this.repo.createSchedule(studentId, dto.toolId, start, end, dto.description);
  }
}

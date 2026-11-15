import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { RuntimeRoleEnum } from '../../database/schema/enums.js';
import { Roles } from '../auth/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AttendanceRepository } from './attendance.repository.js';
import { AttendanceConfirmDto, AttendanceRequestDto } from './attendance.dto.js';
import { QrService } from '../qr/qr.service.js';

type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly repo: AttendanceRepository, private readonly qr: QrService) {}
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Get('options') options(@Req() req: AuthRequest) { return this.repo.options(req.user.sub, req.user.role); }
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Post('request') async request(@Req() req: AuthRequest, @Body() dto: AttendanceRequestDto) {
    const request = await this.repo.request(req.user.sub, req.user.role, dto.labId, dto.researchId);
    const qr = await this.qr.issue(req.user.sub, req.user.role, 'ATTENDANCE', {
      labId: request.labId,
      researchId: request.researchId ?? null,
      type: request.type,
    });
    return { ...request, qrPayload: qr.token, jti: qr.jti, expiresAt: qr.expiresAt };
  }
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Post('confirm') async confirm(@Req() req: AuthRequest, @Body() dto: AttendanceConfirmDto) {
    await this.qr.consumeVerification(dto.qrJti, req.user.sub, 'ATTENDANCE', {
      labId: dto.labId,
      researchId: dto.researchId ?? null,
      type: dto.type,
    });
    return this.repo.confirm(req.user.sub, req.user.role, dto);
  }
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Get('history') recent(@Req() req: AuthRequest) { return this.repo.recent(req.user.sub, req.user.role); }
  @Get('admin/logs') @Roles(RuntimeRoleEnum.Admin) logs() { return this.repo.logs(); }
  @Get('admin/summary') @Roles(RuntimeRoleEnum.Admin) summary() { return this.repo.summary(); }
}

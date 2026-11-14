import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { RuntimeRoleEnum } from '../../database/schema/enums.js';
import { Roles } from '../auth/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AttendanceRepository } from './attendance.repository.js';
import { AttendanceConfirmDto, AttendanceRequestDto } from './attendance.dto.js';

type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly repo: AttendanceRepository) {}
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Get('options') options(@Req() req: AuthRequest) { return this.repo.options(req.user.sub, req.user.role); }
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Post('request') request(@Req() req: AuthRequest, @Body() dto: AttendanceRequestDto) { return this.repo.request(req.user.sub, req.user.role, dto.labId, dto.researchId); }
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Post('confirm') confirm(@Req() req: AuthRequest, @Body() dto: AttendanceConfirmDto) { return this.repo.confirm(req.user.sub, req.user.role, dto); }
  @Roles(RuntimeRoleEnum.Student, RuntimeRoleEnum.Lecturer)
  @Get('history') recent(@Req() req: AuthRequest) { return this.repo.recent(req.user.sub, req.user.role); }
  @Get('admin/logs') @Roles(RuntimeRoleEnum.Admin) logs() { return this.repo.logs(); }
  @Get('admin/summary') @Roles(RuntimeRoleEnum.Admin) summary() { return this.repo.summary(); }
}

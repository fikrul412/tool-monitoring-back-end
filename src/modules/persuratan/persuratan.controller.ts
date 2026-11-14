import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { PersuratanService } from './persuratan.service.js';

interface AuthenticatedRequest extends Request { user: AuthenticatedUser }
@Controller('persuratan')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PersuratanController {
  constructor(private readonly service: PersuratanService) {}

  @Roles('STUDENT')
  @Get('eligible')
  eligible(@Req() req: AuthenticatedRequest) { return this.service.eligible(req.user.sub); }

  @Roles('STUDENT')
  @Get('archive')
  archive(@Req() req: AuthenticatedRequest) { return this.service.archive(req.user.sub); }

  @Roles('STUDENT')
  @Post('applications')
  apply(@Req() req: AuthenticatedRequest, @Body() body: { researchId: string; type: 'LAB_ACCESS' | 'LAB_CLEARANCE' }) {
    return this.service.apply(req.user.sub, body.researchId, body.type);
  }

  @Roles('ADMIN')
  @Get('admin/applications')
  adminApplications() { return this.service.adminApplications(); }

  @Roles('ADMIN')
  @Patch('admin/applications/:id/review')
  review(@Param('id', ParseUUIDPipe) id: string, @Body() body: { decision: 'RECEIVED' | 'REJECTED'; comments?: string }) {
    return this.service.review(id, body);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { BorrowingService } from './borrowing.service.js';
import { ConfirmToolBorrowDto, ConfirmToolReturnDto, CreateMaterialRequestDto, CreateToolBorrowDto, CreateToolScheduleDto, ReviewMaterialRequestDto } from './borrowing.dto.js';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('borrowing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorrowingController {
  constructor(private readonly service: BorrowingService) {}

  @Roles('STUDENT') @Post('materials') requestMaterial(@Req() req: AuthRequest, @Body() dto: CreateMaterialRequestDto) { return this.service.requestMaterial(req.user.sub, dto); }
  @Roles('STUDENT') @Get('materials/me') myMaterialRequests(@Req() req: AuthRequest) { return this.service.myMaterialRequests(req.user.sub); }
  @Roles('ADMIN') @Get('materials/pending') pendingMaterialRequests() { return this.service.pendingMaterialRequests(); }
  @Roles('ADMIN') @Post('materials/:id/review') reviewMaterial(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewMaterialRequestDto) { return this.service.reviewMaterial(id, dto); }

  @Roles('STUDENT') @Post('tools/borrow') requestToolBorrow(@Req() req: AuthRequest, @Body() dto: CreateToolBorrowDto) { return this.service.requestToolBorrow(req.user.sub, dto); }
  @Roles('STUDENT') @Post('tools/borrow/confirm') confirmBorrow(@Req() req: AuthRequest, @Body() dto: ConfirmToolBorrowDto) { return this.service.confirmBorrow(req.user.sub, dto); }
  @Roles('STUDENT') @Post('tools/:toolId/return') requestReturn(@Req() req: AuthRequest, @Param('toolId', ParseUUIDPipe) toolId: string) { return this.service.requestReturn(req.user.sub, toolId); }
  @Roles('STUDENT') @Post('tools/return/confirm') confirmReturn(@Req() req: AuthRequest, @Body() dto: ConfirmToolReturnDto) { return this.service.confirmReturn(req.user.sub, dto); }
  @Roles('STUDENT') @Get('tools/me') myTools(@Req() req: AuthRequest) { return this.service.myTools(req.user.sub); }

  @Roles('STUDENT') @Get('schedules') schedules(@Query('toolId') toolId?: string) { return this.service.schedules(toolId); }
  @Roles('STUDENT') @Get('schedules/me') mySchedules(@Req() req: AuthRequest) { return this.service.mySchedules(req.user.sub); }
  @Roles('STUDENT') @Post('schedules') requestSchedule(@Req() req: AuthRequest, @Body() dto: CreateToolScheduleDto) { return this.service.requestSchedule(req.user.sub, dto); }
}

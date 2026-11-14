import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { CreateWasteOptionDto } from './waste.dto.js';
import { WasteService } from './waste.service.js';

type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('waste')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WasteController {
  constructor(private readonly service: WasteService) {}
  @Roles('STUDENT', 'ADMIN') @Get('options') options() { return this.service.options(); }
  @Roles('STUDENT', 'ADMIN') @Post('options') createOption(@Req() req: AuthRequest, @Body() dto: CreateWasteOptionDto) { return this.service.createOption(req.user.sub, dto.type, dto.value); }
  @Roles('ADMIN') @Get('admin/records') records() { return this.service.records(); }
  @Roles('ADMIN') @Delete('admin/options/:id') deactivateOption(@Param('id', ParseUUIDPipe) id: string) { return this.service.deactivateOption(id); }
}

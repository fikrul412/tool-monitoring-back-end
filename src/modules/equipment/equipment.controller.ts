
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { RuntimeRoleEnum } from '../../database/schema/enums.js';

import { Roles } from '../auth/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

import { EquipmentService } from './equipment.service.js';

import {
  CreateToolCategoryDto,
  CreateToolDto,
  GetToolsQueryDto,
  UpdateToolDto,
} from './dto/equipment.dto.js';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('equipment')
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(
    private readonly equipmentService: EquipmentService,
  ) {}

  // Categories

  @Get('categories')
  getCategories() {
    return this.equipmentService.getCategories();
  }

  @Post('categories')
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(RolesGuard)
  createCategory(
    @Body() dto: CreateToolCategoryDto,
  ) {
    return this.equipmentService.createCategory(dto);
  }

  // Equipment

  @Get()
  getTools(@Query() query: GetToolsQueryDto) {
    return this.equipmentService.getTools(query);
  }

  @Get(':id')
  getToolById(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.equipmentService.getToolById(id);
  }

  @Post()
  createTool(
    @Body() dto: CreateToolDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipmentService.createTool(
      dto,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id')
  updateTool(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateToolDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipmentService.updateTool(
      id,
      dto,
      req.user.sub,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(RolesGuard)
  deleteTool(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.equipmentService.deleteTool(id);
  }
}

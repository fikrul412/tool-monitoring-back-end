import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import { JwtAuthGuard } from "../../guards/jwt-auth.guard.js";
import { RolesGuard } from "../../guards/roles.guard.js";
import { RuntimeRoleEnum } from "../../database/schema/enums.js";
import { Roles } from "../auth/roles.decorator.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

import { LaboratoryService } from "./laboratory.service.js";
import {
  AssignLabManagerDto,
  CreateLabDto,
  GetLabsQueryDto,
  UpdateLabDto,
} from "./dto/laboratory.dto.js";

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller("laboratories")
export class LaboratoryController {
  constructor(private readonly labService: LaboratoryService) {}

  // List all labs (accessible to all logged-in users: Students, Lecturers, Admins)
  @Get()
  @UseGuards(JwtAuthGuard)
  getLabs(@Query() query: GetLabsQueryDto) {
    return this.labService.getLabs(query);
  }

  // Get single lab details
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  getLabById(@Param("id") id: string) {
    return this.labService.getLabById(id);
  }

  // Create laboratory (Admin only)
  @Post()
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createLab(@Body() dto: CreateLabDto) {
    return this.labService.createLab(dto);
  }

  // Update laboratory (Admin or Lab Manager)
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  updateLab(
    @Param("id") id: string,
    @Body() dto: UpdateLabDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.labService.updateLab(id, dto, req.user.sub, req.user.role);
  }

  // Delete laboratory (Admin only)
  @Delete(":id")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteLab(@Param("id") id: string) {
    return this.labService.deleteLab(id);
  }

  // Assign lab manager (Admin only)
  @Post(":id/managers")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  assignManager(
    @Param("id") labId: string,
    @Body() dto: AssignLabManagerDto,
  ) {
    return this.labService.assignManager(labId, dto);
  }

  // Remove lab manager (Admin only)
  @Delete(":id/managers/:userId")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  removeManager(
    @Param("id") labId: string,
    @Param("userId") userId: string,
  ) {
    return this.labService.removeManager(labId, userId);
  }
}

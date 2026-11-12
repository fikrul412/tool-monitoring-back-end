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

import { MaterialsService } from "./materials.service.js";
import {
  CreateMaterialDto,
  GetMaterialsQueryDto,
  UpdateMaterialDto,
} from "./dto/materials.dto.js";

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller("materials")
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getMaterials(@Query() query: GetMaterialsQueryDto) {
    return this.materialsService.getMaterials(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  getMaterialById(@Param("id") id: string) {
    return this.materialsService.getMaterialById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createMaterial(
    @Body() dto: CreateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.createMaterial(dto, req.user.sub, req.user.role);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  updateMaterial(
    @Param("id") id: string,
    @Body() dto: UpdateMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.materialsService.updateMaterial(id, dto, req.user.sub, req.user.role);
  }

  @Delete(":id")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteMaterial(@Param("id") id: string) {
    return this.materialsService.deleteMaterial(id);
  }
}

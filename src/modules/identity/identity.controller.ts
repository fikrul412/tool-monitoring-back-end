
import {
  Body,
  Controller,
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

import { IdentityService } from "./identity.service.js";
import {
  CreateManagedUserDto,
  GetUsersQueryDto,
  UpdateUserStatusDto,
  GetLecturersQueryDto
} from "./dto/identity.dto.js";

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller("identity")
export class IdentityController {
  constructor(
    private readonly identityService: IdentityService,
  ) { }

  // STUDENT ROUTES

  @Get("important")
  @Roles(RuntimeRoleEnum.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getImportantResource() {
    return '<a href="https://www.youtube.com/watch?v=vudHjYNy0Ic">Important!!!</a>';
  }

  // AUTHENTICATED USER ROUTES

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.identityService.getMe(req.user.sub);
  }
  // ADMIN: USER MANAGEMENT
  @Get("admin/users")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.identityService.getUsers(query);
  }

  @Get("admin/users/:id")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getUserById(@Param("id") id: string) {
    return this.identityService.getUserById(id);
  }

  @Post("admin/users")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createUser(@Body() dto: CreateManagedUserDto) {
    return this.identityService.createManagedUser(dto);
  }


  @Patch("admin/users/:id/status")
  @Roles(RuntimeRoleEnum.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateUserStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.identityService.updateUserStatus(
      id,
      dto.status,
    );
  }
  @Get('lecturers')
  @UseGuards(JwtAuthGuard)
  getLecturers(@Query() query: GetLecturersQueryDto) {
    return this.identityService.getLecturers(query);
  }
}

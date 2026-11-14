
import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Req,
    UseGuards,
    Post,
    Body,
    Query,
    Patch
} from "@nestjs/common";
import { ResearchQueryDto } from "./dto/research-query.dto.js";
import type { Request } from "express";
import { ReviewResearchDto } from "./dto/review-research.dto.js";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard.js";
import { RolesGuard } from "../../guards/roles.guard.js";

import { Roles } from "../auth/roles.decorator.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";
import { CreateResearchDto } from "./dto/create-research.dto.js";
import { ResearchService } from "./research.service.js";
import { UpdateResearchDto } from "./dto/update-research.dto.js";
import { UpdateResearchStatusDto } from "./dto/update-research-status.dto.js";
interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

@Controller("research")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResearchController {
    constructor(
        private readonly researchService: ResearchService,
    ) { }
    @Get("admin")
    @Roles("ADMIN")
    getAllResearch(@Query() query: ResearchQueryDto) {
    return this.researchService.getAllResearch(
        query.page ?? 1,
        query.limit ?? 10,
        {
        search: query.search,
        status: query.status,
        },
    );
    }
    // ==========================================
    // GET RESEARCH DETAIL
    // ==========================================


    @Patch(":id/review")
    @Roles("ADMIN")
    async reviewResearch(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() data: ReviewResearchDto,
    ) {
        return this.researchService.reviewResearch(
            id,
            data,
        );
    }

    @Patch(":id/status")
    @Roles("ADMIN")
    async updateResearchStatus(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() data: UpdateResearchStatusDto,
    ) {
        return this.researchService.updateResearchStatus(id, data);
    }

    @Post(":id/complete")
    @Roles("STUDENT")
    async requestResearchCompletion(
        @Param("id", ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.researchService.requestCompletion(id, req.user.sub);
    }

    @Post()
    @Roles("STUDENT")
    async createResearch(
        @Body() data: CreateResearchDto,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.researchService.createResearch(
            req.user.sub,
            data,
        );
    }
    @Get("me")
    @Roles("STUDENT")
    async getMyResearch(
        @Req() req: AuthenticatedRequest,
        @Query() query: ResearchQueryDto,
    ) {
        return this.researchService.getMyResearch(
            req.user.sub,
            query.page ?? 1,
            query.limit ?? 10,
            { search: query.search, status: query.status },
        );
    }

    @Get(":id")
    @Roles("STUDENT", "ADMIN")
    async getResearchById(
        @Param("id", ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        const user = req.user;

        if (user.role === "ADMIN") {
            return this.researchService.getResearchById(id);
        }

        return this.researchService.getStudentResearchById(
            id,
            user.sub,
        );
    }

    @Get(":id/logs")
    @Roles("STUDENT", "ADMIN")
    async getResearchLogs(
        @Param("id", ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        const user = req.user;

        if (user.role === "ADMIN") {
            return this.researchService.getResearchLogs(id);
        }

        return this.researchService.getStudentResearchLogs(
            id,
            user.sub,
        );
    }

    @Patch(":id")
    @Roles("STUDENT")
    async updateResearch(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() data: UpdateResearchDto,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.researchService.updateResearch(
            id,
            req.user.sub,
            data,
        );
    }

}

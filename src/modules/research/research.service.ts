import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException
} from "@nestjs/common";
import type { UpdateResearchDto } from "./dto/update-research.dto.js";
import { ResearchRepository } from "../../repositories/research.repository.js";
import type { CreateResearchDto } from "./dto/create-research.dto.js";
import type { ReviewResearchDto } from "./dto/review-research.dto.js";
@Injectable()
export class ResearchService {
  constructor(
    private readonly researchRepository: ResearchRepository,
  ) { }

  async updateResearch(
    researchId: string,
    studentId: string,
    data: UpdateResearchDto,
  ) {
    // Validate date range
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      throw new BadRequestException(
        "End date cannot precede start date.",
      );
    }

    const result = await this.researchRepository.update(
      researchId,
      studentId,
      data,
    );

    switch (result.outcome) {
      case "NOT_FOUND":
        throw new NotFoundException("Research not found.");

      case "NOT_EDITABLE":
        throw new ConflictException(
          "Only pending research applications can be edited.",
        );

      case "INVALID_SUPERVISORS":
        throw new BadRequestException(
          "One or more supervisors do not exist or are inactive.",
        );

      case "INVALID_LABS":
        throw new BadRequestException(
          "One or more laboratories do not exist.",
        );

      case "INVALID_TOOLS":
        throw new BadRequestException(
          "One or more equipment items are unavailable or do not exist.",
        );

      case "INVALID_MATERIALS":
        throw new BadRequestException(
          "One or more selected materials are unavailable or do not exist.",
        );

      case "SUCCESS":
        return result.research;
    }
  }

  async reviewResearch(
    researchId: string,
    data: ReviewResearchDto,
  ) {
    const result = await this.researchRepository.review(
      researchId,
      data,
    );

    if (result.outcome === "NOT_FOUND") {
      throw new NotFoundException("Research not found.");
    }

    if (result.outcome === "ALREADY_REVIEWED") {
      throw new ConflictException(
        "This research application has already been reviewed.",
      );
    }

    return result.research;
  }

  async updateResearchStatus(
    researchId: string,
    data: { status: "ONGOING" | "CANCELLED"; comments?: string },
  ) {
    const result = await this.researchRepository.updateStatus(researchId, data);
    if (result.outcome === "NOT_FOUND") throw new NotFoundException("Research not found.");
    if (result.outcome === "INVALID_TRANSITION") throw new ConflictException("This research cannot move to that status.");
    return result.research;
  }

  async createResearch(
    studentId: string,
    data: CreateResearchDto,
  ) {
    // Validate research period
    if (
      data.startDate &&
      data.endDate &&
      data.endDate < data.startDate
    ) {
      throw new BadRequestException(
        "End date cannot precede start date.",
      );
    }

    // Validate supervisors
    const activeLecturerIds =
      await this.researchRepository.findActiveLecturerIds(
        data.supervisorIds,
      );

    if (activeLecturerIds.length !== data.supervisorIds.length) {
      throw new BadRequestException(
        "One or more selected supervisors do not exist or are inactive.",
      );
    }

    // Validate laboratories
    const existingLabIds =
      await this.researchRepository.findExistingLabIds(
        data.labIds,
      );

    if (existingLabIds.length !== data.labIds.length) {
      throw new BadRequestException(
        "One or more selected laboratories do not exist.",
      );
    }

    // Validate equipment
    const toolIds = data.toolIds ?? [];

    const availableToolIds =
      await this.researchRepository.findAvailableToolIds(
        toolIds,
      );

    if (availableToolIds.length !== toolIds.length) {
      throw new BadRequestException(
        "One or more selected equipment items are unavailable or do not exist.",
      );
    }

    const materialIds = data.materialIds ?? [];
    const availableMaterialIds =
      await this.researchRepository.findAvailableMaterialIds(materialIds);
    if (availableMaterialIds.length !== materialIds.length) {
      throw new BadRequestException(
        "One or more selected materials are unavailable or do not exist.",
      );
    }

    return this.researchRepository.create(studentId, data);
  }

  // ==========================================
  // RESEARCH DETAIL
  // ==========================================
  async getAllResearch(
    page: number,
    limit: number,
    filters?: {
      search?: string;
      status?: "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "COMPLETION_REQUESTED" | "COMPLETED" | "ARCHIVED" | "CANCELLED";
    },
  ) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 10));

    return this.researchRepository.findAll(
      safePage,
      safeLimit,
      filters,
    );
  }
  async getMyResearch(
    studentId: string,
    page = 1,
    limit = 10,
    filters?: { search?: string; status?: "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "COMPLETION_REQUESTED" | "COMPLETED" | "ARCHIVED" | "CANCELLED" },
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    return this.researchRepository.findByStudent(
      studentId,
      safePage,
      safeLimit,
      filters,
    );
  }

  async getResearchById(researchId: string) {
    const research =
      await this.researchRepository.findById(researchId);

    if (!research) {
      throw new NotFoundException("Research not found.");
    }

    return research;
  }

  async getStudentResearchById(
    researchId: string,
    studentId: string,
  ) {
    const research =
      await this.researchRepository.findByIdAndStudent(
        researchId,
        studentId,
      );

    if (!research) {
      throw new NotFoundException("Research not found.");
    }

    return research;
  }

  // ==========================================
  // APPLICATION LOGS
  // ==========================================

  async getResearchLogs(researchId: string) {
    const research =
      await this.researchRepository.findById(researchId);

    if (!research) {
      throw new NotFoundException("Research not found.");
    }

    return this.researchRepository.findLogsByResearchId(
      researchId,
    );
  }

  async getStudentResearchLogs(
    researchId: string,
    studentId: string,
  ) {
    const research =
      await this.researchRepository.findByIdAndStudent(
        researchId,
        studentId,
      );

    if (!research) {
      throw new NotFoundException("Research not found.");
    }

    return this.researchRepository.findLogsByResearchId(
      researchId,
    );
  }
}

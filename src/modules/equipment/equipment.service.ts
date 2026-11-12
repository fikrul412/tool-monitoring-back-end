import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EquipmentRepository } from "../../repositories/equipment.repository.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";

import {
  CreateToolCategoryDto,
  CreateToolDto,
  GetToolsQueryDto,
  UpdateToolDto,
} from "./dto/equipment.dto.js";

import { RuntimeRoleEnum } from "../../database/schema/enums.js";

@Injectable()
export class EquipmentService {
  constructor(
    private readonly equipmentRepository: EquipmentRepository,
    private readonly labRepository: LaboratoryRepository,
    private readonly identityRepository: IdentityRepository,
  ) {}

  async getTools(query: GetToolsQueryDto) {
    const { data, total } = await this.equipmentRepository.findAllTools({
      search: query.search,
      ownerType: query.ownerType,
      labId: query.labId,
      lecturerId: query.lecturerId,
      assignedLabId: query.assignedLabId,
      categoryId: query.categoryId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getToolById(id: string) {
    const tool = await this.equipmentRepository.findToolById(id);

    if (!tool) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return tool;
  }

  async createTool(dto: CreateToolDto, userId: string, userRole: string) {
    if (dto.ownerType === "LAB") {
      if (!dto.labId) {
        throw new BadRequestException(
          "labId is required when ownerType is LAB",
        );
      }

      if (dto.lecturerId || dto.assignedLabId) {
        throw new BadRequestException(
          "lecturerId and assignedLabId must not be provided for LAB-owned equipment",
        );
      }

      const lab = await this.labRepository.findLabById(dto.labId);

      if (!lab) {
        throw new NotFoundException(
          `Laboratory with ID ${dto.labId} not found`,
        );
      }

      if (userRole !== RuntimeRoleEnum.Admin) {
        const isManager = await this.labRepository.isManager(
          dto.labId,
          userId,
        );

        if (!isManager) {
          throw new ForbiddenException(
            "Only Admin or assigned Lab Managers can add equipment to this lab",
          );
        }
      }
    } else {
      if (!dto.lecturerId) {
        throw new BadRequestException(
          "lecturerId is required when ownerType is LECTURER",
        );
      }

      if (!dto.assignedLabId) {
        throw new BadRequestException(
          "assignedLabId is required for lecturer-owned equipment",
        );
      }

      if (dto.labId) {
        throw new BadRequestException(
          "labId must not be provided for lecturer-owned equipment",
        );
      }

      const lecturer = await this.identityRepository.findLecturerByUserId(
        dto.lecturerId,
      );

      if (!lecturer) {
        throw new NotFoundException(
          `Lecturer with ID ${dto.lecturerId} not found`,
        );
      }

      const assignedLab = await this.labRepository.findLabById(
        dto.assignedLabId,
      );

      if (!assignedLab) {
        throw new NotFoundException(
          `Assigned laboratory with ID ${dto.assignedLabId} not found`,
        );
      }

      if (
        userRole === RuntimeRoleEnum.Lecturer &&
        dto.lecturerId !== userId
      ) {
        throw new ForbiddenException(
          "Lecturers can only register equipment under their own ownership",
        );
      }
    }

    return this.equipmentRepository.createTool({
      ownerType: dto.ownerType,
      labId: dto.labId ?? null,
      lecturerId: dto.lecturerId ?? null,
      assignedLabId: dto.assignedLabId ?? null,
      categoryId: dto.categoryId ?? null,
      name: dto.name,
      inventoryCode: dto.inventoryCode ?? null,
      status: dto.status ?? "AVAILABLE",
      description: dto.description ?? null,
    });
  }

  async updateTool(
    id: string,
    dto: UpdateToolDto,
    userId: string,
    userRole: string,
  ) {
    const existing = await this.equipmentRepository.findToolById(id);

    if (!existing) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    if (userRole !== RuntimeRoleEnum.Admin) {
      if (existing.ownerType === "LAB" && existing.labId) {
        const isManager = await this.labRepository.isManager(
          existing.labId,
          userId,
        );

        if (!isManager) {
          throw new ForbiddenException(
            "Only Admin or assigned Lab Managers can update lab equipment",
          );
        }
      } else if (existing.ownerType === "LECTURER") {
        if (existing.lecturerId !== userId) {
          throw new ForbiddenException(
            "You can only update your own lecturer equipment",
          );
        }
      }
    }

    if (dto.assignedLabId !== undefined) {
      if (existing.ownerType !== "LECTURER") {
        throw new BadRequestException(
          "Only lecturer-owned equipment can have an assigned laboratory",
        );
      }

      const targetLab = await this.labRepository.findLabById(
        dto.assignedLabId,
      );

      if (!targetLab) {
        throw new NotFoundException(
          `Assigned laboratory with ID ${dto.assignedLabId} not found`,
        );
      }
    }

    const updated = await this.equipmentRepository.updateTool(id, {
      ...(dto.assignedLabId !== undefined
        ? { assignedLabId: dto.assignedLabId }
        : {}),
      ...(dto.categoryId !== undefined
        ? { categoryId: dto.categoryId }
        : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.inventoryCode !== undefined
        ? { inventoryCode: dto.inventoryCode }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
    });

    return updated;
  }

  async deleteTool(id: string) {
    const existing = await this.equipmentRepository.findToolById(id);

    if (!existing) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    const success = await this.equipmentRepository.deleteTool(id);

    return {
      success,
      message: "Equipment deleted successfully",
    };
  }

  async getCategories() {
    return this.equipmentRepository.findAllCategories();
  }

  async createCategory(dto: CreateToolCategoryDto) {
    try {
      return await this.equipmentRepository.createCategory({
        name: dto.name,
        description: dto.description ?? null,
      });
    } catch {
      throw new BadRequestException(
        "Category with this name already exists",
      );
    }
  }
}
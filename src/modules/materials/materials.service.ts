import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MaterialsRepository } from "../../repositories/materials.repository.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";
import {
  CreateMaterialDto,
  GetMaterialsQueryDto,
  UpdateMaterialDto,
} from "./dto/materials.dto.js";
import { RuntimeRoleEnum } from "../../database/schema/enums.js";

@Injectable()
export class MaterialsService {
  constructor(
    private readonly materialsRepository: MaterialsRepository,
    private readonly labRepository: LaboratoryRepository,
    private readonly identityRepository: IdentityRepository,
  ) {}

  async getMaterials(query: GetMaterialsQueryDto) {
    const { data, total } = await this.materialsRepository.findAllMaterials({
      search: query.search,
      ownerType: query.ownerType,
      labId: query.labId,
      lecturerId: query.lecturerId,
      page: query.page,
      limit: query.limit,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getMaterialById(id: string) {
    const material = await this.materialsRepository.findMaterialById(id);
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    return material;
  }

  async createMaterial(
    dto: CreateMaterialDto,
    userId: string,
    userRole: string,
  ) {
    // Validate owner constraints: LAB vs LECTURER
    if (dto.ownerType === "LAB") {
      if (!dto.labId) {
        throw new BadRequestException("labId is required when ownerType is LAB");
      }
      if (dto.lecturerId) {
        throw new BadRequestException("lecturerId must be null when ownerType is LAB");
      }

      const lab = await this.labRepository.findLabById(dto.labId);
      if (!lab) {
        throw new NotFoundException(`Laboratory with ID ${dto.labId} not found`);
      }

      // Check permission
      if (userRole !== RuntimeRoleEnum.Admin) {
        const isManager = await this.labRepository.isManager(dto.labId, userId);
        if (!isManager) {
          throw new ForbiddenException("Only Admin or assigned Lab Managers can add materials to this lab");
        }
      }
    } else if (dto.ownerType === "LECTURER") {
      if (!dto.lecturerId) {
        throw new BadRequestException("lecturerId must be provided when ownerType is LECTURER");
      }
      if (dto.labId) {
        throw new BadRequestException("labId must be null when ownerType is LECTURER");
      }

      const lecturer = await this.identityRepository.findLecturerByUserId(dto.lecturerId);
      if (!lecturer) {
        throw new NotFoundException(`Lecturer with ID ${dto.lecturerId} not found`);
      }

      // If user is lecturer, they can only register materials under their own lecturerId
      if (userRole === RuntimeRoleEnum.Lecturer && dto.lecturerId !== userId) {
        throw new ForbiddenException("Lecturers can only register materials under their own ownership");
      }
    }

    return this.materialsRepository.createMaterial({
      name: dto.name,
      description: dto.description ?? null,
      ownerType: dto.ownerType,
      labId: dto.labId ?? null,
      lecturerId: dto.lecturerId ?? null,
      unit: dto.unit,
      isAvailable: dto.isAvailable ?? true,
    });
  }

  async updateMaterial(
    id: string,
    dto: UpdateMaterialDto,
    userId: string,
    userRole: string,
  ) {
    const existing = await this.materialsRepository.findMaterialById(id);
    if (!existing) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    // Permission check
    if (userRole !== RuntimeRoleEnum.Admin) {
      if (existing.ownerType === "LAB" && existing.labId) {
        const isManager = await this.labRepository.isManager(existing.labId, userId);
        if (!isManager) {
          throw new ForbiddenException("Only Admin or assigned Lab Managers can update lab materials");
        }
      } else if (existing.ownerType === "LECTURER") {
        if (existing.lecturerId !== userId) {
          throw new ForbiddenException("You can only update your own lecturer materials");
        }
      }
    }

    const updated = await this.materialsRepository.updateMaterial(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
      ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
      ...(dto.ownerType !== undefined ? { ownerType: dto.ownerType } : {}),
      ...(dto.labId !== undefined ? { labId: dto.labId } : {}),
      ...(dto.lecturerId !== undefined ? { lecturerId: dto.lecturerId } : {}),
    });

    return updated;
  }

  async deleteMaterial(id: string) {
    const existing = await this.materialsRepository.findMaterialById(id);
    if (!existing) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    const success = await this.materialsRepository.deleteMaterial(id);
    return { success, message: "Material deleted successfully" };
  }
}

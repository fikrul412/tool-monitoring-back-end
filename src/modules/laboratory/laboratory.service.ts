import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";
import {
  AssignLabManagerDto,
  CreateLabDto,
  GetLabsQueryDto,
  UpdateLabDto,
} from "./dto/laboratory.dto.js";
import { RuntimeRoleEnum } from "../../database/schema/enums.js";

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly labRepository: LaboratoryRepository,
    private readonly identityRepository: IdentityRepository,
  ) {}

  async getLabs(query: GetLabsQueryDto) {
    const { data, total } = await this.labRepository.findAllLabs({
      search: query.search,
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

  async getLabById(id: string) {
    const lab = await this.labRepository.findLabById(id);
    if (!lab) {
      throw new NotFoundException(`Laboratory with ID ${id} not found`);
    }
    return lab;
  }

  async createLab(dto: CreateLabDto) {
    return this.labRepository.createLab({
      name: dto.name,
      description: dto.description ?? null,
      location: dto.location ?? null,
    });
  }

  async updateLab(id: string, dto: UpdateLabDto, userId: string, userRole: string) {
    const lab = await this.labRepository.findLabById(id);
    if (!lab) {
      throw new NotFoundException(`Laboratory with ID ${id} not found`);
    }

    // Only Admin or an assigned Lab Manager can update
    if (userRole !== RuntimeRoleEnum.Admin) {
      const isManager = await this.labRepository.isManager(id, userId);
      if (!isManager) {
        throw new ForbiddenException("You are not authorized to update this laboratory");
      }
    }

    const updated = await this.labRepository.updateLab(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
    });

    return updated;
  }

  async deleteLab(id: string) {
    const lab = await this.labRepository.findLabById(id);
    if (!lab) {
      throw new NotFoundException(`Laboratory with ID ${id} not found`);
    }

    const success = await this.labRepository.deleteLab(id);
    return { success, message: "Laboratory deleted successfully" };
  }

  async assignManager(labId: string, dto: AssignLabManagerDto) {
    const lab = await this.labRepository.findLabById(labId);
    if (!lab) {
      throw new NotFoundException(`Laboratory with ID ${labId} not found`);
    }

    const user = await this.identityRepository.findUserById(dto.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    if (user.role !== RuntimeRoleEnum.Lecturer && user.role !== RuntimeRoleEnum.Admin) {
      throw new BadRequestException("Only lecturers or admins can be assigned as lab managers");
    }

    const assigned = await this.labRepository.assignManager(labId, dto.userId);
    if (!assigned) {
      return { message: "User is already assigned as a manager for this laboratory" };
    }

    return { message: "Manager assigned successfully", data: assigned };
  }

  async removeManager(labId: string, userId: string) {
    const lab = await this.labRepository.findLabById(labId);
    if (!lab) {
      throw new NotFoundException(`Laboratory with ID ${labId} not found`);
    }

    const removed = await this.labRepository.removeManager(labId, userId);
    if (!removed) {
      throw new NotFoundException("Manager assignment not found");
    }

    return { success: true, message: "Manager removed successfully" };
  }
}


import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { IdentityRepository } from "../../repositories/identity.repository.js";
import { PasswordHashService } from "../auth/services/passwordhash.service.js";

import {
  CreateManagedUserDto,
  GetUsersQueryDto,
  GetLecturersQueryDto
} from "./dto/identity.dto.js";

@Injectable()
export class IdentityService {
  constructor(
    private readonly identityRepository: IdentityRepository,
    private readonly passwordHashService: PasswordHashService,
  ) { }

  // AUTHENTICATED USER
  async getMe(userId: string) {
    const user =
      await this.identityRepository.findUserWithProfileById(userId);

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  async getStudentPublicProfile(studentId: string) {
    const profile = await this.identityRepository.findStudentPublicProfile(studentId);
    if (!profile) throw new NotFoundException('Student not found.');
    return profile;
  }

  async updateMyProfile(userId: string, role: string, dto: { name: string; whatsapp?: string | null; nim?: string | null; studyProgram?: string | null; address?: string | null }) {
    if (role !== 'STUDENT' && role !== 'LECTURER') throw new ConflictException('Only students and lecturers can edit their profile.');
    const name = dto.name?.trim();
    const whatsapp = dto.whatsapp?.trim() || null;
    if (!name) throw new ConflictException('Name is required.');
    const nim = dto.nim?.trim() || null;
    if (role === 'STUDENT' && nim) {
      const existing = await this.identityRepository.findStudentByNim(nim);
      if (existing && existing.id !== userId) throw new ConflictException('NIM already exists.');
    }
    const profile = await this.identityRepository.updateOwnProfile(userId, role, { name, whatsapp, ...(role === 'STUDENT' ? { ...(dto.nim !== undefined ? { nim } : {}), studyProgram: dto.studyProgram ?? null, address: dto.address ?? null } : {}) });
    if (!profile) throw new NotFoundException('Profile not found.');
    return this.getMe(userId);
  }

  // ADMIN: USER MANAGEMENT
  async getUsers(query: GetUsersQueryDto) {
    return this.identityRepository.findUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      status: query.status,
    });
  }
  async getUserById(userId: string) {
    const user =
      await this.identityRepository.findUserWithProfileById(userId);

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  async createManagedUser(dto: CreateManagedUserDto) {
    const existingEmail =
      await this.identityRepository.findUserByEmail(dto.email);

    if (existingEmail) {
      throw new ConflictException("Email is already registered.");
    }

    // Check student NIM uniqueness
    if (dto.role === "STUDENT" && dto.nim) {
      const existingStudent =
        await this.identityRepository.findStudentByNim(dto.nim);

      if (existingStudent) {
        throw new ConflictException("NIM is already registered.");
      }
    }

    // Check lecturer NIP uniqueness
    if (dto.role === "LECTURER" && dto.nip) {
      const existingLecturer =
        await this.identityRepository.findLecturerByNip(dto.nip);

      if (existingLecturer) {
        throw new ConflictException("NIP is already registered.");
      }
    }

    // Hash password before storing it
    const passwordHash =
      await this.passwordHashService.hash(dto.password);

    // Create user and associated profile
    const user = await this.identityRepository.createManagedUser({
      email: dto.email,
      passwordHash,
      role: dto.role,
      name: dto.name,
      nim: dto.nim,
      nip: dto.nip,
      whatsapp: dto.whatsapp,
    });

    // Return user with normalized profile
    return this.getUserById(user.id);
  }

  // PATCH /identity/admin/users/:id/status

  async updateUserStatus(
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ) {
    const user =
      await this.identityRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    await this.identityRepository.updateUser(userId, {
      status,
    });

    return this.getUserById(userId);
  }
  async getLecturers(query: GetLecturersQueryDto) {
    return this.identityRepository.searchLecturers(
      query.search?.trim(),
      query.limit ?? 10,
    );
  }
}

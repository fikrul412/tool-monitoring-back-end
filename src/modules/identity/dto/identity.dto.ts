import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Max,
  ValidateIf,
  IsNotEmpty,
} from "class-validator";

import { RuntimeRoleEnum } from "../../../database/schema/enums.js";

// Create managed user
export class CreateManagedUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(RuntimeRoleEnum)
  role: RuntimeRoleEnum;

  @ValidateIf((o: CreateManagedUserDto) =>
    o.role === RuntimeRoleEnum.Student ||
    o.role === RuntimeRoleEnum.Lecturer
  )
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((o: CreateManagedUserDto) => o.role === RuntimeRoleEnum.Student)
  @IsString()
  @IsNotEmpty()
  nim?: string;

  @ValidateIf((o: CreateManagedUserDto) => o.role === RuntimeRoleEnum.Lecturer)
  @IsString()
  @IsNotEmpty()
  nip?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}

// Get users with pagination and filters
export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RuntimeRoleEnum)
  role?: RuntimeRoleEnum;

  @IsOptional()
  @IsIn(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"])
  status?: string;
}

// Update user status
export class UpdateUserStatusDto {
  @IsIn(["ACTIVE", "SUSPENDED"])
  status: "ACTIVE" | "SUSPENDED";
}

export class UpdateOwnProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  @IsOptional() @IsString() @MaxLength(30) nim?: string | null;

  @IsOptional() @IsString() studyProgram?: string | null;
  @IsOptional() @IsString() address?: string | null;
}

export class GetLecturersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}

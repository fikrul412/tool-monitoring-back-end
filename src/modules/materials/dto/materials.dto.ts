import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export const MATERIAL_OWNER_TYPES = ["LAB", "LECTURER"] as const;
export type MaterialOwnerType = (typeof MATERIAL_OWNER_TYPES)[number];

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(MATERIAL_OWNER_TYPES)
  ownerType: MaterialOwnerType;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @IsUUID()
  lecturerId?: string;

  @IsNumberString()
  quantity: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  @IsBoolean()
  isMonitored?: boolean;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(MATERIAL_OWNER_TYPES)
  ownerType?: MaterialOwnerType;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @IsUUID()
  lecturerId?: string;

  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isMonitored?: boolean;
}

export class GetMaterialsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(MATERIAL_OWNER_TYPES)
  ownerType?: MaterialOwnerType;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @IsUUID()
  lecturerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

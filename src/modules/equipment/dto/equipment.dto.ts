import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const TOOL_STATUS_VALUES = [
  "AVAILABLE",
  "IN_USE",
  "MAINTENANCE",
  "UNAVAILABLE",
] as const;

export type ToolStatusType = (typeof TOOL_STATUS_VALUES)[number];

export const TOOL_OWNER_TYPES = ["LAB", "LECTURER"] as const;

export type ToolOwnerType = (typeof TOOL_OWNER_TYPES)[number];

export class CreateToolDto {
  @IsIn(TOOL_OWNER_TYPES)
  ownerType: ToolOwnerType;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @IsUUID()
  lecturerId?: string;

  @IsOptional()
  @IsUUID()
  assignedLabId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  inventoryCode?: string;

  @IsOptional()
  @IsIn(TOOL_STATUS_VALUES)
  status?: ToolStatusType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateToolDto {
  @IsOptional()
  @IsUUID()
  assignedLabId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  inventoryCode?: string;

  @IsOptional()
  @IsIn(TOOL_STATUS_VALUES)
  status?: ToolStatusType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateToolCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GetToolsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(TOOL_OWNER_TYPES)
  ownerType?: ToolOwnerType;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @IsUUID()
  lecturerId?: string;

  @IsOptional()
  @IsUUID()
  assignedLabId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsIn(TOOL_STATUS_VALUES)
  status?: ToolStatusType;

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
}
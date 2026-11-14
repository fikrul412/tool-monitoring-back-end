import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ClearanceMaterialUsageDto {
  @IsUUID() materialId: string;
  @IsString() @MaxLength(255) name: string;
  @Type(() => Number) @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0) @Max(1000000000) quantity: number;
  @IsString() @MaxLength(50) unit: string;
}

export class ClearanceEquipmentConditionDto {
  @IsUUID() toolId: string;
  @IsString() @MaxLength(100) condition: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class ClearanceWasteDto {
  @IsString() @MaxLength(150) name: string;
  @IsString() @MaxLength(100) phase: string;
  @IsString() @MaxLength(150) handling: string;
  @Type(() => Number) @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0.0001) @Max(1000000000) quantity: number;
  @IsString() @MaxLength(50) unit: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class RequestClearanceDto {
  @IsUUID() researchId: string;

  @IsArray() @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => ClearanceMaterialUsageDto)
  materialUsage: ClearanceMaterialUsageDto[];

  @IsArray() @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => ClearanceEquipmentConditionDto)
  equipmentConditions: ClearanceEquipmentConditionDto[];

  @IsArray() @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => ClearanceWasteDto)
  wasteHandling: ClearanceWasteDto[];
}

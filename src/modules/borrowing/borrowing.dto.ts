import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialRequestDto {
  @IsUUID() materialId: string;
  @Type(() => Number) @IsNumber() @Min(0.0001) quantity: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}

export class CreateToolBorrowDto {
  @IsUUID() toolId: string;
  @Type(() => Number) @IsNumber() @Min(1) durationMinutes: number;
}

export class CreateToolScheduleDto {
  @IsUUID() toolId: string;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}

export class ReviewMaterialRequestDto {
  @IsIn(['APPROVED', 'REJECTED']) status: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() @MaxLength(1000) comments?: string;
}

export class ReviewToolScheduleDto {
  @IsIn(['APPROVED', 'REJECTED']) decision: 'APPROVED' | 'REJECTED';
}

export class ConfirmToolBorrowDto {
  @IsIn(['OK', 'FAILED']) result: 'OK' | 'FAILED';
  @IsUUID() toolId: string;
  @Type(() => Number) @IsNumber() @Min(1) durationMinutes: number;
}

export class ConfirmToolReturnDto {
  @IsIn(['OK', 'FAILED']) result: 'OK' | 'FAILED';
  @IsUUID() toolId: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

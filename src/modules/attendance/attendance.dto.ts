import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class AttendanceRequestDto {
  @IsUUID() labId: string;
  @IsOptional() @IsUUID() researchId?: string;
}

export class AttendanceConfirmDto {
  @IsUUID() labId: string;
  @IsOptional() @IsUUID() researchId?: string;
  @IsIn(['ENTRY', 'EXIT']) type: 'ENTRY' | 'EXIT';
  @IsIn(['OK', 'FAILED']) result: 'OK' | 'FAILED';
  @IsUUID() qrJti: string;
}

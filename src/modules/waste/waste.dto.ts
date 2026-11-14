import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWasteOptionDto {
  @IsIn(['CATEGORY', 'UNIT', 'PHASE', 'HANDLING']) type: 'CATEGORY' | 'UNIT' | 'PHASE' | 'HANDLING';
  @IsString() @MinLength(1) @MaxLength(150) value: string;
}

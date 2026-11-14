import { IsIn, IsUUID } from 'class-validator';

export class ApplyLetterDto {
  @IsUUID() researchId: string;
  @IsIn(['LAB_ACCESS', 'LAB_CLEARANCE']) type: 'LAB_ACCESS' | 'LAB_CLEARANCE';
}

import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewLetterDto {
  @IsIn(['RECEIVED', 'REJECTED']) decision: 'RECEIVED' | 'REJECTED';
  @IsOptional() @IsString() @MaxLength(2000) comments?: string;
}

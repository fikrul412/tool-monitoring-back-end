
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateResearchDto {
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  supervisorIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  labIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  toolIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  materialIds?: string[];
}

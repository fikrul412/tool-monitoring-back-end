import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class ResearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(["PENDING", "APPROVED", "REJECTED", "ONGOING", "COMPLETION_REQUESTED", "COMPLETED", "ARCHIVED", "CANCELLED"])
  status?: "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "COMPLETION_REQUESTED" | "COMPLETED" | "ARCHIVED" | "CANCELLED";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

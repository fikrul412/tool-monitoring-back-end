import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateResearchStatusDto {
  @IsIn(["ONGOING", "COMPLETED", "CANCELLED"])
  status: "ONGOING" | "COMPLETED" | "CANCELLED";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}

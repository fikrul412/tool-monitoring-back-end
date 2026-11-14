import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateResearchStatusDto {
  @IsIn(["ONGOING", "CANCELLED"])
  status: "ONGOING" | "CANCELLED";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}

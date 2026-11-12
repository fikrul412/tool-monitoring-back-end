
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

import { RuntimeRoleEnum } from "../../../database/schema/enums.js";

export class CreateManagedUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(RuntimeRoleEnum)
  role: RuntimeRoleEnum;

  @ValidateIf((o) => o.role === RuntimeRoleEnum.Student ||
    o.role === RuntimeRoleEnum.Lecturer)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ValidateIf((o) => o.role === RuntimeRoleEnum.Student)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nim?: string;

  @ValidateIf((o) => o.role === RuntimeRoleEnum.Lecturer)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nip?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}




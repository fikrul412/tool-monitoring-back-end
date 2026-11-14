import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
} from "class-validator";

export class RegisterUserLocalDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    nim: string;

    @IsOptional() @IsString() @MaxLength(150) studyProgram?: string;
    @IsOptional() @IsString() @MaxLength(30) whatsapp?: string;
    @IsOptional() @IsString() @MaxLength(2000) address?: string;

    @IsNotEmpty()
    @IsEmail({}, {
        message: "Please enter a valid email address.",
    })
    @MaxLength(255)
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;
}

export class EmailVerificationDto{
    @IsNotEmpty({message: 'Verification token is required.'})
    @IsString({message: 'Token must be a valid string.'})
    token: string
}

export class LoginUserLocalDto{
    @IsNotEmpty()
    @IsEmail({}, {message: "Please enter a valid email address..."})
    email: string
    
    @IsNotEmpty()
    @IsString()
    password: string
}

export class ResendVerificationDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
}

export class RequestPasswordResetDto {
    @IsNotEmpty() @IsEmail() email: string;
}

export class ResetPasswordDto {
    @IsNotEmpty() @IsString() token: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string;
}

import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    username: string

    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    currentPassword?: string

    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    password?: string

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    newPassword: string
}

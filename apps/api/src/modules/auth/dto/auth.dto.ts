import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from "class-validator";
import { UserRole } from "@prisma/client";

export class RegisterDto {
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Password deve ter pelo menos 8 caracteres" })
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2, { message: "Nome deve ter pelo menos 2 caracteres" })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

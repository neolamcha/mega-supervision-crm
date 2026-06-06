import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Dupont', description: 'Nom de famille' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est obligatoire' })
  prenom: string;

  @ApiProperty({ example: '+221771234567', description: 'Numéro de téléphone' })
  @IsString()
  @IsNotEmpty({ message: 'Le téléphone est obligatoire' })
  telephone: string;

  @ApiProperty({ example: 'jean.dupont@email.com', description: 'Adresse email' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

  @ApiProperty({ example: 'jean.dupont', description: 'Nom d\'utilisateur' })
  @IsString()
  @IsNotEmpty({ message: 'Le login est obligatoire' })
  login: string;

  @ApiProperty({ example: 'Password123!', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  motDePasse: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DELEGUE, description: 'Rôle', default: UserRole.DELEGUE })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rôle invalide' })
  role?: UserRole = UserRole.DELEGUE;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Dupont', description: 'Nom de famille' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ example: 'Jean', description: 'Prénom' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({ example: '+221771234567', description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@email.com', description: 'Adresse email' })
  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @ApiPropertyOptional({ example: 'jean.dupont', description: 'Nom d\'utilisateur' })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.DELEGUE, description: 'Rôle' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rôle invalide' })
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Nouveau mot de passe' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  motDePasse?: string;
}

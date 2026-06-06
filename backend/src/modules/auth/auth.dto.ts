import {
  IsString,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'Dg2026', description: 'Nom d\'utilisateur' })
  @IsString()
  @IsNotEmpty({ message: 'Le login est obligatoire' })
  login: string;

  @ApiProperty({ example: 'Mega2026', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  motDePasse: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token de rafraîchissement' })
  @IsString()
  @IsNotEmpty({ message: 'Le token de rafraîchissement est obligatoire' })
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est obligatoire' })
  motDePasseActuel: string;

  @ApiProperty({ description: 'Nouveau mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le nouveau mot de passe est obligatoire' })
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  nouveauMotDePasse: string;

  @ApiProperty({ description: 'Confirmation du nouveau mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'La confirmation est obligatoire' })
  confirmation: string;
}

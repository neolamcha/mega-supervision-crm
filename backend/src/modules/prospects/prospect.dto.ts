import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProspectType } from '../../database/entities/prospect.entity';

export class CreateProspectDto {
  @ApiProperty({ example: 'Pharmacie Centrale', description: 'Nom du prospect' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @ApiProperty({ enum: ProspectType, example: ProspectType.PHARMACIE, description: 'Type de prospect' })
  @IsEnum(ProspectType, { message: 'Type de prospect invalide' })
  @IsNotEmpty({ message: 'Le type est obligatoire' })
  type: ProspectType;

  @ApiProperty({ example: '123 Rue Principale', description: 'Adresse' })
  @IsString()
  @IsNotEmpty({ message: 'L\'adresse est obligatoire' })
  adresse: string;

  @ApiProperty({ example: 'Dakar', description: 'Ville' })
  @IsString()
  @IsNotEmpty({ message: 'La ville est obligatoire' })
  ville: string;

  @ApiProperty({ example: 'Dakar', description: 'Région' })
  @IsString()
  @IsNotEmpty({ message: 'La région est obligatoire' })
  region: string;

  @ApiProperty({ example: '+221771234567', description: 'Numéro de téléphone' })
  @IsString()
  @IsNotEmpty({ message: 'Le téléphone est obligatoire' })
  telephone: string;

  @ApiPropertyOptional({ example: 'Proche du marché', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProspectDto {
  @ApiPropertyOptional({ example: 'Pharmacie Centrale', description: 'Nom du prospect' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ enum: ProspectType, example: ProspectType.PHARMACIE, description: 'Type de prospect' })
  @IsOptional()
  @IsEnum(ProspectType, { message: 'Type de prospect invalide' })
  type?: ProspectType;

  @ApiPropertyOptional({ example: '123 Rue Principale', description: 'Adresse' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: 'Dakar', description: 'Ville' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ example: 'Dakar', description: 'Région' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '+221771234567', description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'Proche du marché', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProspectTypeConfigDto {
  @ApiProperty({ example: 20, description: 'Rayon de présence en mètres' })
  @IsNumber({}, { message: 'Le rayon doit être un nombre' })
  @Min(1, { message: 'Le rayon doit être au moins 1 mètre' })
  rayonPresence: number;
}

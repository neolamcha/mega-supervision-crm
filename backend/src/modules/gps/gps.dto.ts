import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GpsEvenement } from '../../database/entities/gps-event.entity';

export class CreateGpsEventDto {
  @ApiProperty({ example: 14.7167, description: 'Latitude' })
  @IsNumber({}, { message: 'La latitude doit être un nombre' })
  @IsNotEmpty({ message: 'La latitude est obligatoire' })
  latitude: number;

  @ApiProperty({ example: -17.4678, description: 'Longitude' })
  @IsNumber({}, { message: 'La longitude doit être un nombre' })
  @IsNotEmpty({ message: 'La longitude est obligatoire' })
  longitude: number;

  @ApiProperty({ example: 10, description: 'Précision en mètres' })
  @IsNumber({}, { message: 'La précision doit être un nombre' })
  @Min(0, { message: 'La précision doit être positive' })
  @IsNotEmpty({ message: 'La précision est obligatoire' })
  precision: number;

  @ApiPropertyOptional({ example: 5.2, description: 'Vitesse en km/h' })
  @IsOptional()
  @IsNumber({}, { message: 'La vitesse doit être un nombre' })
  vitesse?: number;

  @ApiPropertyOptional({ example: 10, description: 'Altitude en mètres' })
  @IsOptional()
  @IsNumber({}, { message: 'L\'altitude doit être un nombre' })
  altitude?: number;

  @ApiProperty({ enum: GpsEvenement, example: GpsEvenement.POSITION, description: 'Type d\'événement GPS' })
  @IsEnum(GpsEvenement, { message: 'Type d\'événement invalide' })
  @IsNotEmpty({ message: 'Le type d\'événement est obligatoire' })
  evenement: GpsEvenement;

  @ApiProperty({ example: '2026-06-06T10:00:00Z', description: 'Horodatage de l\'événement' })
  @IsDateString({}, { message: 'Date invalide' })
  @IsNotEmpty({ message: 'L\'horodatage est obligatoire' })
  horodatage: string;

  @ApiPropertyOptional({ example: 'uuid-prospect-id', description: 'ID du prospect associé' })
  @IsOptional()
  @IsUUID('4', { message: 'ID de prospect invalide' })
  prospectId?: string;

  @ApiPropertyOptional({ example: 'appareil-001', description: 'Identifiant de l\'appareil' })
  @IsOptional()
  @IsString()
  appareilId?: string;
}

export class SyncGpsEventsDto {
  @ApiProperty({ type: [CreateGpsEventDto], description: 'Liste des événements GPS' })
  @IsArray({ message: 'La liste des événements est obligatoire' })
  @ValidateNested({ each: true })
  @Type(() => CreateGpsEventDto)
  events: CreateGpsEventDto[];

  @ApiProperty({ example: 'appareil-001', description: 'Identifiant de l\'appareil' })
  @IsString()
  @IsNotEmpty({ message: 'L\'identifiant de l\'appareil est obligatoire' })
  appareilId: string;
}

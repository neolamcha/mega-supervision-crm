import {
  IsUUID,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalibrateProspectDto {
  @ApiProperty({ example: 'uuid-prospect-id', description: 'ID du prospect à calibrer' })
  @IsUUID('4', { message: 'ID de prospect invalide' })
  @IsNotEmpty({ message: 'L\'ID du prospect est obligatoire' })
  prospectId: string;

  @ApiProperty({ example: 14.7167, description: 'Latitude' })
  @IsNumber({}, { message: 'La latitude doit être un nombre' })
  @IsNotEmpty({ message: 'La latitude est obligatoire' })
  latitude: number;

  @ApiProperty({ example: -17.4678, description: 'Longitude' })
  @IsNumber({}, { message: 'La longitude doit être un nombre' })
  @IsNotEmpty({ message: 'La longitude est obligatoire' })
  longitude: number;
}

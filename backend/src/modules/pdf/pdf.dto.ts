import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePdfDto {
  @ApiProperty({ description: 'ID du délégué' })
  @IsUUID('4')
  @IsNotEmpty()
  delegateId: string;

  @ApiProperty({ description: 'Date début (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  dateFrom: string;

  @ApiProperty({ description: 'Date fin (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  dateTo: string;
}

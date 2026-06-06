import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsFilterDto {
  @ApiPropertyOptional({ description: 'Date début (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filtrer par région' })
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'ID du prospect' })
  @IsOptional()
  @IsUUID('4')
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID du délégué' })
  @IsOptional()
  @IsUUID('4')
  delegateId?: string;
}

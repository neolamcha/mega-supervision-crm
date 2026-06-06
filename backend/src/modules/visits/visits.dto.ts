import { IsOptional, IsUUID, IsDateString, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VisitFilterDto {
  @ApiPropertyOptional({ description: 'ID du délégué' })
  @IsOptional()
  @IsUUID('4')
  delegateId?: string;

  @ApiPropertyOptional({ description: 'ID du prospect' })
  @IsOptional()
  @IsUUID('4')
  prospectId?: string;

  @ApiPropertyOptional({ description: 'Date début (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut de complétion' })
  @IsOptional()
  @IsBoolean()
  estComplete?: boolean;
}

export class UpdateVisitNotesDto {
  @ApiPropertyOptional({ description: 'Notes de la visite' })
  @IsOptional()
  @IsString()
  notes?: string;
}

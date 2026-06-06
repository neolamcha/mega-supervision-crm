import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './analytics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Analytiques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tableau de bord principal avec métriques' })
  async getDashboard(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getDashboard(filters);
  }

  @Get('delegate/:delegueId')
  @ApiOperation({ summary: 'Analytiques pour un délégué spécifique' })
  async getDelegateAnalytics(
    @Param('delegueId', ParseUUIDPipe) delegueId: string,
    @Query() filters: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getDelegateAnalytics(delegueId, filters);
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: 'Analytiques pour un prospect spécifique' })
  async getProspectAnalytics(
    @Param('prospectId', ParseUUIDPipe) prospectId: string,
    @Query() filters: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getProspectAnalytics(prospectId, filters);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Détecter les anomalies (visites courtes/longues, incohérences GPS)' })
  async getAnomalies(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getAnomalies(filters);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter les données analytiques en JSON' })
  async exportData(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.exportData(filters);
  }
}

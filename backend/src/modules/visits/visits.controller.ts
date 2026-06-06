import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { VisitFilterDto, UpdateVisitNotesDto } from './visits.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Visites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les visites avec filtres' })
  async findAll(@Query() filters: VisitFilterDto) {
    return this.visitsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une visite' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitsService.findById(id);
  }

  @Get('delegate/:delegueId')
  @ApiOperation({ summary: 'Obtenir les visites d\'un délégué' })
  async findByDelegate(
    @Param('delegueId', ParseUUIDPipe) delegueId: string,
  ) {
    return this.visitsService.findByDelegate(delegueId);
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: 'Obtenir les visites d\'un prospect' })
  async findByProspect(
    @Param('prospectId', ParseUUIDPipe) prospectId: string,
  ) {
    return this.visitsService.findByProspect(prospectId);
  }

  @Get('active/:delegueId')
  @ApiOperation({ summary: 'Obtenir la visite active (en cours) d\'un délégué' })
  async findActiveByDelegate(
    @Param('delegueId', ParseUUIDPipe) delegueId: string,
  ) {
    return this.visitsService.findActiveByDelegate(delegueId);
  }

  @Patch(':id/notes')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour les notes d\'une visite (admin)' })
  async updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitNotesDto,
    @CurrentUser() user: User,
  ) {
    return this.visitsService.updateNotes(id, dto, user);
  }
}

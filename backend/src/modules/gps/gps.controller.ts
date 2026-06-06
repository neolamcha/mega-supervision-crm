import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { CreateGpsEventDto, SyncGpsEventsDto } from './gps.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { User } from '../../database/entities/user.entity';
import { GpsEvenement } from '../../database/entities/gps-event.entity';

@ApiTags('GPS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('event')
  @ApiOperation({ summary: 'Enregistrer un événement GPS' })
  async createEvent(
    @CurrentUser() user: User,
    @Body() createDto: CreateGpsEventDto,
  ) {
    return this.gpsService.processEvent(user, createDto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Lister les événements GPS avec filtres' })
  async listEvents(
    @Query('delegueId') delegueId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('evenement') evenement?: GpsEvenement,
  ) {
    return this.gpsService.listEvents({
      delegueId,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
      evenement,
    });
  }

  @Post('sync')
  @ApiOperation({ summary: 'Synchronisation en masse des événements GPS (hors ligne)' })
  async syncEvents(
    @CurrentUser() user: User,
    @Body() syncDto: SyncGpsEventsDto,
  ) {
    return this.gpsService.syncEvents(user, syncDto);
  }

  @Get('trajet/:delegueId/:date')
  @ApiOperation({ summary: 'Obtenir la trajectoire GPS d\'un délégué pour une date' })
  async getTrajectory(
    @Param('delegueId', ParseUUIDPipe) delegueId: string,
    @Param('date') date: string,
  ) {
    return this.gpsService.getTrajectory(delegueId, date);
  }
}

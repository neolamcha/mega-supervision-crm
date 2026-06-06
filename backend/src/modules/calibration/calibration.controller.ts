import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalibrationService } from './calibration.service';
import { CalibrateProspectDto } from './calibration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { User } from '../../database/entities/user.entity';

@ApiTags('Calibration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calibration')
export class CalibrationController {
  constructor(private readonly calibrationService: CalibrationService) {}

  @Post()
  @ApiOperation({ summary: 'Calibrer un prospect (enregistrer point GPS)' })
  async calibrate(
    @CurrentUser() user: User,
    @Body() calibrateDto: CalibrateProspectDto,
  ) {
    return this.calibrationService.calibrate(user, calibrateDto);
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: 'Obtenir l\'historique de calibration d\'un prospect' })
  async getHistory(@Param('prospectId', ParseUUIDPipe) prospectId: string) {
    return this.calibrationService.getCalibrationHistory(prospectId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Obtenir mes calibrations (délégué)' })
  async getMyCalibrations(@CurrentUser() user: User) {
    return this.calibrationService.getMyCalibrations(user);
  }
}

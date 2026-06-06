import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalibrationController } from './calibration.controller';
import { CalibrationService } from './calibration.service';
import { Calibration } from '../../database/entities/calibration.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calibration, Prospect, AuditLog, User]),
  ],
  controllers: [CalibrationController],
  providers: [CalibrationService],
  exports: [CalibrationService],
})
export class CalibrationModule {}

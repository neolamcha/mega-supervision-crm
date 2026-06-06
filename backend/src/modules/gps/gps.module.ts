import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { GpsEvent } from '../../database/entities/gps-event.entity';
import { Visit } from '../../database/entities/visit.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { ProspectTypeConfig } from '../../database/entities/prospect-type-config.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GpsEvent, Visit, Prospect, ProspectTypeConfig, User]),
  ],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}

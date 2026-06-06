import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { Visit } from '../../database/entities/visit.entity';
import { User } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, User, Prospect])],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}

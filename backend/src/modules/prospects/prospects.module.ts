import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { ProspectTypeConfigService } from './prospect-type-config.service';
import { Prospect } from '../../database/entities/prospect.entity';
import { ProspectTypeConfig } from '../../database/entities/prospect-type-config.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prospect, ProspectTypeConfig, User]),
  ],
  controllers: [ProspectsController],
  providers: [ProspectsService, ProspectTypeConfigService],
  exports: [ProspectsService, ProspectTypeConfigService],
})
export class ProspectsModule {}

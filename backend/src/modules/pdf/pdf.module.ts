import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { Visit } from '../../database/entities/visit.entity';
import { User } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { GpsEvent } from '../../database/entities/gps-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, User, Prospect, GpsEvent])],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}

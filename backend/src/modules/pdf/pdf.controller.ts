import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { GeneratePdfDto } from './pdf.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import * as path from 'path';

@ApiTags('PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer un rapport PDF pour un délégué sur une période' })
  async generate(@Body() dto: GeneratePdfDto) {
    const filename = await this.pdfService.generateReport(
      dto.delegateId,
      dto.dateFrom,
      dto.dateTo,
    );
    return { message: 'Rapport généré avec succès', filename };
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Télécharger un PDF généré' })
  async download(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.pdfService.getPdfPath(filename);
    res.download(filePath, filename);
  }

  @Get('list')
  @ApiOperation({ summary: 'Lister les PDFs générés' })
  async list() {
    return this.pdfService.listGeneratedPdfs();
  }
}

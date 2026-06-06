import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditFilterDto } from './audit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Lister les logs d\'audit avec filtres' })
  async findAll(@Query() filters: AuditFilterDto) {
    return this.auditService.findAll(filters);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Obtenir un log d\'audit spécifique' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findById(id);
  }
}

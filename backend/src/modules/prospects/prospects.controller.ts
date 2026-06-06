import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProspectsService } from './prospects.service';
import { ProspectTypeConfigService } from './prospect-type-config.service';
import {
  CreateProspectDto,
  UpdateProspectDto,
  UpdateProspectTypeConfigDto,
} from './prospect.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { User, UserRole } from '../../database/entities/user.entity';
import { ProspectType } from '../../database/entities/prospect.entity';

@ApiTags('Prospects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prospects')
export class ProspectsController {
  constructor(
    private readonly prospectsService: ProspectsService,
    private readonly prospectTypeConfigService: ProspectTypeConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste de tous les prospects' })
  async findAll(
    @CurrentUser() user: User,
    @Query('type') type?: ProspectType,
    @Query('region') region?: string,
    @Query('ville') ville?: string,
    @Query('archived') archived?: string,
  ) {
    const archivedFilter =
      archived !== undefined
        ? archived === 'true' || archived === '1'
        : undefined;

    return this.prospectsService.findAll(user, {
      type: type as ProspectType,
      region,
      ville,
      archived: archivedFilter,
    });
  }

  @Get('types/config')
  @ApiOperation({ summary: 'Obtenir toutes les configurations de types de prospect' })
  async getTypeConfigs() {
    return this.prospectTypeConfigService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un prospect par ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.prospectsService.findById(id);
  }

  @Post()
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un nouveau prospect' })
  async create(@Body() createDto: CreateProspectDto) {
    return this.prospectsService.create(createDto);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour un prospect' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProspectDto,
  ) {
    return this.prospectsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer un prospect (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.prospectsService.softDelete(id);
    return { message: 'Prospect archivé avec succès' };
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archiver un prospect' })
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.prospectsService.archive(id);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Désarchiver un prospect' })
  async unarchive(@Param('id', ParseUUIDPipe) id: string) {
    return this.prospectsService.unarchive(id);
  }

  @Patch('types/config/:type')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour le rayon de présence pour un type de prospect' })
  async updateTypeConfig(
    @Param('type') type: ProspectType,
    @Body() updateDto: UpdateProspectTypeConfigDto,
  ) {
    return this.prospectTypeConfigService.updateRayon(type, updateDto);
  }
}

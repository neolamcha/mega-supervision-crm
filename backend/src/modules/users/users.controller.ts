import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Liste de tous les utilisateurs' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Désactiver un utilisateur (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.softDelete(id);
    return { message: 'Utilisateur désactivé avec succès' };
  }

  @Delete(':id/hard')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer définitivement un utilisateur' })
  async hardRemove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.hardDelete(id);
    return { message: 'Utilisateur supprimé définitivement' };
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Réactiver un utilisateur' })
  async reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.reactivate(id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.resetPassword(id);
  }
}

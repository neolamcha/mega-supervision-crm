import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { LoginDto, ChangePasswordDto, RefreshTokenDto } from './auth.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(login: string, password: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { login },
      select: [
        'id',
        'login',
        'motDePasse',
        'role',
        'estActif',
        'premierConnexion',
        'nom',
        'prenom',
        'email',
        'telephone',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    if (!user.estActif) {
      throw new ForbiddenException('Compte désactivé');
    }

    const isPasswordValid = await bcrypt.compare(password, user.motDePasse);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const { motDePasse, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.login, loginDto.motDePasse);

    const tokens = await this.generateTokens(user as User);
    const refreshTokenExpiration = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');

    const expiresAt = new Date();
    const match = refreshTokenExpiration.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
        case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
        case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
        case 's': expiresAt.setSeconds(expiresAt.getSeconds() + value); break;
      }
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await this.refreshTokenRepository.save({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    });

    if (user.id) {
      await this.userRepository.update(user.id, {
        premierConnexion: false,
      });
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        login: user.login,
        email: user.email,
        role: user.role,
        premierConnexion: user.premierConnexion,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshTokenDto.refreshToken,
        estRevoke: false,
      },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Token de rafraîchissement expiré');
    }

    const user = storedToken.user;
    if (!user.estActif) {
      throw new ForbiddenException('Compte désactivé');
    }

    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.nouveauMotDePasse !== changePasswordDto.confirmation) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'motDePasse'],
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.motDePasseActuel,
      user.motDePasse,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(changePasswordDto.nouveauMotDePasse, salt);

    await this.userRepository.update(userId, {
      motDePasse: hashedPassword,
      premierConnexion: false,
    });

    await this.refreshTokenRepository.update(
      { userId, estRevoke: false },
      { estRevoke: true },
    );

    return { message: 'Mot de passe changé avec succès' };
  }

  async logout(userId: string, refreshToken: string) {
    await this.refreshTokenRepository.update(
      { token: refreshToken, userId },
      { estRevoke: true },
    );

    return { message: 'Déconnexion réussie' };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    return { accessToken, refreshToken };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { login } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingLogin = await this.findByLogin(createUserDto.login);
    if (existingLogin) {
      throw new ConflictException('Ce login est déjà utilisé');
    }

    const existingEmail = await this.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.motDePasse, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      role: createUserDto.role || UserRole.DELEGUE,
      motDePasse: hashedPassword,
      premierConnexion: true,
      estActif: true,
    });

    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.login && updateUserDto.login !== user.login) {
      const existingLogin = await this.findByLogin(updateUserDto.login);
      if (existingLogin) {
        throw new ConflictException('Ce login est déjà utilisé');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.findByEmail(updateUserDto.email);
      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    if (updateUserDto.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.motDePasse = await bcrypt.hash(updateUserDto.motDePasse, salt);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.estActif = false;
    await this.userRepository.save(user);
  }

  async reactivate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.estActif = true;
    return this.userRepository.save(user);
  }

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    const user = await this.findById(id);

    const temporaryPassword = 'Mega' + Math.random().toString(36).substring(2, 10) + '!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    user.motDePasse = hashedPassword;
    user.premierConnexion = true;
    await this.userRepository.save(user);

    return { temporaryPassword };
  }
}

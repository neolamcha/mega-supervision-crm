import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prospect, ProspectType } from '../../database/entities/prospect.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateProspectDto, UpdateProspectDto } from './prospect.dto';

@Injectable()
export class ProspectsService {
  constructor(
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    currentUser: User,
    filters?: {
      type?: ProspectType;
      region?: string;
      ville?: string;
      archived?: boolean;
    },
  ): Promise<Prospect[]> {
    const query = this.prospectRepository.createQueryBuilder('prospect');

    query.leftJoinAndSelect('prospect.calibrateur', 'calibrateur');

    if (currentUser.role === UserRole.DELEGUE) {
      query.andWhere('prospect.calibrateurId = :userId', {
        userId: currentUser.id,
      });
    }

    if (filters?.type) {
      query.andWhere('prospect.type = :type', { type: filters.type });
    }

    if (filters?.region) {
      query.andWhere('prospect.region = :region', { region: filters.region });
    }

    if (filters?.ville) {
      query.andWhere('prospect.ville = :ville', { ville: filters.ville });
    }

    if (filters?.archived !== undefined) {
      query.andWhere('prospect.estArchive = :archived', {
        archived: filters.archived,
      });
    }

    query.orderBy('prospect.createdAt', 'DESC');

    return query.getMany();
  }

  async findById(id: string): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({
      where: { id },
      relations: ['calibrateur'],
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return prospect;
  }

  async create(createDto: CreateProspectDto): Promise<Prospect> {
    const existing = await this.prospectRepository.findOne({
      where: { nom: createDto.nom },
    });

    if (existing) {
      throw new ConflictException('Un prospect avec ce nom existe déjà');
    }

    if (!Object.values(ProspectType).includes(createDto.type)) {
      throw new BadRequestException('Type de prospect invalide');
    }

    const prospect = this.prospectRepository.create({
      ...createDto,
      estArchive: false,
      estCalibre: false,
    });

    return this.prospectRepository.save(prospect);
  }

  async update(id: string, updateDto: UpdateProspectDto): Promise<Prospect> {
    const prospect = await this.findById(id);

    if (updateDto.nom && updateDto.nom !== prospect.nom) {
      const existing = await this.prospectRepository.findOne({
        where: { nom: updateDto.nom },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Un prospect avec ce nom existe déjà');
      }
    }

    Object.assign(prospect, updateDto);
    return this.prospectRepository.save(prospect);
  }

  async softDelete(id: string): Promise<void> {
    const prospect = await this.findById(id);
    prospect.estArchive = true;
    await this.prospectRepository.save(prospect);
  }

  async archive(id: string): Promise<Prospect> {
    const prospect = await this.findById(id);
    prospect.estArchive = true;
    return this.prospectRepository.save(prospect);
  }

  async unarchive(id: string): Promise<Prospect> {
    const prospect = await this.findById(id);
    prospect.estArchive = false;
    return this.prospectRepository.save(prospect);
  }
}

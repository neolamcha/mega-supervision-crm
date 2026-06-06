import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProspectTypeConfig } from '../../database/entities/prospect-type-config.entity';
import { ProspectType } from '../../database/entities/prospect.entity';
import { UpdateProspectTypeConfigDto } from './prospect.dto';

@Injectable()
export class ProspectTypeConfigService {
  private readonly defaultConfigs: Record<ProspectType, number> = {
    [ProspectType.PHARMACIE]: 20,
    [ProspectType.DEPOT]: 80,
    [ProspectType.CLINIQUE]: 50,
    [ProspectType.HOPITAL]: 150,
    [ProspectType.AUTRE]: 50,
  };

  constructor(
    @InjectRepository(ProspectTypeConfig)
    private readonly configRepository: Repository<ProspectTypeConfig>,
  ) {}

  async findAll(): Promise<ProspectTypeConfig[]> {
    const configs = await this.configRepository.find();

    if (configs.length === 0) {
      return this.seedDefaults();
    }

    return configs;
  }

  async findByType(type: ProspectType): Promise<ProspectTypeConfig> {
    let config = await this.configRepository.findOne({ where: { type } });

    if (!config) {
      config = await this.seedType(type);
    }

    return config;
  }

  async getRayonByType(type: ProspectType): Promise<number> {
    const config = await this.findByType(type);
    return config.rayonPresence;
  }

  async updateRayon(
    type: ProspectType,
    updateDto: UpdateProspectTypeConfigDto,
  ): Promise<ProspectTypeConfig> {
    if (!Object.values(ProspectType).includes(type)) {
      throw new BadRequestException(`Type de prospect invalide: ${type}`);
    }

    let config = await this.configRepository.findOne({ where: { type } });

    if (!config) {
      config = this.configRepository.create({
        type,
        rayonPresence: this.defaultConfigs[type] ?? 50,
      });
    }

    config.rayonPresence = updateDto.rayonPresence;
    return this.configRepository.save(config);
  }

  private async seedDefaults(): Promise<ProspectTypeConfig[]> {
    const configs: ProspectTypeConfig[] = [];

    for (const [type, rayon] of Object.entries(this.defaultConfigs)) {
      const existing = await this.configRepository.findOne({
        where: { type: type as ProspectType },
      });

      if (!existing) {
        const config = this.configRepository.create({
          type: type as ProspectType,
          rayonPresence: rayon,
        });
        configs.push(await this.configRepository.save(config));
      } else {
        configs.push(existing);
      }
    }

    return configs;
  }

  private async seedType(type: ProspectType): Promise<ProspectTypeConfig> {
    const rayon = this.defaultConfigs[type] ?? 50;
    const config = this.configRepository.create({
      type,
      rayonPresence: rayon,
    });
    return this.configRepository.save(config);
  }
}

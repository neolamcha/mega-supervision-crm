import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditFilterDto } from './audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(params: {
    utilisateurId?: string | null;
    action: string;
    entite: string;
    entiteId?: string | null;
    details?: Record<string, any> | null;
    adresseIP?: string | null;
  }): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      utilisateurId: params.utilisateurId ?? null,
      action: params.action,
      entite: params.entite,
      entiteId: params.entiteId ?? null,
      details: params.details ?? null,
      adresseIP: params.adresseIP ?? null,
    });
    return this.auditLogRepository.save(log);
  }

  async findAll(
    filters: AuditFilterDto,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const where: FindOptionsWhere<AuditLog> = {};
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    if (filters.userId) {
      where.utilisateurId = filters.userId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.entity) {
      where.entite = filters.entity;
    }
    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = Between(
        new Date(filters.dateFrom),
        new Date(`${filters.dateTo}T23:59:59Z`),
      );
    } else if (filters.dateFrom) {
      where.createdAt = MoreThanOrEqual(new Date(filters.dateFrom));
    } else if (filters.dateTo) {
      where.createdAt = LessThanOrEqual(
        new Date(`${filters.dateTo}T23:59:59Z`),
      );
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['utilisateur'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['utilisateur'],
    });
    if (!log) {
      throw new NotFoundException('Entrée d\'audit non trouvée');
    }
    return log;
  }
}

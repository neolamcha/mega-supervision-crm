import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { Visit } from '../../database/entities/visit.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { VisitFilterDto, UpdateVisitNotesDto } from './visits.dto';

const LUNCH_PAUSE_START = 13 * 3600;
const LUNCH_PAUSE_END = 15 * 3600;
const SHORT_VISIT_THRESHOLD = 120;
const LONG_VISIT_THRESHOLD = 10800;

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
  ) {}

  async findAll(filters: VisitFilterDto): Promise<Visit[]> {
    const where: FindOptionsWhere<Visit> = {};

    if (filters.delegateId) {
      where.delegueId = filters.delegateId;
    }
    if (filters.prospectId) {
      where.prospectId = filters.prospectId;
    }
    if (filters.estComplete !== undefined) {
      where.estComplete = filters.estComplete;
    }
    if (filters.dateFrom && filters.dateTo) {
      where.dateVisite = Between(
        new Date(filters.dateFrom),
        new Date(filters.dateTo),
      );
    } else if (filters.dateFrom) {
      where.dateVisite = MoreThanOrEqual(new Date(filters.dateFrom));
    } else if (filters.dateTo) {
      where.dateVisite = LessThanOrEqual(new Date(filters.dateTo));
    }

    return this.visitRepository.find({
      where,
      relations: ['prospect', 'delegue'],
      order: { dateVisite: 'DESC', heureArrivee: 'DESC' },
    });
  }

  async findById(id: string): Promise<Visit> {
    const visit = await this.visitRepository.findOne({
      where: { id },
      relations: ['prospect', 'delegue', 'gpsEvents'],
    });
    if (!visit) {
      throw new NotFoundException('Visite non trouvée');
    }
    return visit;
  }

  async findByDelegate(delegueId: string): Promise<Visit[]> {
    const user = await this.userRepository.findOne({ where: { id: delegueId } });
    if (!user) {
      throw new NotFoundException('Délégué non trouvé');
    }
    return this.visitRepository.find({
      where: { delegueId },
      relations: ['prospect'],
      order: { dateVisite: 'DESC', heureArrivee: 'DESC' },
    });
  }

  async findByProspect(prospectId: string): Promise<Visit[]> {
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });
    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }
    return this.visitRepository.find({
      where: { prospectId },
      relations: ['delegue'],
      order: { dateVisite: 'DESC', heureArrivee: 'DESC' },
    });
  }

  async findActiveByDelegate(delegueId: string): Promise<Visit | null> {
    return this.visitRepository.findOne({
      where: {
        delegueId,
        estComplete: false,
      },
      relations: ['prospect'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateNotes(
    id: string,
    dto: UpdateVisitNotesDto,
    currentUser: User,
  ): Promise<Visit> {
    if (currentUser.role !== UserRole.DIRECTEUR) {
      throw new ForbiddenException(
        'Seuls les directeurs peuvent modifier les notes',
      );
    }
    const visit = await this.findById(id);
    if (dto.notes !== undefined) {
      visit.notes = dto.notes;
    }
    return this.visitRepository.save(visit);
  }

  calculateDurationSeconds(
    heureArrivee: string,
    heureDepart: string,
    dateVisite: Date,
  ): number {
    const toSeconds = (time: string): number => {
      const [h, m, s = '0'] = time.split(':');
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
    };

    const arrivalSec = toSeconds(heureArrivee);
    const departureSec = toSeconds(heureDepart);
    let duration = departureSec - arrivalSec;

    if (duration <= 0) {
      duration += 86400;
    }

    const pauseOverlap = this.calculatePauseOverlap(
      arrivalSec,
      departureSec,
    );

    return Math.max(0, duration - pauseOverlap);
  }

  private calculatePauseOverlap(arrivalSec: number, departureSec: number): number {
    const pauseStart = LUNCH_PAUSE_START;
    const pauseEnd = LUNCH_PAUSE_END;

    if (departureSec <= pauseStart || arrivalSec >= pauseEnd) {
      return 0;
    }

    const overlapStart = Math.max(arrivalSec, pauseStart);
    const overlapEnd = Math.min(departureSec, pauseEnd);

    return Math.max(0, overlapEnd - overlapStart);
  }

  async findByDateRange(
    dateFrom: string,
    dateTo: string,
  ): Promise<Visit[]> {
    return this.visitRepository.find({
      where: {
        dateVisite: Between(new Date(dateFrom), new Date(dateTo)),
      },
      relations: ['prospect', 'delegue'],
      order: { dateVisite: 'ASC' },
    });
  }

  async getTotalTimeByProspect(
    prospectId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<number> {
    const query = this.visitRepository
      .createQueryBuilder('v')
      .where('v.prospect_id = :prospectId', { prospectId });

    if (dateFrom) {
      query.andWhere('v.date_visite >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      query.andWhere('v.date_visite <= :dateTo', { dateTo });
    }

    const result = await query
      .select('COALESCE(SUM(v.duree_secondes), 0)', 'total')
      .getRawOne();

    return parseInt(result.total, 10) || 0;
  }

  async getTotalTimeByDelegate(
    delegueId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<number> {
    const query = this.visitRepository
      .createQueryBuilder('v')
      .where('v.delegue_id = :delegueId', { delegueId });

    if (dateFrom) {
      query.andWhere('v.date_visite >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      query.andWhere('v.date_visite <= :dateTo', { dateTo });
    }

    const result = await query
      .select('COALESCE(SUM(v.duree_secondes), 0)', 'total')
      .getRawOne();

    return parseInt(result.total, 10) || 0;
  }

  async getTotalTimeByDay(
    delegueId: string,
    date: string,
  ): Promise<{ date: string; totalSeconds: number }> {
    const result = await this.visitRepository
      .createQueryBuilder('v')
      .where('v.delegue_id = :delegueId', { delegueId })
      .andWhere('v.date_visite = :date', { date })
      .select('COALESCE(SUM(v.duree_secondes), 0)', 'total')
      .getRawOne();

    return {
      date,
      totalSeconds: parseInt(result.total, 10) || 0,
    };
  }

  async detectAnomalies(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    shortVisits: Visit[];
    longVisits: Visit[];
  }> {
    const query = this.visitRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.prospect', 'prospect')
      .leftJoinAndSelect('v.delegue', 'delegue')
      .where('v.duree_secondes IS NOT NULL');

    if (dateFrom) {
      query.andWhere('v.date_visite >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      query.andWhere('v.date_visite <= :dateTo', { dateTo });
    }

    const allVisits = await query.getMany();

    const shortVisits = allVisits.filter(
      (v) => v.dureeSecondes !== null && v.dureeSecondes < SHORT_VISIT_THRESHOLD,
    );

    const longVisits = allVisits.filter(
      (v) => v.dureeSecondes !== null && v.dureeSecondes > LONG_VISIT_THRESHOLD,
    );

    return { shortVisits, longVisits };
  }

  async countByFilters(filters: VisitFilterDto): Promise<number> {
    const where: FindOptionsWhere<Visit> = {};

    if (filters.delegateId) {
      where.delegueId = filters.delegateId;
    }
    if (filters.prospectId) {
      where.prospectId = filters.prospectId;
    }
    if (filters.estComplete !== undefined) {
      where.estComplete = filters.estComplete;
    }
    if (filters.dateFrom && filters.dateTo) {
      where.dateVisite = Between(
        new Date(filters.dateFrom),
        new Date(filters.dateTo),
      );
    } else if (filters.dateFrom) {
      where.dateVisite = MoreThanOrEqual(new Date(filters.dateFrom));
    } else if (filters.dateTo) {
      where.dateVisite = LessThanOrEqual(new Date(filters.dateTo));
    }

    return this.visitRepository.count({ where });
  }
}

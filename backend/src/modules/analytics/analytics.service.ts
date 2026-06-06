import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Visit } from '../../database/entities/visit.entity';
import { GpsEvent, GpsEvenement } from '../../database/entities/gps-event.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { User } from '../../database/entities/user.entity';
import { AnalyticsFilterDto } from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(GpsEvent)
    private readonly gpsEventRepository: Repository<GpsEvent>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboard(filters: AnalyticsFilterDto): Promise<any> {
    const dateFrom = filters.dateFrom
      ? new Date(filters.dateFrom)
      : new Date('2000-01-01');
    const dateTo = filters.dateTo
      ? new Date(filters.dateTo)
      : new Date('2100-01-01');

    const query = this.visitRepository
      .createQueryBuilder('v')
      .where('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
      });

    if (filters.delegateId) {
      query.andWhere('v.delegue_id = :delegateId', {
        delegateId: filters.delegateId,
      });
    }
    if (filters.prospectId) {
      query.andWhere('v.prospect_id = :prospectId', {
        prospectId: filters.prospectId,
      });
    }
    if (filters.region) {
      query
        .leftJoin('v.prospect', 'p')
        .andWhere('p.region = :region', { region: filters.region });
    }

    const visitCount = await query.clone().getCount();

    const totalDurationResult = await query
      .clone()
      .select('COALESCE(SUM(v.duree_secondes), 0)', 'total')
      .getRawOne();
    const totalTerrainTime = parseInt(totalDurationResult.total, 10) || 0;

    const lostTimeResult = await this.gpsEventRepository
      .createQueryBuilder('g')
      .where('g.evenement = :anomalie', { anomalie: GpsEvenement.ANOMALIE })
      .andWhere('g.horodatage BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .select('COUNT(*)', 'count')
      .getRawOne();
    const lostTime = parseInt(lostTimeResult.count, 10) || 0;

    const visitedProspectsResult = await query
      .clone()
      .select('COUNT(DISTINCT v.prospect_id)', 'count')
      .getRawOne();
    const prospectsVisited = parseInt(visitedProspectsResult.count, 10) || 0;

    let prospectsNotVisited = 0;
    const totalProspectsQuery = this.prospectRepository
      .createQueryBuilder('p')
      .where('p.est_archive = :archived', { archived: false });
    if (filters.region) {
      totalProspectsQuery.andWhere('p.region = :region', {
        region: filters.region,
      });
    }
    const totalProspects = await totalProspectsQuery.getCount();
    prospectsNotVisited = totalProspects - prospectsVisited;

    const avgDuration =
      visitCount > 0 ? Math.round(totalTerrainTime / visitCount) : 0;

    return {
      totalVisits: visitCount,
      totalTerrainTime,
      totalProspectTime: totalTerrainTime,
      lostTime,
      prospectsVisited,
      prospectsNotVisited: Math.max(0, prospectsNotVisited),
      averageVisitDuration: avgDuration,
    };
  }

  async getDelegateAnalytics(
    delegueId: string,
    filters: AnalyticsFilterDto,
  ): Promise<any> {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date('2000-01-01');
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-01-01');

    const visits = await this.visitRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.prospect', 'prospect')
      .where('v.delegue_id = :delegueId', { delegueId })
      .andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
      })
      .orderBy('v.date_visite', 'ASC')
      .getMany();

    const totalVisits = visits.length;
    const totalDuration = visits.reduce(
      (sum, v) => sum + (v.dureeSecondes || 0),
      0,
    );

    const prospectsVisited = new Set(visits.map((v) => v.prospectId)).size;

    const dailyBreakdown = await this.visitRepository
      .createQueryBuilder('v')
      .select('v.date_visite', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(v.duree_secondes), 0)', 'totalDuration')
      .where('v.delegue_id = :delegueId', { delegueId })
      .andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
      })
      .groupBy('v.date_visite')
      .orderBy('v.date_visite', 'ASC')
      .getRawMany();

    return {
      delegueId,
      totalVisits,
      totalDuration,
      averageDuration: totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0,
      prospectsVisited,
      dailyBreakdown,
      visits,
    };
  }

  async getProspectAnalytics(
    prospectId: string,
    filters: AnalyticsFilterDto,
  ): Promise<any> {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date('2000-01-01');
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-01-01');

    const visits = await this.visitRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.delegue', 'delegue')
      .where('v.prospect_id = :prospectId', { prospectId })
      .andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
      })
      .orderBy('v.date_visite', 'DESC')
      .getMany();

    const totalVisits = visits.length;
    const totalDuration = visits.reduce(
      (sum, v) => sum + (v.dureeSecondes || 0),
      0,
    );
    const uniqueDelegates = new Set(visits.map((v) => v.delegueId)).size;

    return {
      prospectId,
      totalVisits,
      totalDuration,
      averageDuration: totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0,
      uniqueDelegates,
      visitsByDelegate: await this.visitRepository
        .createQueryBuilder('v')
        .select('v.delegue_id', 'delegueId')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(v.duree_secondes), 0)', 'totalDuration')
        .where('v.prospect_id = :prospectId', { prospectId })
        .andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
          dateFrom: dateFrom.toISOString().slice(0, 10),
          dateTo: dateTo.toISOString().slice(0, 10),
        })
        .groupBy('v.delegue_id')
        .getRawMany(),
      visits,
    };
  }

  async getAnomalies(filters: AnalyticsFilterDto): Promise<any> {
    const dateFrom = filters.dateFrom
      ? new Date(filters.dateFrom)
      : new Date('2000-01-01');
    const dateTo = filters.dateTo
      ? new Date(filters.dateTo)
      : new Date('2100-01-01');

    const visitQuery = this.visitRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.prospect', 'prospect')
      .leftJoinAndSelect('v.delegue', 'delegue')
      .where('v.duree_secondes IS NOT NULL')
      .andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
      });

    if (filters.delegateId) {
      visitQuery.andWhere('v.delegue_id = :delegateId', {
        delegateId: filters.delegateId,
      });
    }

    const allVisits = await visitQuery.getMany();

    const shortVisits = allVisits.filter((v) => v.dureeSecondes! < 120);
    const longVisits = allVisits.filter((v) => v.dureeSecondes! > 10800);

    const stopsWithoutProspect = await this.gpsEventRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.delegue', 'delegue')
      .where('g.evenement = :anomalie', { anomalie: GpsEvenement.ANOMALIE })
      .andWhere('g.horodatage BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .orderBy('g.horodatage', 'DESC')
      .getMany();

    const gpsInconsistencies = await this.gpsEventRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.delegue', 'delegue')
      .where('g.vitesse IS NOT NULL')
      .andWhere('g.vitesse > 300')
      .andWhere('g.horodatage BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .orderBy('g.horodatage', 'DESC')
      .getMany();

    return {
      shortVisits: {
        count: shortVisits.length,
        items: shortVisits.map((v) => ({
          id: v.id,
          prospect: v.prospect?.nom,
          delegue: v.delegue?.nom,
          duration: v.dureeSecondes,
          date: v.dateVisite,
        })),
      },
      longVisits: {
        count: longVisits.length,
        items: longVisits.map((v) => ({
          id: v.id,
          prospect: v.prospect?.nom,
          delegue: v.delegue?.nom,
          duration: v.dureeSecondes,
          date: v.dateVisite,
        })),
      },
      stopsWithoutProspect: {
        count: stopsWithoutProspect.length,
        items: stopsWithoutProspect,
      },
      gpsInconsistencies: {
        count: gpsInconsistencies.length,
        items: gpsInconsistencies,
      },
    };
  }

  async exportData(filters: AnalyticsFilterDto): Promise<any> {
    const dashboard = await this.getDashboard(filters);
    const anomalies = await this.getAnomalies(filters);

    const visitQuery = this.visitRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.prospect', 'prospect')
      .leftJoinAndSelect('v.delegue', 'delegue')
      .where('1=1');

    if (filters.dateFrom && filters.dateTo) {
      visitQuery.andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }
    if (filters.delegateId) {
      visitQuery.andWhere('v.delegue_id = :delegateId', {
        delegateId: filters.delegateId,
      });
    }
    if (filters.prospectId) {
      visitQuery.andWhere('v.prospect_id = :prospectId', {
        prospectId: filters.prospectId,
      });
    }

    const visits = await visitQuery.orderBy('v.date_visite', 'DESC').getMany();

    return {
      generatedAt: new Date().toISOString(),
      filters,
      dashboard,
      anomalies,
      visits: visits.map((v) => ({
        id: v.id,
        prospect: v.prospect?.nom,
        delegue: v.delegue
          ? `${v.delegue.prenom} ${v.delegue.nom}`
          : null,
        dateVisite: v.dateVisite,
        heureArrivee: v.heureArrivee,
        heureDepart: v.heureDepart,
        duration: v.dureeSecondes,
        estComplete: v.estComplete,
      })),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { GpsEvent, GpsEvenement } from '../../database/entities/gps-event.entity';
import { Visit } from '../../database/entities/visit.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { ProspectTypeConfig } from '../../database/entities/prospect-type-config.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CreateGpsEventDto, SyncGpsEventsDto } from './gps.dto';
import { haversineDistance } from './haversine.util';

const TRIGGER_RADIUS_METERS = 4;

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(GpsEvent)
    private readonly gpsEventRepository: Repository<GpsEvent>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(ProspectTypeConfig)
    private readonly configRepository: Repository<ProspectTypeConfig>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async processEvent(
    currentUser: User,
    dto: CreateGpsEventDto,
  ): Promise<GpsEvent> {
    if (currentUser.role !== UserRole.DELEGUE) {
      throw new BadRequestException('Seuls les délégués peuvent envoyer des événements GPS');
    }

    const horodatage = new Date(dto.horodatage);

    const gpsEvent = this.gpsEventRepository.create({
      delegueId: currentUser.id,
      latitude: dto.latitude,
      longitude: dto.longitude,
      precision: dto.precision,
      vitesse: dto.vitesse ?? null,
      altitude: dto.altitude ?? null,
      evenement: dto.evenement,
      horodatage,
      prospectId: dto.prospectId ?? null,
      appareilId: dto.appareilId ?? null,
      estSynchronise: true,
    });

    if (dto.evenement === GpsEvenement.POSITION) {
      await this.handlePositionEvent(currentUser, dto, horodatage, gpsEvent);
    }

    return this.gpsEventRepository.save(gpsEvent);
  }

  private async handlePositionEvent(
    currentUser: User,
    dto: CreateGpsEventDto,
    horodatage: Date,
    gpsEvent: GpsEvent,
  ): Promise<void> {
    const activeVisit = await this.visitRepository.findOne({
      where: {
        delegueId: currentUser.id,
        estComplete: false,
      },
      relations: ['prospect'],
    });

    const hour = horodatage.getHours();
    const minutes = horodatage.getMinutes();
    const timeMinutes = hour * 60 + minutes;

    const pauseStartMinutes = 13 * 60;
    const pauseEndMinutes = 15 * 60;

    if (timeMinutes >= pauseStartMinutes && timeMinutes < pauseEndMinutes) {
      if (activeVisit) {
        gpsEvent.evenement = GpsEvenement.PAUSE_DEBUT;
        gpsEvent.visitId = activeVisit.id;
      }
      return;
    }

    if (activeVisit) {
      const prospect = activeVisit.prospect;

      const config = await this.configRepository.findOne({
        where: { type: prospect.type },
      });
      const zoneRadius = config?.rayonPresence ?? 50;

      const distance = haversineDistance(
        dto.latitude,
        dto.longitude,
        prospect.latitude!,
        prospect.longitude!,
      );

      if (distance > zoneRadius) {
        const now = new Date();
        const heureDepart = now.toTimeString().slice(0, 8);
        const heureArriveeParts = activeVisit.heureArrivee.split(':');
        const arriveeMinutes =
          parseInt(heureArriveeParts[0]) * 60 +
          parseInt(heureArriveeParts[1]);
        const departMinutes = now.getHours() * 60 + now.getMinutes();
        const dureeSecondes = (departMinutes - arriveeMinutes) * 60;

        activeVisit.heureDepart = heureDepart;
        activeVisit.dureeSecondes = Math.max(0, dureeSecondes);
        activeVisit.estComplete = true;
        activeVisit.latitudeDepart = dto.latitude;
        activeVisit.longitudeDepart = dto.longitude;
        await this.visitRepository.save(activeVisit);

        gpsEvent.evenement = GpsEvenement.VISITE_FIN;
        gpsEvent.visitId = activeVisit.id;
        gpsEvent.prospectId = prospect.id;
      } else {
        gpsEvent.prospectId = prospect.id;
        gpsEvent.visitId = activeVisit.id;
      }
      return;
    }

    const nearbyProspect = await this.findNearbyCalibratedProspect(
      dto.latitude,
      dto.longitude,
    );

    if (nearbyProspect) {
      const now = new Date();
      const heureArrivee = now.toTimeString().slice(0, 8);
      const dateVisite = now.toISOString().slice(0, 10);

      const visit = this.visitRepository.create({
        prospectId: nearbyProspect.id,
        delegueId: currentUser.id,
        dateVisite: new Date(dateVisite),
        heureArrivee,
        latitudeArrivee: dto.latitude,
        longitudeArrivee: dto.longitude,
        estComplete: false,
      });

      const savedVisit = await this.visitRepository.save(visit);

      gpsEvent.evenement = GpsEvenement.VISITE_DEBUT;
      gpsEvent.prospectId = nearbyProspect.id;
      gpsEvent.visitId = savedVisit.id;
    }
  }

  private async findNearbyCalibratedProspect(
    latitude: number,
    longitude: number,
  ): Promise<Prospect | null> {
    const calibratedProspects = await this.prospectRepository.find({
      where: {
        estCalibre: true,
        estArchive: false,
      },
    });

    for (const prospect of calibratedProspects) {
      if (prospect.latitude == null || prospect.longitude == null) continue;

      const distance = haversineDistance(
        latitude,
        longitude,
        prospect.latitude,
        prospect.longitude,
      );

      if (distance <= TRIGGER_RADIUS_METERS) {
        return prospect;
      }
    }

    return null;
  }

  async listEvents(
    filters: {
      delegueId?: string;
      dateDebut?: Date;
      dateFin?: Date;
      evenement?: GpsEvenement;
    },
  ): Promise<GpsEvent[]> {
    const where: any = {};

    if (filters.delegueId) {
      where.delegueId = filters.delegueId;
    }

    if (filters.dateDebut && filters.dateFin) {
      where.horodatage = Between(filters.dateDebut, filters.dateFin);
    } else if (filters.dateDebut) {
      where.horodatage = MoreThanOrEqual(filters.dateDebut);
    } else if (filters.dateFin) {
      where.horodatage = LessThanOrEqual(filters.dateFin);
    }

    if (filters.evenement) {
      where.evenement = filters.evenement;
    }

    return this.gpsEventRepository.find({
      where,
      relations: ['delegue', 'prospect', 'visit'],
      order: { horodatage: 'DESC' },
    });
  }

  async syncEvents(
    currentUser: User,
    syncDto: SyncGpsEventsDto,
  ): Promise<{ processed: number; duplicates: number; events: GpsEvent[] }> {
    if (currentUser.role !== UserRole.DELEGUE) {
      throw new BadRequestException('Seuls les délégués peuvent synchroniser des événements GPS');
    }

    const processed: GpsEvent[] = [];
    let duplicates = 0;

    for (const eventDto of syncDto.events) {
      const horodatage = new Date(eventDto.horodatage);
      const fiveSecondsBefore = new Date(horodatage.getTime() - 5000);
      const fiveSecondsAfter = new Date(horodatage.getTime() + 5000);

      const existing = await this.gpsEventRepository.findOne({
        where: {
          delegueId: currentUser.id,
          horodatage: Between(fiveSecondsBefore, fiveSecondsAfter),
          evenement: eventDto.evenement,
        },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      const gpsEvent = this.gpsEventRepository.create({
        delegueId: currentUser.id,
        latitude: eventDto.latitude,
        longitude: eventDto.longitude,
        precision: eventDto.precision,
        vitesse: eventDto.vitesse ?? null,
        altitude: eventDto.altitude ?? null,
        evenement: eventDto.evenement,
        horodatage,
        prospectId: eventDto.prospectId ?? null,
        appareilId: syncDto.appareilId,
        estSynchronise: true,
      });

      processed.push(await this.gpsEventRepository.save(gpsEvent));
    }

    return {
      processed: processed.length,
      duplicates,
      events: processed,
    };
  }

  async getTrajectory(
    delegueId: string,
    date: string,
  ): Promise<GpsEvent[]> {
    const user = await this.userRepository.findOne({
      where: { id: delegueId },
    });

    if (!user) {
      throw new NotFoundException('Délégué non trouvé');
    }

    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    return this.gpsEventRepository.find({
      where: {
        delegueId,
        horodatage: Between(startDate, endDate),
      },
      relations: ['prospect', 'visit'],
      order: { horodatage: 'ASC' },
    });
  }
}

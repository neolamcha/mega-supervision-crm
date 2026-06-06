import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calibration } from '../../database/entities/calibration.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { CalibrateProspectDto } from './calibration.dto';

@Injectable()
export class CalibrationService {
  constructor(
    @InjectRepository(Calibration)
    private readonly calibrationRepository: Repository<Calibration>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async calibrate(
    currentUser: User,
    calibrateDto: CalibrateProspectDto,
  ): Promise<Calibration> {
    if (currentUser.role !== UserRole.DELEGUE) {
      throw new ForbiddenException('Seuls les délégués peuvent calibrer des prospects');
    }

    const prospect = await this.prospectRepository.findOne({
      where: { id: calibrateDto.prospectId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    if (prospect.estCalibre) {
      throw new BadRequestException('Ce prospect est déjà calibré');
    }

    const now = new Date();

    const calibration = this.calibrationRepository.create({
      prospectId: prospect.id,
      delegueId: currentUser.id,
      latitude: calibrateDto.latitude,
      longitude: calibrateDto.longitude,
      dateCalibrage: now,
      estActive: true,
    });

    await this.calibrationRepository.save(calibration);

    prospect.latitude = calibrateDto.latitude;
    prospect.longitude = calibrateDto.longitude;
    prospect.estCalibre = true;
    prospect.dateCalibrage = now;
    prospect.calibrateurId = currentUser.id;
    await this.prospectRepository.save(prospect);

    const auditLog = this.auditLogRepository.create({
      utilisateurId: currentUser.id,
      action: 'CALIBRAGE_PROSPECT',
      entite: 'prospect',
      entiteId: prospect.id,
      details: {
        prospectNom: prospect.nom,
        latitude: calibrateDto.latitude,
        longitude: calibrateDto.longitude,
      },
      coordonneesGPS: {
        latitude: calibrateDto.latitude,
        longitude: calibrateDto.longitude,
      },
    });
    await this.auditLogRepository.save(auditLog);

    return calibration;
  }

  async getCalibrationHistory(prospectId: string): Promise<Calibration[]> {
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return this.calibrationRepository.find({
      where: { prospectId },
      relations: ['delegue'],
      order: { dateCalibrage: 'DESC' },
    });
  }

  async getMyCalibrations(currentUser: User): Promise<Calibration[]> {
    return this.calibrationRepository.find({
      where: { delegueId: currentUser.id },
      relations: ['prospect'],
      order: { dateCalibrage: 'DESC' },
    });
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Visit } from './visit.entity';
import { Calibration } from './calibration.entity';
import { GpsEvent } from './gps-event.entity';

export enum ProspectType {
  PHARMACIE = 'pharmacie',
  DEPOT = 'depot',
  CLINIQUE = 'clinique',
  HOPITAL = 'hopital',
  AUTRE = 'autre',
}

@Entity('prospects')
@Index(['type', 'region', 'ville', 'estArchive'])
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nom', type: 'varchar', length: 255 })
  nom: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ProspectType,
  })
  type: ProspectType;

  @Column({ name: 'adresse', type: 'varchar', length: 500 })
  adresse: string;

  @Column({ name: 'ville', type: 'varchar', length: 255 })
  ville: string;

  @Column({ name: 'region', type: 'varchar', length: 255 })
  region: string;

  @Column({ name: 'telephone', type: 'varchar', length: 50 })
  telephone: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'est_archive', type: 'boolean', default: false })
  estArchive: boolean;

  @Column({
    name: 'latitude',
    type: 'float',
    nullable: true,
  })
  latitude: number | null;

  @Column({
    name: 'longitude',
    type: 'float',
    nullable: true,
  })
  longitude: number | null;

  @Column({ name: 'est_calibre', type: 'boolean', default: false })
  estCalibre: boolean;

  @Column({ name: 'date_calibrage', type: 'timestamp', nullable: true })
  dateCalibrage: Date | null;

  @Column({ name: 'calibrateur_id', type: 'uuid', nullable: true })
  calibrateurId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'calibrateur_id' })
  calibrateur: User | null;

  @OneToMany(() => Visit, (visit) => visit.prospect)
  visits: Visit[];

  @OneToMany(() => Calibration, (calibration) => calibration.prospect)
  calibrations: Calibration[];

  @OneToMany(() => GpsEvent, (gpsEvent) => gpsEvent.prospect)
  gpsEvents: GpsEvent[];
}

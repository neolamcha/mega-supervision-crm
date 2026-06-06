import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Prospect } from './prospect.entity';
import { Visit } from './visit.entity';

export enum GpsEvenement {
  ENTREE_ZONE = 'entree_zone',
  SORTIE_ZONE = 'sortie_zone',
  CALIBRAGE = 'calibrage',
  VISITE_DEBUT = 'visite_debut',
  VISITE_FIN = 'visite_fin',
  PAUSE_DEBUT = 'pause_debut',
  PAUSE_FIN = 'pause_fin',
  POSITION = 'position',
  ANOMALIE = 'anomalie',
}

@Entity('gps_events')
@Index(['delegueId', 'horodatage', 'evenement', 'prospectId'])
export class GpsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'delegue_id', type: 'uuid' })
  delegueId: string;

  @Column({ name: 'prospect_id', type: 'uuid', nullable: true })
  prospectId: string | null;

  @Column({ name: 'latitude', type: 'float' })
  latitude: number;

  @Column({ name: 'longitude', type: 'float' })
  longitude: number;

  @Column({ name: 'precision', type: 'float' })
  precision: number;

  @Column({ name: 'vitesse', type: 'float', nullable: true })
  vitesse: number | null;

  @Column({ name: 'altitude', type: 'float', nullable: true })
  altitude: number | null;

  @Column({
    name: 'evenement',
    type: 'enum',
    enum: GpsEvenement,
  })
  evenement: GpsEvenement;

  @Column({ name: 'horodatage', type: 'timestamp' })
  horodatage: Date;

  @Column({ name: 'visit_id', type: 'uuid', nullable: true })
  visitId: string | null;

  @Column({ name: 'est_synchronise', type: 'boolean', default: true })
  estSynchronise: boolean;

  @Column({ name: 'appareil_id', type: 'varchar', length: 255, nullable: true })
  appareilId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.gpsEvents)
  @JoinColumn({ name: 'delegue_id' })
  delegue: User;

  @ManyToOne(() => Prospect, (prospect) => prospect.gpsEvents, { nullable: true })
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect | null;

  @ManyToOne(() => Visit, (visit) => visit.gpsEvents, { nullable: true })
  @JoinColumn({ name: 'visit_id' })
  visit: Visit | null;
}

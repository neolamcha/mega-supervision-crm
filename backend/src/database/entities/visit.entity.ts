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
import { Prospect } from './prospect.entity';
import { User } from './user.entity';
import { GpsEvent } from './gps-event.entity';

@Entity('visits')
@Index(['dateVisite', 'delegueId', 'prospectId', 'estComplete'])
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prospect_id', type: 'uuid' })
  prospectId: string;

  @Column({ name: 'delegue_id', type: 'uuid' })
  delegueId: string;

  @Column({ name: 'date_visite', type: 'date' })
  dateVisite: Date;

  @Column({ name: 'heure_arrivee', type: 'time' })
  heureArrivee: string;

  @Column({ name: 'heure_depart', type: 'time', nullable: true })
  heureDepart: string | null;

  @Column({ name: 'duree_secondes', type: 'integer', nullable: true })
  dureeSecondes: number | null;

  @Column({ name: 'latitude_arrivee', type: 'float' })
  latitudeArrivee: number;

  @Column({ name: 'longitude_arrivee', type: 'float' })
  longitudeArrivee: number;

  @Column({ name: 'latitude_depart', type: 'float', nullable: true })
  latitudeDepart: number | null;

  @Column({ name: 'longitude_depart', type: 'float', nullable: true })
  longitudeDepart: number | null;

  @Column({ name: 'est_complete', type: 'boolean', default: false })
  estComplete: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Prospect, (prospect) => prospect.visits)
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect;

  @ManyToOne(() => User, (user) => user.visits)
  @JoinColumn({ name: 'delegue_id' })
  delegue: User;

  @OneToMany(() => GpsEvent, (gpsEvent) => gpsEvent.visit)
  gpsEvents: GpsEvent[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Prospect } from './prospect.entity';
import { User } from './user.entity';

@Entity('calibrations')
export class Calibration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prospect_id', type: 'uuid' })
  prospectId: string;

  @Column({ name: 'delegue_id', type: 'uuid' })
  delegueId: string;

  @Column({ name: 'latitude', type: 'float' })
  latitude: number;

  @Column({ name: 'longitude', type: 'float' })
  longitude: number;

  @Column({ name: 'date_calibrage', type: 'timestamp' })
  dateCalibrage: Date;

  @Column({ name: 'est_active', type: 'boolean', default: true })
  estActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Prospect, (prospect) => prospect.calibrations)
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect;

  @ManyToOne(() => User, (user) => user.calibrations)
  @JoinColumn({ name: 'delegue_id' })
  delegue: User;
}

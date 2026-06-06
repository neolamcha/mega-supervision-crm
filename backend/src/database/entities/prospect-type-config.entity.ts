import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProspectType } from './prospect.entity';

@Entity('prospect_type_configs')
export class ProspectTypeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ProspectType,
    unique: true,
  })
  type: ProspectType;

  @Column({ name: 'rayon_presence', type: 'integer', default: 50 })
  rayonPresence: number;

  @Column({ name: 'pause_start', type: 'varchar', length: 5, default: '13:00' })
  pauseStart: string;

  @Column({ name: 'pause_end', type: 'varchar', length: 5, default: '15:00' })
  pauseEnd: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}

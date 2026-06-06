import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum SyncStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'delegue_id', type: 'uuid' })
  delegueId: string;

  @Column({ name: 'appareil_id', type: 'varchar', length: 255 })
  appareilId: string;

  @Column({ name: 'dernier_sync', type: 'timestamp' })
  dernierSync: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SyncStatus,
  })
  status: SyncStatus;

  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'delegue_id' })
  delegue: User;
}

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

@Entity('audit_logs')
@Index(['utilisateurId', 'action', 'createdAt', 'entite'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'utilisateur_id', type: 'uuid', nullable: true })
  utilisateurId: string | null;

  @Column({ name: 'action', type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'entite', type: 'varchar', length: 100 })
  entite: string;

  @Column({ name: 'entite_id', type: 'uuid', nullable: true })
  entiteId: string | null;

  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ name: 'coordonnees_gps', type: 'jsonb', nullable: true })
  coordonneesGPS: Record<string, any> | null;

  @Column({ name: 'adresse_ip', type: 'varchar', length: 45, nullable: true })
  adresseIP: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User | null;
}

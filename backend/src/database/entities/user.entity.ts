import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Visit } from './visit.entity';
import { Calibration } from './calibration.entity';
import { GpsEvent } from './gps-event.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  DIRECTEUR = 'directeur',
  DELEGUE = 'delegue',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nom', type: 'varchar', length: 255 })
  nom: string;

  @Column({ name: 'prenom', type: 'varchar', length: 255 })
  prenom: string;

  @Column({ name: 'telephone', type: 'varchar', length: 50 })
  telephone: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'login', type: 'varchar', length: 100, unique: true })
  login: string;

  @Column({ name: 'mot_de_passe', type: 'varchar', length: 255 })
  motDePasse: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ name: 'est_actif', type: 'boolean', default: true })
  estActif: boolean;

  @Column({ name: 'premier_connexion', type: 'boolean', default: true })
  premierConnexion: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Visit, (visit) => visit.delegue)
  visits: Visit[];

  @OneToMany(() => Calibration, (calibration) => calibration.delegue)
  calibrations: Calibration[];

  @OneToMany(() => GpsEvent, (gpsEvent) => gpsEvent.delegue)
  gpsEvents: GpsEvent[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.utilisateur)
  auditLogs: AuditLog[];
}

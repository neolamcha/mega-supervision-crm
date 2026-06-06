export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  login: string;
  role: 'directeur' | 'delegue';
  estActif: boolean;
  premierConnexion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prospect {
  id: string;
  nom: string;
  type: ProspectType;
  adresse: string;
  ville: string;
  region: string;
  telephone: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  estCalibre: boolean;
  dateCalibrage?: string;
  estArchive: boolean;
  calibrateurId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProspectType = 'pharmacie' | 'depot' | 'clinique' | 'hopital' | 'autre';

export interface ProspectTypeConfig {
  id: string;
  type: ProspectType;
  rayonPresence: number;
  pauseStart: string;
  pauseEnd: string;
}

export interface Visit {
  id: string;
  prospectId: string;
  delegueId: string;
  dateVisite: string;
  heureArrivee: string;
  heureDepart?: string;
  dureeSecondes?: number;
  latitudeArrivee: number;
  longitudeArrivee: number;
  latitudeDepart?: number;
  longitudeDepart?: number;
  estComplete: boolean;
  notes?: string;
  prospect?: Prospect;
  delegue?: User;
  createdAt: string;
  updatedAt: string;
}

export interface GpsEvent {
  id: string;
  delegueId: string;
  prospectId?: string;
  latitude: number;
  longitude: number;
  precision: number;
  vitesse?: number;
  altitude?: number;
  evenement: GpsEvenement;
  horodatage: string;
  visitId?: string;
  estSynchronise: boolean;
  appareilId?: string;
}

export type GpsEvenement = 'entree_zone' | 'sortie_zone' | 'calibrage' | 'visite_debut' | 'visite_fin' | 'pause_debut' | 'pause_fin' | 'position' | 'anomalie';

export interface Calibration {
  id: string;
  prospectId: string;
  delegueId: string;
  latitude: number;
  longitude: number;
  dateCalibrage: string;
  estActive: boolean;
}

export interface DashboardAnalytics {
  totalVisits: number;
  totalTerrainTime: number;
  totalProspectTime: number;
  lostTime: number;
  prospectsVisited: number;
  prospectsNotVisited: number;
  averageVisitDuration: number;
  visitesParJour?: { date: string; count: number }[];
  visitesParType?: { type: string; count: number }[];
  topDelegates?: { delegate: any; totalVisites: number; dureeTotal: number }[];
}

export type Analytics = DashboardAnalytics;

export interface Anomaly {
  id: string;
  type: 'visite_courte' | 'visite_longue' | 'stop_sans_prospect' | 'incoherence_gps' | 'hors_zone' | 'pause_inattendue';
  visitId?: string;
  delegueId: string;
  prospectId?: string;
  description: string;
  date: string;
  duree?: number;
  severite: 'faible' | 'moyenne' | 'elevee';
}

export interface AuditLog {
  id: string;
  utilisateurId?: string;
  action: string;
  entite: string;
  entiteId?: string;
  details?: any;
  coordonneesGPS?: { lat: number; lng: number };
  adresseIP?: string;
  createdAt: string;
}

export interface PdfReport {
  filename: string;
  delegateNom: string;
  delegatePrenom: string;
  dateDebut: string;
  dateFin: string;
  dateGeneration: string;
  taille: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  timestamp: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

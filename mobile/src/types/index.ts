export interface User {
  id: string;
  login: string;
  nom: string;
  prenom: string;
  role: string;
  email: string;
  telephone: string;
  premierConnexion: boolean;
  actif: boolean;
}

export interface Prospect {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  ville: string;
  region: string;
  telephone: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  estCalibre: boolean;
  dateCalibrage: string | null;
  updatedAt: string;
  distance?: number;
}

export interface Calibration {
  id: string;
  prospectId: string;
  latitude: number;
  longitude: number;
  dateCalibrage: string;
  estActive: boolean;
}

export interface Visit {
  id: string;
  prospectId: string;
  dateVisite: string;
  heureArrivee: string;
  heureDepart: string | null;
  dureeSecondes: number | null;
  estComplete: boolean;
  latitudeArrivee: number;
  longitudeArrivee: number;
  prospectNom?: string;
  prospectType?: string;
  prospectVille?: string;
}

export interface GpsEvent {
  id: string;
  latitude: number;
  longitude: number;
  precision: number;
  vitesse: number;
  altitude: number;
  evenement: GpsEventType;
  horodatage: string;
  prospectId: string | null;
  visitId: string | null;
  estSynchronise: boolean;
}

export enum GpsEventType {
  POSITION = 'position',
  VISITE_DEBUT = 'visite_debut',
  VISITE_FIN = 'visite_fin',
  PAUSE_DEBUT = 'pause_debut',
  PAUSE_FIN = 'pause_fin',
}

export interface SyncLog {
  id: string;
  status: 'success' | 'partial' | 'error';
  details: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  login: string;
  motDePasse: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface CalibrateRequest {
  prospectId: string;
  latitude: number;
  longitude: number;
}

export interface SyncGpsEventsRequest {
  events: Array<{
    latitude: number;
    longitude: number;
    precision: number;
    vitesse: number;
    altitude: number;
    evenement: string;
    horodatage: string;
    prospectId: string | null;
    visitId: string | null;
  }>;
  visits: Array<{
    id: string;
    prospectId: string;
    dateVisite: string;
    heureArrivee: string;
    heureDepart: string | null;
    dureeSecondes: number | null;
    estComplete: boolean;
    latitudeArrivee: number;
    longitudeArrivee: number;
  }>;
}

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: { token: string };
  MainTabs: undefined;
  ProspectDetail: { prospectId: string };
  Calibration: { prospectId: string };
  ActiveVisit: { visitId: string; prospectId: string };
};

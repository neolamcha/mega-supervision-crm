// Pour le développement local sur émulateur Android : http://10.0.2.2:3000/api/v1
// Pour le développement local sur appareil physique : http://<VOTRE_IP>:3000/api/v1
// Pour la production : https://api.mega-supervision.fr/api/v1
export const API_BASE_URL = 'https://backend-production-6be48.up.railway.app/api/v1';

export const TRIGGER_RADIUS = 4;

export const PAUSE_START = '13:00';

export const PAUSE_END = '15:00';

export const GPS_UPDATE_INTERVAL = 5000;

export const GPS_SIGNIFICANT_CHANGE = 10;

export const MIN_VISIT_DURATION_SHORT = 120;

export const MAX_VISIT_DURATION_LONG = 10800;

export enum GpsEventType {
  POSITION = 'position',
  VISITE_DEBUT = 'visite_debut',
  VISITE_FIN = 'visite_fin',
  PAUSE_DEBUT = 'pause_debut',
  PAUSE_FIN = 'pause_fin',
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export const PRIMARY_COLOR = '#1e40af';

export const COLORS = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

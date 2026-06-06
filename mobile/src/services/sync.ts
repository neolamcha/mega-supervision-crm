import NetInfo from '@react-native-community/netinfo';
import { gpsApi, prospectsApi, authApi } from './api';
import {
  getUnsynchronizedGpsEvents,
  getUnsynchronizedVisits,
  markGpsEventsSynced,
  markVisitsSynced,
  insertSyncLog,
  upsertProspects,
  getLatestSyncLog,
} from './database';

let isSyncing = false;
let lastSyncTime: string | null = null;
let listeners: Array<(status: SyncStatus) => void> = [];

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export type SyncStatusCallback = (status: SyncStatus) => void;

export function addSyncListener(callback: SyncStatusCallback): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners(status: SyncStatus) {
  listeners.forEach((l) => l(status));
}

export async function syncAll(): Promise<SyncStatus> {
  if (isSyncing) return SyncStatus.SYNCING;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    notifyListeners(SyncStatus.OFFLINE);
    return SyncStatus.OFFLINE;
  }

  isSyncing = true;
  notifyListeners(SyncStatus.SYNCING);

  try {
    const gpsEvents = await getUnsynchronizedGpsEvents();
    const visits = await getUnsynchronizedVisits();

    let hasError = false;

    if (gpsEvents.length > 0 || visits.length > 0) {
      try {
        const response = await gpsApi.syncEvents({
          events: gpsEvents.map((e) => ({
            latitude: e.latitude,
            longitude: e.longitude,
            precision: e.precision,
            vitesse: e.vitesse,
            altitude: e.altitude,
            evenement: e.evenement,
            horodatage: e.horodatage,
            prospectId: e.prospectId,
            visitId: e.visitId,
          })),
          visits: visits.map((v) => ({
            id: v.id,
            prospectId: v.prospectId,
            dateVisite: v.dateVisite,
            heureArrivee: v.heureArrivee,
            heureDepart: v.heureDepart,
            dureeSecondes: v.dureeSecondes,
            estComplete: v.estComplete,
            latitudeArrivee: v.latitudeArrivee,
            longitudeArrivee: v.longitudeArrivee,
          })),
        });

        if (response.success) {
          const gpsIds = gpsEvents.map((e) => e.id);
          const visitIds = visits.map((v) => v.id);

          if (gpsIds.length > 0) await markGpsEventsSynced(gpsIds);
          if (visitIds.length > 0) await markVisitsSynced(visitIds);
        } else {
          hasError = true;
        }
      } catch {
        hasError = true;
      }
    }

    try {
      const prospectsResponse = await prospectsApi.getList({ limit: 1000 });
      if (prospectsResponse.success && prospectsResponse.data) {
        await upsertProspects(prospectsResponse.data);
      }
    } catch {
      hasError = true;
    }

    const now = new Date().toISOString();
    lastSyncTime = now;

    const status = hasError ? 'partial' : 'success';
    const details = hasError
      ? 'Synchronisation partielle - certaines données n\'ont pas pu être synchronisées'
      : `Synchronisation réussie - ${gpsEvents.length} événements GPS, ${visits.length} visites`;

    await insertSyncLog({
      id: `sync_${Date.now()}`,
      status,
      details,
      createdAt: now,
    });

    const finalStatus = hasError ? SyncStatus.ERROR : SyncStatus.SUCCESS;
    notifyListeners(finalStatus);
    isSyncing = false;
    return finalStatus;
  } catch (error: any) {
    const now = new Date().toISOString();
    await insertSyncLog({
      id: `sync_${Date.now()}`,
      status: 'error',
      details: error?.message || 'Erreur de synchronisation inconnue',
      createdAt: now,
    });

    notifyListeners(SyncStatus.ERROR);
    isSyncing = false;
    return SyncStatus.ERROR;
  }
}

export function getLastSyncTime(): string | null {
  return lastSyncTime;
}

export async function loadLastSyncTime(): Promise<string | null> {
  const log = await getLatestSyncLog();
  if (log && log.status === 'success') {
    lastSyncTime = log.createdAt;
    return log.createdAt;
  }
  return null;
}

export function isCurrentlySyncing(): boolean {
  return isSyncing;
}

export async function startPeriodicSync(intervalMs: number = 300000): Promise<() => void> {
  const intervalId = setInterval(() => {
    syncAll().catch(() => {});
  }, intervalMs);

  return () => clearInterval(intervalId);
}

export async function checkConnectivity(): Promise<boolean> {
  const netState = await NetInfo.fetch();
  return netState.isConnected ?? false;
}

export function addConnectivityListener(callback: (isConnected: boolean) => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });
  return unsubscribe;
}

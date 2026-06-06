import BackgroundGeolocation from 'react-native-background-geolocation';
import { GpsEventType, TRIGGER_RADIUS, PAUSE_START, PAUSE_END } from '../utils/constants';
import { haversineDistance } from '../utils/haversine';
import { getCalibratedProspects, getActiveVisit, insertGpsEvent, insertVisit, updateVisit } from './database';
import { getCurrentPositionSync } from './location';

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateVisitId(): string {
  return `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function isPauseTime(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const [pauseH, pauseM] = PAUSE_START.split(':').map(Number);
  const [endH, endM] = PAUSE_END.split(':').map(Number);
  const pauseStart = pauseH * 60 + pauseM;
  const pauseEnd = endH * 60 + endM;

  return totalMinutes >= pauseStart && totalMinutes < pauseEnd;
}

let isPaused = false;
let activeVisitId: string | null = null;
let activeProspectId: string | null = null;
let trackedToday: Set<string> = new Set();

export async function handleProximityEntry(prospectId: string): Promise<void> {
  if (activeVisitId) return;

  const prospect = await getCalibratedProspects().then((ps) =>
    ps.find((p) => p.id === prospectId),
  );
  if (!prospect) return;

  const now = new Date();
  const nowISO = now.toISOString();

  activeVisitId = generateVisitId();
  activeProspectId = prospectId;

  const eventType = isPauseTime() ? GpsEventType.PAUSE_DEBUT : GpsEventType.VISITE_DEBUT;

  const currentPos = getCurrentPositionSync();

  await insertVisit({
    id: activeVisitId,
    prospectId,
    dateVisite: nowISO.substring(0, 10),
    heureArrivee: nowISO,
    heureDepart: null,
    dureeSecondes: null,
    estComplete: false,
    latitudeArrivee: currentPos?.latitude || prospect.latitude,
    longitudeArrivee: currentPos?.longitude || prospect.longitude,
    estSynchronise: false,
  });

  await insertGpsEvent({
    id: generateId(),
    latitude: currentPos?.latitude || 0,
    longitude: currentPos?.longitude || 0,
    precision: 0,
    vitesse: 0,
    altitude: 0,
    evenement: eventType,
    horodatage: nowISO,
    prospectId,
    visitId: activeVisitId,
    estSynchronise: false,
  });

  if (eventType === GpsEventType.PAUSE_DEBUT) {
    isPaused = true;
  }
}

export async function handleProximityExit(prospectId: string): Promise<void> {
  if (!activeVisitId || activeProspectId !== prospectId) return;

  const now = new Date();
  const nowISO = now.toISOString();

  const activeVisit = await getActiveVisit();
  if (!activeVisit) {
    activeVisitId = null;
    activeProspectId = null;
    return;
  }

  const arrivalTime = new Date(activeVisit.heureArrivee).getTime();
  const durationSeconds = Math.floor((now.getTime() - arrivalTime) / 1000);

  const eventType = isPauseTime() ? GpsEventType.PAUSE_FIN : GpsEventType.VISITE_FIN;

  const currentPos = getCurrentPositionSync();

  await updateVisit({
    id: activeVisitId,
    heureDepart: nowISO,
    dureeSecondes: durationSeconds,
    estComplete: true,
    estSynchronise: false,
  });

  await insertGpsEvent({
    id: generateId(),
    latitude: currentPos?.latitude || 0,
    longitude: currentPos?.longitude || 0,
    precision: 0,
    vitesse: 0,
    altitude: 0,
    evenement: eventType,
    horodatage: nowISO,
    prospectId,
    visitId: activeVisitId,
    estSynchronise: false,
  });

  activeVisitId = null;
  activeProspectId = null;
  isPaused = false;
}

export async function recordPosition(): Promise<void> {
  const currentPos = getCurrentPositionSync();
  if (!currentPos) return;

  const now = new Date();
  const nowISO = now.toISOString();

  const shouldPause = isPauseTime();

  if (shouldPause && !isPaused && activeVisitId) {
    await insertGpsEvent({
      id: generateId(),
      latitude: currentPos.latitude,
      longitude: currentPos.longitude,
      precision: 0,
      vitesse: 0,
      altitude: 0,
      evenement: GpsEventType.PAUSE_DEBUT,
      horodatage: nowISO,
      prospectId: activeProspectId,
      visitId: activeVisitId,
      estSynchronise: false,
    });
    isPaused = true;
    return;
  }

  if (!shouldPause && isPaused && activeVisitId) {
    await insertGpsEvent({
      id: generateId(),
      latitude: currentPos.latitude,
      longitude: currentPos.longitude,
      precision: 0,
      vitesse: 0,
      altitude: 0,
      evenement: GpsEventType.PAUSE_FIN,
      horodatage: nowISO,
      prospectId: activeProspectId,
      visitId: activeVisitId,
      estSynchronise: false,
    });
    isPaused = false;
    return;
  }

  if (activeVisitId) {
    await insertGpsEvent({
      id: generateId(),
      latitude: currentPos.latitude,
      longitude: currentPos.longitude,
      precision: 0,
      vitesse: 0,
      altitude: 0,
      evenement: GpsEventType.POSITION,
      horodatage: nowISO,
      prospectId: activeProspectId,
      visitId: activeVisitId,
      estSynchronise: false,
    });
  }
}

export async function checkProximity(): Promise<void> {
  const currentPos = getCurrentPositionSync();
  if (!currentPos) return;

  try {
    const prospects = await getCalibratedProspects();
    for (const prospect of prospects) {
      if (!prospect.latitude || !prospect.longitude) continue;

      const distance = haversineDistance(
        currentPos.latitude,
        currentPos.longitude,
        prospect.latitude,
        prospect.longitude,
      );

      if (distance <= TRIGGER_RADIUS) {
        if (!trackedToday.has(prospect.id) && !activeVisitId) {
          trackedToday.add(prospect.id);
          await handleProximityEntry(prospect.id);
        }
      } else if (activeProspectId === prospect.id && distance > TRIGGER_RADIUS * 2) {
        await handleProximityExit(prospect.id);
      }
    }
  } catch (error) {
    console.warn('Background proximity check error:', error);
  }
}

export async function startBackgroundTracking(): Promise<void> {
  BackgroundGeolocation.onLocation(async (location) => {
    if (location.coords) {
      await recordPosition();
      await checkProximity();
    }
  }, (error) => {
    console.warn('Background location error:', error);
  });

  BackgroundGeolocation.onGeofence(async (event) => {
    const prospectId = event.extras?.prospectId;
    if (!prospectId) return;

    if (event.action === 'ENTER') {
      await handleProximityEntry(prospectId);
    } else if (event.action === 'EXIT') {
      await handleProximityExit(prospectId);
    }
  });

  BackgroundGeolocation.onHeartbeat(async () => {
    await recordPosition();
    await checkProximity();
  });
}

export function getActiveVisitId(): string | null {
  return activeVisitId;
}

export function getActiveProspectId(): string | null {
  return activeProspectId;
}

export function isCurrentlyPaused(): boolean {
  return isPaused;
}

export function endVisitManually(): Promise<void> {
  if (activeProspectId) {
    return handleProximityExit(activeProspectId);
  }
  return Promise.resolve();
}

export function resetDailyTracking(): void {
  trackedToday.clear();
}

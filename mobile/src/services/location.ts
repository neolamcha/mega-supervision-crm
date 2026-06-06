import { Platform, PermissionsAndroid } from 'react-native';
import BackgroundGeolocation, {
  Location,
  LocationErrorCode,
} from 'react-native-background-geolocation';
import { GPS_UPDATE_INTERVAL, GPS_SIGNIFICANT_CHANGE, TRIGGER_RADIUS } from '../utils/constants';
import { haversineDistance } from '../utils/haversine';
import { getCalibratedProspects } from './database';

let isTracking = false;
let currentPosition: { latitude: number; longitude: number } | null = null;
let positionListeners: Array<(pos: { latitude: number; longitude: number; accuracy?: number }) => void> = [];
let proximityListeners: Array<(prospectId: string, distance: number) => void> = [];
let proximityInterval: ReturnType<typeof setInterval> | null = null;

export type PositionCallback = (pos: { latitude: number; longitude: number; accuracy?: number }) => void;
export type ProximityCallback = (prospectId: string, distance: number) => void;

export function addPositionListener(callback: PositionCallback): () => void {
  positionListeners.push(callback);
  return () => {
    positionListeners = positionListeners.filter((l) => l !== callback);
  };
}

export function addProximityListener(callback: ProximityCallback): () => void {
  proximityListeners.push(callback);
  return () => {
    proximityListeners = proximityListeners.filter((l) => l !== callback);
  };
}

function notifyPosition(pos: { latitude: number; longitude: number; accuracy?: number }) {
  currentPosition = { latitude: pos.latitude, longitude: pos.longitude };
  positionListeners.forEach((l) => l(pos));
}

function notifyProximity(prospectId: string, distance: number) {
  proximityListeners.forEach((l) => l(prospectId, distance));
}

export async function requestLocationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const fine = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permission de localisation',
          message: 'Mega Supervision a besoin d\'accéder à votre position pour le suivi des visites.',
          buttonPositive: 'Accepter',
          buttonNegative: 'Refuser',
        },
      );

      const background = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Permission de localisation en arrière-plan',
          message: 'Mega Supervision a besoin de suivre votre position même lorsque l\'application est en arrière-plan.',
          buttonPositive: 'Accepter',
          buttonNegative: 'Refuser',
        },
      );

      return fine === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  return true;
}

export async function startTracking(): Promise<boolean> {
  if (isTracking) return true;

  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) return false;

  try {
    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: GPS_SIGNIFICANT_CHANGE,
      stationaryRadius: 25,
      locationUpdateInterval: GPS_UPDATE_INTERVAL,
      fastestLocationUpdateInterval: 2000,
      foregroundService: true,
      foregroundServiceTitle: 'Mega Supervision',
      foregroundServiceText: 'Suivi de position actif',
      startOnBoot: false,
      stopOnTerminate: false,
      enableHeadless: true,
      notificationPriority: 'PRIORITY_HIGH',
      showsBackgroundLocationIndicator: true,
      pausesLocationUpdatesAutomatically: false,
      debug: false,
    });

    BackgroundGeolocation.onLocation((location: Location) => {
      if (location.coords) {
        notifyPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        });
      }
    }, (error: LocationErrorCode) => {
      console.warn('BackgroundGeolocation location error:', error);
    });

    await BackgroundGeolocation.start();
    isTracking = true;

    startProximityChecking();

    return true;
  } catch (error) {
    console.error('Failed to start GPS tracking:', error);
    return false;
  }
}

export async function stopTracking(): Promise<void> {
  if (!isTracking) return;

  try {
    await BackgroundGeolocation.stop();
    isTracking = false;
    stopProximityChecking();
  } catch (error) {
    console.error('Failed to stop GPS tracking:', error);
  }
}

export function isTrackingActive(): boolean {
  return isTracking;
}

export function getCurrentPositionSync(): { latitude: number; longitude: number } | null {
  return currentPosition;
}

export function getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
  return new Promise((resolve, reject) => {
    BackgroundGeolocation.getCurrentPosition(
      { samples: 1, timeout: 10000 },
      (location: Location) => {
        const pos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        };
        currentPosition = { latitude: pos.latitude, longitude: pos.longitude };
        resolve(pos);
      },
      (error: LocationErrorCode) => {
        if (currentPosition) {
          resolve({ ...currentPosition, accuracy: 0 });
        } else {
          reject(new Error('Impossible d\'obtenir la position: ' + JSON.stringify(error)));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return haversineDistance(lat1, lon1, lat2, lon2);
}

async function startProximityChecking() {
  stopProximityChecking();

  proximityInterval = setInterval(async () => {
    if (!currentPosition) return;

    try {
      const prospects = await getCalibratedProspects();
      for (const prospect of prospects) {
        if (prospect.latitude && prospect.longitude) {
          const distance = haversineDistance(
            currentPosition.latitude,
            currentPosition.longitude,
            prospect.latitude,
            prospect.longitude,
          );

          if (distance <= TRIGGER_RADIUS) {
            notifyProximity(prospect.id, distance);
          }
        }
      }
    } catch (error) {
      console.warn('Proximity check error:', error);
    }
  }, 5000);
}

function stopProximityChecking() {
  if (proximityInterval) {
    clearInterval(proximityInterval);
    proximityInterval = null;
  }
}

export async function setupGeofences(): Promise<void> {
  try {
    const prospects = await getCalibratedProspects();

    const geofences = prospects
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        identifier: `prospect_${p.id}`,
        latitude: p.latitude,
        longitude: p.longitude,
        radius: TRIGGER_RADIUS,
        notifyOnEntry: true,
        notifyOnExit: true,
        notifyOnDwell: true,
        loiteringDelay: 10000,
        extras: { prospectId: p.id },
      }));

    if (geofences.length > 0) {
      await BackgroundGeolocation.addGeofences(geofences);
    }
  } catch (error) {
    console.warn('Geofence setup error:', error);
  }
}

export async function removeAllGeofences(): Promise<void> {
  try {
    await BackgroundGeolocation.removeGeofences();
  } catch (error) {
    console.warn('Remove geofences error:', error);
  }
}

import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { GPS_UPDATE_INTERVAL, GPS_SIGNIFICANT_CHANGE, TRIGGER_RADIUS } from '../utils/constants';
import { haversineDistance } from '../utils/haversine';
import { getCalibratedProspects } from './database';

let isTracking = false;
let currentPosition: { latitude: number; longitude: number } | null = null;
let watchId: number | null = null;
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
    watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        notifyPosition({ latitude, longitude, accuracy: accuracy ?? undefined });
      },
      (error) => {
        console.warn('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: GPS_SIGNIFICANT_CHANGE,
        interval: GPS_UPDATE_INTERVAL,
        fastestInterval: 2000,
        showLocationDialog: true,
      },
    );

    isTracking = true;
    startProximityChecking();

    return true;
  } catch (error) {
    console.error('Failed to start GPS tracking:', error);
    return false;
  }
}

export async function stopTracking(): Promise<void> {
  if (!isTracking || watchId === null) return;

  try {
    Geolocation.clearWatch(watchId);
    watchId = null;
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
    Geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
        };
        currentPosition = { latitude: pos.latitude, longitude: pos.longitude };
        resolve(pos);
      },
      (error) => {
        if (currentPosition) {
          resolve({ ...currentPosition, accuracy: 0 });
        } else {
          reject(new Error('Impossible d\'obtenir la position: ' + error.message));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
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
}

export async function removeAllGeofences(): Promise<void> {
}

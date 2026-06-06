import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Polyline, Circle, Callout } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProspect } from '../store/prospectStore';
import { getCurrentPositionSync, addPositionListener } from '../services/location';
import { executeSql } from '../services/database';
import { COLORS } from '../utils/constants';
import type { RootStackParamList, Prospect } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TYPE_COLORS: Record<string, string> = {
  'Pharmacie': '#ef4444',
  'Cabinet Médical': '#3b82f6',
  'Clinique': '#8b5cf6',
  'Laboratoire': '#f59e0b',
  'Autre': '#64748b',
};

function getMarkerColor(type: string): string {
  return TYPE_COLORS[type] || TYPE_COLORS['Autre'];
}

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { getCalibratedList } = useProspect();
  const mapRef = useRef<MapView>(null);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [trajectory, setTrajectory] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    loadCalibratedProspects();
    const pos = getCurrentPositionSync();
    if (pos) setCurrentPosition(pos);

    const removeListener = addPositionListener((pos) => {
      setCurrentPosition({ latitude: pos.latitude, longitude: pos.longitude });
      setTrajectory((prev) => [
        ...prev.slice(-99),
        { latitude: pos.latitude, longitude: pos.longitude },
      ]);
    });

    loadTodayTrajectory();

    return removeListener;
  }, []);

  async function loadCalibratedProspects() {
    const list = await getCalibratedList();
    setProspects(list);
  }

  async function loadTodayTrajectory() {
    try {
      const today = new Date().toISOString().substring(0, 10);
      const events = await executeSql(
        `SELECT latitude, longitude FROM gpsEvents
         WHERE horodatage >= ? AND evenement IN ('position', 'visite_debut', 'visite_fin')
         ORDER BY horodatage ASC`,
        [today],
      );
      setTrajectory(
        events.map((e: any) => ({
          latitude: e.latitude,
          longitude: e.longitude,
        })),
      );
    } catch {
      // silently fail
    }
  }

  const handleMarkerPress = useCallback((prospect: Prospect) => {
    setSelectedProspect(prospect);
  }, []);

  const navigateToDetail = useCallback(
    (prospectId: string) => {
      setSelectedProspect(null);
      navigation.navigate('ProspectDetail', { prospectId });
    },
    [navigation],
  );

  const centerOnUser = useCallback(() => {
    if (currentPosition && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      );
    }
  }, [currentPosition]);

  const initialRegion = currentPosition
    ? {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
      >
        {prospects.map((prospect) =>
          prospect.latitude && prospect.longitude ? (
            <Marker
              key={prospect.id}
              coordinate={{
                latitude: prospect.latitude,
                longitude: prospect.longitude,
              }}
              pinColor={getMarkerColor(prospect.type)}
              onPress={() => handleMarkerPress(prospect)}
            >
              <Callout onPress={() => navigateToDetail(prospect.id)}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{prospect.nom}</Text>
                  <Text style={styles.calloutType}>{prospect.type}</Text>
                  <Text style={styles.calloutAddress}>{prospect.ville}</Text>
                  <Text style={styles.calloutAction}>Voir détails →</Text>
                </View>
              </Callout>
            </Marker>
          ) : null,
        )}

        {currentPosition && (
          <Circle
            center={{
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
            }}
            radius={4}
            fillColor="rgba(30, 64, 175, 0.1)"
            strokeColor="rgba(30, 64, 175, 0.3)"
            strokeWidth={1}
          />
        )}

        {trajectory.length > 1 && (
          <Polyline
            coordinates={trajectory}
            strokeColor={COLORS.primary}
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.userLocationButton} onPress={centerOnUser}>
        <Icon name="crosshairs-gps" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {selectedProspect && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View
              style={[
                styles.infoDot,
                { backgroundColor: getMarkerColor(selectedProspect.type) },
              ]}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>{selectedProspect.nom}</Text>
              <Text style={styles.infoSubtitle}>{selectedProspect.type}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedProspect(null)}>
              <Icon name="close" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoAddress}>{selectedProspect.adresse}, {selectedProspect.ville}</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => navigateToDetail(selectedProspect.id)}
          >
            <Text style={styles.infoButtonText}>Voir le détail</Text>
          </TouchableOpacity>
        </View>
      )}

      {prospects.length > 0 && !selectedProspect && (
        <View style={styles.legendCard}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => {
            const count = prospects.filter((p) => p.type === type).length;
            if (count === 0) return null;
            return (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{type} ({count})</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 2,
  },
  infoAddress: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 8,
  },
  infoButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  infoButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  legendCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxWidth: 160,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray600,
  },
});

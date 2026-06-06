import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useVisit } from '../store/visitStore';
import { useProspect } from '../store/prospectStore';
import { getCurrentPositionSync, addPositionListener } from '../services/location';
import VisitTimer from '../components/VisitTimer';
import { COLORS, TRIGGER_RADIUS } from '../utils/constants';
import { haversineDistance } from '../utils/haversine';
import type { RootStackParamList, Prospect } from '../types';

type RouteProp = NativeStackScreenProps<RootStackParamList, 'ActiveVisit'>['route'];
type NavProp = NativeStackScreenProps<RootStackParamList, 'ActiveVisit'>['navigation'];

export default function ActiveVisitScreen() {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavProp>();
  const { getProspect } = useProspect();
  const { activeVisit, endVisit } = useVisit();

  const { visitId, prospectId } = route.params;
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distanceToProspect, setDistanceToProspect] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadProspect();
    const pos = getCurrentPositionSync();
    if (pos) setCurrentPosition(pos);

    const removeListener = addPositionListener((pos) => {
      setCurrentPosition({ latitude: pos.latitude, longitude: pos.longitude });
    });

    if (activeVisit?.heureArrivee) {
      const startTime = new Date(activeVisit.heureArrivee).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      removeListener();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeVisit]);

  async function loadProspect() {
    const p = await getProspect(prospectId);
    setProspect(p);
  }

  useEffect(() => {
    if (currentPosition && prospect?.latitude && prospect?.longitude) {
      const dist = haversineDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        prospect.latitude,
        prospect.longitude,
      );
      setDistanceToProspect(dist);
    }
  }, [currentPosition, prospect]);

  const handleEndVisit = useCallback(async () => {
    if (!activeVisit) return;

    const now = new Date().toISOString();
    try {
      await endVisit(visitId, now, elapsedSeconds);
      Toast.show({
        type: 'success',
        text1: 'Visite terminée',
        text2: `Durée: ${Math.floor(elapsedSeconds / 60)} minutes`,
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de terminer la visite',
      });
    }
  }, [activeVisit, visitId, elapsedSeconds, endVisit, navigation]);

  if (!prospect || !currentPosition) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const isWithinZone = distanceToProspect !== null && distanceToProspect <= TRIGGER_RADIUS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Temps de visite</Text>
        <VisitTimer elapsedSeconds={elapsedSeconds} />
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isWithinZone ? COLORS.success : COLORS.warning },
            ]}
          />
          <Text style={styles.statusText}>
            {isWithinZone ? 'Sur place' : 'En déplacement'}
          </Text>
        </View>
      </View>

      <View style={styles.prospectCard}>
        <View style={styles.prospectHeader}>
          <View style={styles.avatarCircle}>
            <Icon name="store" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.prospectInfo}>
            <Text style={styles.prospectName}>{prospect.nom}</Text>
            <Text style={styles.prospectType}>{prospect.type}</Text>
            <Text style={styles.prospectAddress}>
              {prospect.adresse}, {prospect.ville}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          <Marker
            coordinate={{
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
            }}
            title="Vous êtes ici"
            pinColor={COLORS.primary}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>

          {prospect.latitude && prospect.longitude && (
            <>
              <Marker
                coordinate={{
                  latitude: prospect.latitude,
                  longitude: prospect.longitude,
                }}
                title={prospect.nom}
                pinColor="#ef4444"
              />
              <Circle
                center={{
                  latitude: prospect.latitude,
                  longitude: prospect.longitude,
                }}
                radius={TRIGGER_RADIUS}
                fillColor="rgba(34, 197, 94, 0.15)"
                strokeColor="rgba(34, 197, 94, 0.4)"
                strokeWidth={2}
              />
            </>
          )}
        </MapView>
      </View>

      {distanceToProspect !== null && (
        <View style={styles.distanceCard}>
          <Icon
            name={isWithinZone ? 'target' : 'map-marker-distance'}
            size={24}
            color={isWithinZone ? COLORS.success : COLORS.warning}
          />
          <View style={styles.distanceInfo}>
            <Text style={styles.distanceValue}>
              {distanceToProspect < 1
                ? '< 1 m'
                : `${Math.round(distanceToProspect)} m`}
            </Text>
            <Text style={styles.distanceLabel}>
              {isWithinZone ? 'Dans la zone de visite' : 'Distance du prospect'}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.endVisitButton} onPress={handleEndVisit}>
        <Icon name="stop-circle" size={22} color={COLORS.white} />
        <Text style={styles.endVisitText}>Terminer la visite</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray500,
  },
  timerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  prospectCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  prospectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  prospectInfo: {
    flex: 1,
  },
  prospectName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  prospectType: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 2,
  },
  prospectAddress: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 2,
  },
  mapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  map: {
    height: 250,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  distanceInfo: {
    marginLeft: 12,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  distanceLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  endVisitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  endVisitText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
});

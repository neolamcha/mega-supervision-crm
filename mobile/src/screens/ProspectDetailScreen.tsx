import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';
import { useProspect } from '../store/prospectStore';
import { getVisits, getVisitStats } from '../services/database';
import { COLORS } from '../utils/constants';
import { formatDate, formatDurationShort } from '../utils/format';
import type { RootStackParamList, Prospect, Visit } from '../types';

type RouteProp = NativeStackScreenProps<RootStackParamList, 'ProspectDetail'>['route'];
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProspectDetailScreen() {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavProp>();
  const { getProspect } = useProspect();
  const { prospectId } = route.params;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<{ total: number; totalDuration: number }>({ total: 0, totalDuration: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [prospectId]);

  async function loadData() {
    setIsLoading(true);
    const p = await getProspect(prospectId);
    setProspect(p);

    const v = await getVisits(prospectId);
    setVisits(v);

    const s = await getVisitStats(prospectId);
    setStats(s);

    setIsLoading(false);
  }

  const handleCalibrate = useCallback(() => {
    navigation.navigate('Calibration', { prospectId });
  }, [navigation, prospectId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!prospect) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="alert-circle" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Prospect introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Icon name="store" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.prospectName}>{prospect.nom}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{prospect.type}</Text>
            </View>
          </View>
          {prospect.estCalibre ? (
            <View style={styles.calibratedBadge}>
              <Icon name="check-circle" size={18} color={COLORS.success} />
              <Text style={styles.calibratedText}>Calibré</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={18} color={COLORS.gray500} />
          <Text style={styles.infoText}>{prospect.adresse}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="city" size={18} color={COLORS.gray500} />
          <Text style={styles.infoText}>{prospect.ville}, {prospect.region}</Text>
        </View>
        {prospect.telephone ? (
          <View style={styles.infoRow}>
            <Icon name="phone" size={18} color={COLORS.gray500} />
            <Text style={styles.infoText}>{prospect.telephone}</Text>
          </View>
        ) : null}
        {prospect.notes ? (
          <View style={styles.infoRow}>
            <Icon name="note-text" size={18} color={COLORS.gray500} />
            <Text style={styles.infoText}>{prospect.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Statistiques de visites</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Visites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDurationShort(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Temps total</Text>
          </View>
        </View>
      </View>

      {prospect.estCalibre && prospect.latitude && prospect.longitude ? (
        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: prospect.latitude,
              longitude: prospect.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: prospect.latitude,
                longitude: prospect.longitude,
              }}
              title={prospect.nom}
            />
          </MapView>
        </View>
      ) : null}

      {!prospect.estCalibre ? (
        <TouchableOpacity style={styles.calibrateButton} onPress={handleCalibrate}>
          <Icon name="crosshairs-gps" size={22} color={COLORS.white} />
          <Text style={styles.calibrateButtonText}>Calibrer ce prospect</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Historique des visites</Text>
        {visits.length === 0 ? (
          <Text style={styles.emptyText}>Aucune visite enregistrée</Text>
        ) : (
          visits.slice(0, 10).map((visit) => (
            <View key={visit.id} style={styles.visitItem}>
              <View style={styles.visitDot} />
              <View style={styles.visitInfo}>
                <Text style={styles.visitDate}>{formatDate(visit.heureArrivee)}</Text>
                <Text style={styles.visitTime}>
                  {visit.estComplete
                    ? `${formatDurationShort(visit.dureeSecondes)}`
                    : 'En cours...'}
                </Text>
              </View>
              {visit.estComplete ? (
                <Icon name="check-circle" size={18} color={COLORS.success} />
              ) : (
                <Icon name="progress-clock" size={18} color={COLORS.warning} />
              )}
            </View>
          ))
        )}
      </View>
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
    backgroundColor: COLORS.background,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray500,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  prospectName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gray100,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  calibratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  calibratedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  mapCard: {
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
  map: {
    height: 180,
    borderRadius: 12,
  },
  calibrateButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calibrateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    paddingVertical: 20,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  visitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  visitTime: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
});

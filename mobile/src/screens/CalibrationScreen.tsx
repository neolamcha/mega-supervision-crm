import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useProspect } from '../store/prospectStore';
import { getCurrentPosition } from '../services/location';
import { calibrationsApi } from '../services/api';
import { insertCalibration } from '../services/database';
import { COLORS } from '../utils/constants';
import type { RootStackParamList, Prospect } from '../types';

type RouteProp = NativeStackScreenProps<RootStackParamList, 'Calibration'>['route'];
type NavProp = NativeStackScreenProps<RootStackParamList, 'Calibration'>['navigation'];

export default function CalibrationScreen() {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavProp>();
  const { getProspect } = useProspect();
  const { prospectId } = route.params;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [position, setPosition] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isGettingPosition, setIsGettingPosition] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    loadProspect();
    getPosition();
  }, [prospectId]);

  async function loadProspect() {
    const p = await getProspect(prospectId);
    setProspect(p);
  }

  async function getPosition() {
    setIsGettingPosition(true);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur GPS',
        text2: 'Impossible d\'obtenir votre position. Vérifiez votre GPS.',
      });
    } finally {
      setIsGettingPosition(false);
    }
  }

  const handleCalibrate = useCallback(async () => {
    if (!position || !prospect) return;

    setIsCalibrating(true);
    try {
      const calibrationId = `cal_${Date.now()}`;
      const now = new Date().toISOString();

      const calibrationData = {
        id: calibrationId,
        prospectId,
        latitude: position.latitude,
        longitude: position.longitude,
        dateCalibrage: now,
        estActive: true,
      };

      await insertCalibration(calibrationData);

      try {
        await calibrationsApi.calibrate({
          prospectId,
          latitude: position.latitude,
          longitude: position.longitude,
        });
      } catch {
        // Will sync later
      }

      setIsCalibrated(true);
      Toast.show({
        type: 'success',
        text1: 'Calibration réussie',
        text2: `Prospect calibré à ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`,
      });

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de calibration',
        text2: error.message || 'Impossible de calibrer le prospect',
      });
    } finally {
      setIsCalibrating(false);
    }
  }, [position, prospect, prospectId, navigation]);

  if (!prospect) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isCalibrated ? (
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Icon name="check-circle" size={80} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Calibration réussie !</Text>
            <Text style={styles.successText}>
              Le prospect {prospect.nom} a été calibré avec succès.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerCard}>
              <Text style={styles.prospectName}>{prospect.nom}</Text>
              <Text style={styles.prospectInfo}>{prospect.type} - {prospect.ville}</Text>
            </View>

            <View style={styles.gpsCard}>
              <Icon name="crosshairs-gps" size={48} color={COLORS.primary} />
              <Text style={styles.gpsTitle}>Position GPS actuelle</Text>

              {isGettingPosition ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Acquisition de la position...</Text>
                </View>
              ) : position ? (
                <>
                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Latitude</Text>
                    <Text style={styles.coordValue}>{position.latitude.toFixed(6)}</Text>
                  </View>
                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Longitude</Text>
                    <Text style={styles.coordValue}>{position.longitude.toFixed(6)}</Text>
                  </View>
                  {position.accuracy ? (
                    <View style={styles.accuracyRow}>
                      <Icon
                        name={position.accuracy < 10 ? 'signal-cellular-3' : 'signal-cellular-1'}
                        size={16}
                        color={position.accuracy < 10 ? COLORS.success : COLORS.warning}
                      />
                      <Text style={styles.accuracyText}>
                        Précision: {Math.round(position.accuracy)}m
                      </Text>
                    </View>
                  ) : null}

                  {prospect.latitude && prospect.longitude ? (
                    <Text style={styles.oldCalibText}>
                      Précédent: {prospect.latitude.toFixed(6)}, {prospect.longitude.toFixed(6)}
                    </Text>
                  ) : null}
                </>
              ) : (
                <View style={styles.errorRow}>
                  <Icon name="alert-circle" size={20} color={COLORS.danger} />
                  <Text style={styles.errorText}>Position indisponible</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.calibrateButton,
                (isGettingPosition || !position || isCalibrating) && styles.calibrateButtonDisabled,
              ]}
              onPress={handleCalibrate}
              disabled={isGettingPosition || !position || isCalibrating}
            >
              {isCalibrating ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Icon name="crosshairs-gps" size={22} color={COLORS.white} />
                  <Text style={styles.calibrateButtonText}>Calibrer ce prospect</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshButton} onPress={getPosition}>
              <Icon name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.refreshButtonText}>Actualiser la position</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  prospectName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  prospectInfo: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 4,
  },
  gpsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.gray500,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  coordLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  coordValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  accuracyText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.gray500,
  },
  oldCalibText: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.gray400,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.danger,
  },
  calibrateButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calibrateButtonDisabled: {
    opacity: 0.5,
  },
  calibrateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  refreshButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successCircle: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },
});

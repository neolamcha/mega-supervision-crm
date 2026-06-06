import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import type { Prospect } from '../types';

interface Props {
  prospect: Prospect;
  distance?: number;
  onPress: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  'Pharmacie': 'pill',
  'Cabinet Médical': 'stethoscope',
  'Clinique': 'hospital-box',
  'Laboratoire': 'flask',
};

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] || 'store';
}

export default function ProspectCard({ prospect, distance, onPress }: Props) {
  const formatDistance = (meters?: number): string | null => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Icon
          name={getTypeIcon(prospect.type)}
          size={24}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{prospect.nom}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.type}>{prospect.type}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.city}>{prospect.ville}</Text>
        </View>
        {distance !== undefined && distance !== null && (
          <Text style={styles.distance}>
            <Icon name="map-marker-distance" size={12} color={COLORS.gray400} />
            {' '}{formatDistance(distance)}
          </Text>
        )}
      </View>

      <View style={styles.badges}>
        {prospect.estCalibre ? (
          <View style={styles.calibratedBadge}>
            <Icon name="check-circle" size={14} color={COLORS.success} />
          </View>
        ) : (
          <View style={styles.uncalibratedBadge}>
            <Icon name="crosshairs-gps" size={14} color={COLORS.gray400} />
          </View>
        )}
        <Icon name="chevron-right" size={20} color={COLORS.gray300} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  separator: {
    fontSize: 12,
    color: COLORS.gray300,
    marginHorizontal: 6,
  },
  city: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  distance: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  calibratedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  uncalibratedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
});

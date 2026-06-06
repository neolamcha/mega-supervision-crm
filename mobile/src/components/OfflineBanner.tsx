import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';

interface Props {
  isVisible: boolean;
}

export default function OfflineBanner({ isVisible }: Props) {
  if (!isVisible) return null;

  return (
    <View style={styles.banner}>
      <Icon name="wifi-off" size={16} color={COLORS.white} />
      <Text style={styles.text}>
        Mode hors ligne - Les données seront synchronisées automatiquement
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});

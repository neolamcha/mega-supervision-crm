import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';

interface Props {
  isSynced?: boolean;
  isPending?: boolean;
  isOffline?: boolean;
}

export default function SyncIndicator({ isSynced, isPending, isOffline }: Props) {
  const getConfig = (): { name: string; color: string } => {
    if (isOffline) return { name: 'cloud-off-outline', color: COLORS.danger };
    if (isPending) return { name: 'cloud-upload-outline', color: COLORS.warning };
    if (isSynced) return { name: 'cloud-check', color: COLORS.success };
    return { name: 'cloud-question', color: COLORS.gray400 };
  };

  const { name, color } = getConfig();

  return (
    <View style={styles.container}>
      <Icon name={name} size={18} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

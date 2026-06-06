import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../store/authStore';
import { syncAll, loadLastSyncTime, checkConnectivity, SyncStatus } from '../services/sync';
import { getDatabaseSize, getUnsyncedCounts } from '../services/database';
import { COLORS } from '../utils/constants';
import { formatDateTime } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbSize, setDbSize] = useState('...');
  const [unsyncedCounts, setUnsyncedCounts] = useState({ events: 0, visits: 0 });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadInfo();
    checkOnlineStatus();
  }, []);

  async function loadInfo() {
    const syncTime = await loadLastSyncTime();
    setLastSync(syncTime);

    const size = await getDatabaseSize();
    setDbSize(size);

    const counts = await getUnsyncedCounts();
    setUnsyncedCounts(counts);
  }

  async function checkOnlineStatus() {
    const online = await checkConnectivity();
    setIsOnline(online);
  }

  const handleSync = useCallback(async () => {
    if (isSyncing) return;

    const online = await checkConnectivity();
    if (!online) {
      Toast.show({
        type: 'error',
        text1: 'Hors ligne',
        text2: 'Impossible de synchroniser sans connexion internet',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const status = await syncAll();
      if (status === SyncStatus.SUCCESS) {
        Toast.show({ type: 'success', text1: 'Synchronisation réussie' });
      } else if (status === SyncStatus.ERROR) {
        Toast.show({ type: 'error', text1: 'Erreur de synchronisation' });
      } else {
        Toast.show({ type: 'info', text1: 'Synchronisation' });
      }
      await loadInfo();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  }, [logout]);

  const totalUnsynced = unsyncedCounts.events + unsyncedCounts.visits;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Icon name="account" size={44} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.userName}>
          {user?.prenom} {user?.nom}
        </Text>
        <Text style={styles.userRole}>{user?.role || 'Délégué Commercial'}</Text>
        {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Synchronisation</Text>

        <View style={styles.syncRow}>
          <Icon
            name={isOnline ? 'wifi' : 'wifi-off'}
            size={20}
            color={isOnline ? COLORS.success : COLORS.danger}
          />
          <Text style={styles.syncLabel}>
            {isOnline ? 'Connecté' : 'Hors ligne'}
          </Text>
        </View>

        <View style={styles.syncRow}>
          <Icon name="sync" size={20} color={COLORS.gray500} />
          <Text style={styles.syncLabel}>
            Dernière synchro: {lastSync ? formatDateTime(lastSync) : 'Jamais'}
          </Text>
        </View>

        {totalUnsynced > 0 ? (
          <View style={styles.syncRow}>
            <Icon name="cloud-upload-outline" size={20} color={COLORS.warning} />
            <Text style={styles.syncLabel}>
              {totalUnsynced} élément{totalUnsynced > 1 ? 's' : ''} en attente
            </Text>
          </View>
        ) : (
          <View style={styles.syncRow}>
            <Icon name="cloud-check" size={20} color={COLORS.success} />
            <Text style={styles.syncLabel}>Tout est synchronisé</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Icon name="sync" size={18} color={COLORS.white} />
              <Text style={styles.syncButtonText}>Synchroniser maintenant</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Stockage</Text>
        <View style={styles.syncRow}>
          <Icon name="database" size={20} color={COLORS.gray500} />
          <Text style={styles.syncLabel}>Base de données: {dbSize}</Text>
        </View>
        <View style={styles.syncRow}>
          <Icon name="map-marker-outline" size={20} color={COLORS.gray500} />
          <Text style={styles.syncLabel}>
            Événements GPS en attente: {unsyncedCounts.events}
          </Text>
        </View>
        <View style={styles.syncRow}>
          <Icon name="clipboard-list-outline" size={20} color={COLORS.gray500} />
          <Text style={styles.syncLabel}>
            Visites en attente: {unsyncedCounts.visits}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Application</Text>
        <View style={styles.syncRow}>
          <Icon name="information" size={20} color={COLORS.gray500} />
          <Text style={styles.syncLabel}>Version 1.0.0</Text>
        </View>
        <View style={styles.syncRow}>
          <Icon name="shield-check" size={20} color={COLORS.gray500} />
          <Text style={styles.syncLabel}>Mega Supervision</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
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
  profileCard: {
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
  avatarContainer: {
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 2,
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
    marginBottom: 14,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncLabel: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 10,
    flex: 1,
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 8,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProspect } from '../store/prospectStore';
import { prospectsApi } from '../services/api';
import ProspectCard from '../components/ProspectCard';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../utils/constants';
import type { RootStackParamList, Prospect } from '../types';
import { getCurrentPositionSync } from '../services/location';
import { haversineDistance } from '../utils/haversine';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProspectListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    prospects,
    filteredProspects,
    searchQuery,
    isLoading,
    loadProspects,
    searchProspectsAction,
    updateProspectsFromServer,
  } = useProspect();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const syncAndLoad = useCallback(async () => {
    try {
      const response = await prospectsApi.getList({ limit: 1000 });
      if (response.success && response.data) {
        await updateProspectsFromServer(response.data);
      } else {
        await loadProspects();
      }
    } catch {
      await loadProspects();
    }
  }, [loadProspects, updateProspectsFromServer]);

  useEffect(() => {
    syncAndLoad();
  }, [syncAndLoad]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncAndLoad();
    setRefreshing(false);
  }, [syncAndLoad]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      searchProspectsAction(text);
    },
    [searchProspectsAction],
  );

  const sortedProspects = React.useMemo(() => {
    const list = searchText ? filteredProspects : prospects;
    const pos = getCurrentPositionSync();
    if (pos) {
      return [...list]
        .map((p) => ({
          ...p,
          distance:
            p.latitude && p.longitude
              ? haversineDistance(pos.latitude, pos.longitude, p.latitude, p.longitude)
              : undefined,
        }))
        .sort((a, b) => {
          if (a.estCalibre && !b.estCalibre) return -1;
          if (!a.estCalibre && b.estCalibre) return 1;
          return a.nom.localeCompare(b.nom);
        });
    }
    return list;
  }, [prospects, filteredProspects, searchText]);

  const renderItem = useCallback(
    ({ item }: { item: Prospect }) => (
      <ProspectCard
        prospect={item}
        distance={item.distance}
        onPress={() => navigation.navigate('ProspectDetail', { prospectId: item.id })}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: Prospect) => item.id, []);

  if (isLoading && prospects.length === 0) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color={COLORS.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un prospect..."
            placeholderTextColor={COLORS.gray400}
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={sortedProspects}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-search"
            title="Aucun prospect trouvé"
            message={searchText ? 'Essayez un autre terme de recherche' : 'Aucun prospect disponible'}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {!searchText && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {prospects.filter((p) => p.estCalibre).length}/{prospects.length} calibrés
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  statsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '600',
  },
});

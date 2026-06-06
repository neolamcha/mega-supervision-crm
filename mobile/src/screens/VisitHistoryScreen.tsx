import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVisit } from '../store/visitStore';
import SyncIndicator from '../components/SyncIndicator';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS } from '../utils/constants';
import { formatDate, formatTime, formatDurationShort, getDurationCategory } from '../utils/format';
import type { Visit } from '../types';

type FilterOption = 'today' | 'week' | 'month';

export default function VisitHistoryScreen() {
  const { visits, isLoading, loadRecentVisits, loadVisits } = useVisit();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterOption>('today');

  useEffect(() => {
    loadVisitsForFilter(filter);
  }, [filter]);

  async function loadVisitsForFilter(f: FilterOption) {
    switch (f) {
      case 'today':
        await loadRecentVisits(1);
        break;
      case 'week':
        await loadRecentVisits(7);
        break;
      case 'month':
        await loadRecentVisits(30);
        break;
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisitsForFilter(filter);
    setRefreshing(false);
  }, [filter]);

  const sections = useMemo(() => {
    const groups: Record<string, Visit[]> = {};
    visits.forEach((visit) => {
      const dateKey = formatDate(visit.heureArrivee);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(visit);
    });
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  }, [visits]);

  const getDurationColor = (seconds: number | null): string => {
    const category = getDurationCategory(seconds);
    switch (category) {
      case 'short': return COLORS.danger;
      case 'long': return '#f97316';
      default: return COLORS.success;
    }
  };

  const filterButtons: Array<{ key: FilterOption; label: string }> = [
    { key: 'today', label: 'Aujourd\'hui' },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
  ];

  const renderItem = useCallback(
    ({ item }: { item: Visit }) => {
      const durationColor = getDurationColor(item.dureeSecondes);
      return (
        <View style={styles.visitCard}>
          <View style={styles.visitHeader}>
            <View style={styles.visitProspect}>
              <View style={[styles.durationDot, { backgroundColor: durationColor }]} />
              <View style={styles.visitInfo}>
                <Text style={styles.prospectName}>{item.prospectNom || 'Prospect'}</Text>
                {item.prospectType ? (
                  <Text style={styles.prospectType}>{item.prospectType}</Text>
                ) : null}
              </View>
            </View>
            <SyncIndicator isPending={!item.estSynchronise} isSynced={!!item.estSynchronise} />
          </View>
          <View style={styles.visitTimes}>
            <View style={styles.timeItem}>
              <Icon name="clock-in" size={14} color={COLORS.gray500} />
              <Text style={styles.timeText}>{formatTime(item.heureArrivee)}</Text>
            </View>
            {item.heureDepart ? (
              <View style={styles.timeItem}>
                <Icon name="clock-out" size={14} color={COLORS.gray500} />
                <Text style={styles.timeText}>{formatTime(item.heureDepart)}</Text>
              </View>
            ) : null}
            <View style={styles.timeItem}>
              <Icon name="timer-outline" size={14} color={durationColor} />
              <Text style={[styles.timeText, { color: durationColor, fontWeight: '700' }]}>
                {formatDurationShort(item.dureeSecondes)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    [],
  );

  if (isLoading && visits.length === 0) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={[
              styles.filterButton,
              filter === btn.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(btn.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === btn.key && styles.filterButtonTextActive,
              ]}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
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
            icon="clipboard-text-off"
            title="Aucune visite"
            message="Aucune visite enregistrée pour cette période"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {visits.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {visits.length} visite{visits.length > 1 ? 's' : ''}
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 60,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  visitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitProspect: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  durationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  visitInfo: {
    flex: 1,
  },
  prospectName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  prospectType: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 1,
  },
  visitTimes: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 4,
  },
  summaryBar: {
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
  summaryText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '600',
  },
});

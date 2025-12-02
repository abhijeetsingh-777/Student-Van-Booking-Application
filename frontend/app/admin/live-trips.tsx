import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

export default function LiveTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLiveTrips = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getLiveTrips();
      setTrips(data);
    } catch (error) {
      console.error('Failed to load live trips:', error);
      Alert.alert('Error', 'Failed to load live trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveTrips();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadLiveTrips, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderTrip = ({ item }: { item: any }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>LIVE</Text>
        </View>
        <Text style={styles.timeText}>
          Started {item.trip_start_time ? format(new Date(item.trip_start_time), 'HH:mm') : 'Unknown'}
        </Text>
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Driver</Text>
          <Text style={styles.detailValue}>{item.driver_name}</Text>
          {item.driver_phone && (
            <Text style={styles.detailSubtext}>{item.driver_phone}</Text>
          )}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Student</Text>
          <Text style={styles.detailValue}>{item.student_name}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Route</Text>
          <Text style={styles.detailValue}>{item.route_name || 'Unknown Route'}</Text>
        </View>

        {item.current_location && (
          <View style={styles.locationSection}>
            <Ionicons name="location" size={16} color="#4F46E5" />
            <Text style={styles.locationText}>
              Current: {item.current_location.lat.toFixed(4)}, {item.current_location.lng.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="map" size={16} color="#4F46E5" />
          <Text style={styles.actionText}>View Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={16} color="#10B981" />
          <Text style={styles.actionText}>Call Driver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Trips</Text>
          <Text style={styles.subtitle}>{trips.length} active trips</Text>
        </View>
        <TouchableOpacity onPress={loadLiveTrips}>
          <Ionicons name="refresh" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {loading && trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="navigate-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No live trips</Text>
          <Text style={styles.emptySubtext}>Active trips will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadLiveTrips} colors={['#4F46E5']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tripDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailSection: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detailSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});

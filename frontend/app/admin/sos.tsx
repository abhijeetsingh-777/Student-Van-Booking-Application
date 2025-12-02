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
import { sosAPI } from '../../services/api';
import { format } from 'date-fns';

export default function SOSAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('open'); // open, all

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await sosAPI.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load SOS alerts:', error);
      Alert.alert('Error', 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (alert: any) => {
    Alert.alert(
      'Resolve SOS Alert',
      `Mark this alert as resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await sosAPI.resolve(alert.id);
              Alert.alert('Success', 'SOS alert resolved');
              loadAlerts();
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve alert');
            }
          },
        },
      ]
    );
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'open') return alert.status === 'open';
    return true;
  });

  const renderAlert = ({ item }: { item: any }) => (
    <View style={[
      styles.alertCard,
      item.status === 'open' ? styles.alertCardOpen : styles.alertCardResolved
    ]}>
      <View style={styles.alertHeader}>
        <View style={styles.priorityBadge}>
          <Ionicons name="warning" size={16} color="#DC2626" />
          <Text style={styles.priorityText}>HIGH PRIORITY</Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'open' ? styles.statusOpen : styles.statusResolved
        ]}>
          <Text style={styles.statusText}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.alertDetails}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={40} color="#EF4444" />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.userRole}>{item.user_role}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {format(new Date(item.created_at), 'MMM dd, HH:mm:ss')}
          </Text>
        </View>

        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <Text style={styles.detailText}>
              Location: {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {item.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {item.booking_id && (
          <View style={styles.detailRow}>
            <Ionicons name="car" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Trip ID: {item.booking_id.substring(0, 8)}</Text>
          </View>
        )}

        {item.resolved_at && (
          <View style={styles.resolvedInfo}>
            <Text style={styles.resolvedText}>
              Resolved by {item.resolved_by} on {format(new Date(item.resolved_at), 'MMM dd, HH:mm')}
            </Text>
          </View>
        )}
      </View>

      {item.status === 'open' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Call User</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.resolveButton}
            onPress={() => handleResolve(item)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SOS Alerts</Text>
          <Text style={styles.subtitle}>
            {filteredAlerts.length} {filter === 'open' ? 'open' : 'total'} alerts
          </Text>
        </View>
        <TouchableOpacity onPress={loadAlerts}>
          <Ionicons name="refresh" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'open' && styles.filterButtonActive]}
          onPress={() => setFilter('open')}
        >
          <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
            Open
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading && alerts.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      ) : filteredAlerts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No {filter === 'open' ? 'open' : ''} SOS alerts</Text>
          <Text style={styles.emptySubtext}>All users are safe!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadAlerts} colors={['#EF4444']} />
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#EF4444',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertCardOpen: {
    borderLeftColor: '#EF4444',
  },
  alertCardResolved: {
    borderLeftColor: '#10B981',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#FECACA',
  },
  statusResolved: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  alertDetails: {
    gap: 12,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  messageBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#78350F',
  },
  resolvedInfo: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
  },
  resolvedText: {
    fontSize: 12,
    color: '#059669',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

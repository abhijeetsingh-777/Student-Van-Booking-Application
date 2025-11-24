import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>System Overview</Text>
        </View>
        <TouchableOpacity onPress={loadStats}>
          <Ionicons name="refresh" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {loading && !stats ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadStats} colors={['#4F46E5']} />
          }
        >
          <View style={styles.statsGrid}>
            <StatCard
              icon="school"
              label="Total Students"
              value={stats?.total_students || 0}
              color="#3B82F6"
            />
            <StatCard
              icon="car"
              label="Total Drivers"
              value={stats?.total_drivers || 0}
              color="#10B981"
            />
            <StatCard
              icon="checkmark-circle"
              label="Verified Drivers"
              value={stats?.verified_drivers || 0}
              color="#8B5CF6"
            />
            <StatCard
              icon="map"
              label="Total Routes"
              value={stats?.total_routes || 0}
              color="#F59E0B"
            />
            <StatCard
              icon="list"
              label="Total Bookings"
              value={stats?.total_bookings || 0}
              color="#EC4899"
            />
            <StatCard
              icon="calendar"
              label="Active Bookings"
              value={stats?.active_bookings || 0}
              color="#06B6D4"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="people" size={32} color="#4F46E5" />
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSubtitle}>View and manage all users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="shield-checkmark" size={32} color="#10B981" />
                <Text style={styles.actionTitle}>Verify Drivers</Text>
                <Text style={styles.actionSubtitle}>Review driver documents</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

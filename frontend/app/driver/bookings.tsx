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
import { bookingAPI } from '../../services/api';
import { format } from 'date-fns';

export default function DriverBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingAPI.getMy();
      setBookings(data.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleApprove = async (booking: any) => {
    try {
      await bookingAPI.update(booking.id, 'approved');
      Alert.alert('Success', 'Booking approved');
      loadBookings();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve booking');
    }
  };

  const handleReject = async (booking: any) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.update(booking.id, 'rejected');
              Alert.alert('Success', 'Booking rejected');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject booking');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderBooking = ({ item }: { item: any }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {format(new Date(item.created_at), 'MMM dd')}
        </Text>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.studentInfo}>
          <Ionicons name="person-circle" size={40} color="#4F46E5" />
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <Text style={styles.routeText}>Route: {item.route_id.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color="#6B7280" />
          <Text style={styles.infoText}>₹{item.monthly_fee}/month</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item)}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item)}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Requests</Text>
      </View>

      {loading && bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="list-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Bookings will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadBookings} colors={['#4F46E5']} />
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
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  routeText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 12,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

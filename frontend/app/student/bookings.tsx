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
import { bookingAPI, routeAPI, reviewAPI } from '../../services/api';
import { format } from 'date-fns';

export default function StudentBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingAPI.getMy();
      // Sort by created_at descending
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

  const handleCancel = (booking: any) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.update(booking.id, 'cancelled');
              Alert.alert('Success', 'Booking cancelled');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleRateDriver = (booking: any) => {
    Alert.prompt(
      'Rate Driver',
      'How was your experience? (Rate 1-5 stars)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (rating) => {
            const ratingNum = parseInt(rating || '0');
            if (ratingNum < 1 || ratingNum > 5) {
              Alert.alert('Invalid Rating', 'Please enter a number between 1 and 5');
              return;
            }
            try {
              await reviewAPI.create({
                driver_id: booking.driver_id,
                route_id: booking.route_id,
                rating: ratingNum,
                comment: '',
              });
              Alert.alert('Success', 'Thanks for your feedback!');
            } catch (error) {
              Alert.alert('Error', 'Failed to submit review');
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderBooking = ({ item }: { item: any }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={20}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {format(new Date(item.created_at), 'MMM dd, yyyy')}
        </Text>
      </View>

      <View style={styles.bookingDetails}>
        <Text style={styles.routeName}>Route ID: {item.route_id.substring(0, 8)}</Text>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Driver: {item.driver_id.substring(0, 8)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#6B7280" />
          <Text style={styles.detailText}>₹{item.monthly_fee}/month</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Payment: {item.payment_status}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {item.status === 'approved' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRateDriver(item)}
          >
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.actionButtonText}>Rate</Text>
          </TouchableOpacity>
        )}
        {(item.status === 'pending' || item.status === 'approved') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancel(item)}
          >
            <Ionicons name="close" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {loading && bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Book a ride to get started</Text>
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
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
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
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 10,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
});

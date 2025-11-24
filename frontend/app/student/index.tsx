import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { routeAPI, bookingAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function StudentSearch() {
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(user?.school_college || '');

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const data = await routeAPI.getAll(search);
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleBook = async (route: any) => {
    if (!user?.home_location) {
      Alert.alert('Setup Required', 'Please set your home location in Profile first');
      return;
    }

    if (route.available_seats === 0) {
      Alert.alert('No Seats', 'This route is fully booked');
      return;
    }

    Alert.alert(
      'Book Seat',
      `Book a seat on ${route.route_name} for ₹${route.price_per_month}/month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book',
          onPress: async () => {
            try {
              await bookingAPI.create({
                route_id: route.id,
                pickup_location: user.home_location,
              });
              Alert.alert('Success', 'Booking request sent! Wait for driver approval.');
              loadRoutes();
            } catch (error: any) {
              Alert.alert('Booking Failed', error.response?.data?.detail || 'Please try again');
            }
          },
        },
      ]
    );
  };

  const renderRoute = ({ item }: { item: any }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.route_name}</Text>
          <View style={styles.driverInfo}>
            <Ionicons name="person" size={14} color="#6B7280" />
            <Text style={styles.driverName}>{item.driver_name}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>₹{item.price_per_month}</Text>
          <Text style={styles.priceSubtext}>/month</Text>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#10B981" />
          <Text style={styles.detailText}>{item.start_location.address || 'Start'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#EF4444" />
          <Text style={styles.detailText}>{item.end_location.address || item.school_college}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.departure_time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.available_seats} / {item.total_seats} seats available
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.bookButton,
          item.available_seats === 0 && styles.bookButtonDisabled,
        ]}
        onPress={() => handleBook(item)}
        disabled={item.available_seats === 0}
      >
        <Text style={styles.bookButtonText}>
          {item.available_seats === 0 ? 'Fully Booked' : 'Book Seat'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Ride</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by school/college"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity onPress={loadRoutes}>
            <Ionicons name="filter" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && routes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bus-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No routes found</Text>
          <Text style={styles.emptySubtext}>Try searching for your school/college</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderRoute}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadRoutes} colors={['#4F46E5']} />
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  routeCard: {
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
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverName: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  priceSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { routeAPI } from '../../services/api';

export default function DriverRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    route_name: '',
    school_college: '',
    total_seats: '',
    price_per_month: '',
    departure_time: '08:00 AM',
  });

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const data = await routeAPI.getMyRoutes();
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

  const handleCreateRoute = async () => {
    if (!formData.route_name || !formData.school_college || !formData.total_seats || !formData.price_per_month) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await routeAPI.create({
        route_name: formData.route_name,
        school_college: formData.school_college,
        total_seats: parseInt(formData.total_seats),
        price_per_month: parseFloat(formData.price_per_month),
        departure_time: formData.departure_time,
        start_location: { lat: 0, lng: 0, address: 'Home' },
        end_location: { lat: 0, lng: 0, address: formData.school_college },
        waypoints: [],
        days_operating: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      });
      Alert.alert('Success', 'Route created successfully');
      setShowCreateModal(false);
      setFormData({
        route_name: '',
        school_college: '',
        total_seats: '',
        price_per_month: '',
        departure_time: '08:00 AM',
      });
      loadRoutes();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create route');
    }
  };

  const handleDeleteRoute = (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await routeAPI.delete(routeId);
              Alert.alert('Success', 'Route deleted');
              loadRoutes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete route');
            }
          },
        },
      ]
    );
  };

  const renderRoute = ({ item }: { item: any }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{item.route_name}</Text>
        <TouchableOpacity onPress={() => handleDeleteRoute(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="school" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.school_college}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.departure_time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.available_seats} / {item.total_seats} seats
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#6B7280" />
          <Text style={styles.detailText}>₹{item.price_per_month}/month</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading && routes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="map-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No routes yet</Text>
          <Text style={styles.emptySubtext}>Create your first route to get started</Text>
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

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Route</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Route Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Morning Route 1"
                  value={formData.route_name}
                  onChangeText={(text) => setFormData({ ...formData, route_name: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>School/College</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter school/college name"
                  value={formData.school_college}
                  onChangeText={(text) => setFormData({ ...formData, school_college: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Total Seats</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                  value={formData.total_seats}
                  onChangeText={(text) => setFormData({ ...formData, total_seats: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price per Month (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2000"
                  keyboardType="numeric"
                  value={formData.price_per_month}
                  onChangeText={(text) => setFormData({ ...formData, price_per_month: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Departure Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 08:00 AM"
                  value={formData.departure_time}
                  onChangeText={(text) => setFormData({ ...formData, departure_time: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity style={styles.createButton} onPress={handleCreateRoute}>
                <Text style={styles.createButtonText}>Create Route</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  routeDetails: {
    gap: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

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
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

export default function DriverVerification() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadPendingDrivers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getPendingDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Failed to load pending drivers:', error);
      Alert.alert('Error', 'Failed to load pending drivers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingDrivers();
  }, []);

  const handleApprove = async (driver: any) => {
    Alert.alert(
      'Approve Driver',
      `Are you sure you want to approve ${driver.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await adminAPI.verifyDriver(driver.id, 'approve');
              Alert.alert('Success', 'Driver approved successfully');
              loadPendingDrivers();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve driver');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await adminAPI.verifyDriver(selectedDriver.id, 'reject', rejectionReason);
      Alert.alert('Success', 'Driver rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDriver(null);
      loadPendingDrivers();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject driver');
    }
  };

  const renderDriver = ({ item }: { item: any }) => (
    <View style={styles.driverCard}>
      <View style={styles.driverHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#4F46E5" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{item.full_name}</Text>
            <Text style={styles.driverEmail}>{item.email}</Text>
            <Text style={styles.driverPhone}>{item.phone || 'No phone'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.documentsSection}>
        <Text style={styles.sectionTitle}>Documents Uploaded:</Text>
        {item.license_number && (
          <View style={styles.documentRow}>
            <Ionicons name="card" size={16} color="#10B981" />
            <Text style={styles.documentText}>License: {item.license_number}</Text>
          </View>
        )}
        {item.van_number && (
          <View style={styles.documentRow}>
            <Ionicons name="car" size={16} color="#10B981" />
            <Text style={styles.documentText}>Van: {item.van_number} ({item.van_capacity} seats)</Text>
          </View>
        )}
        {item.license_image && (
          <View style={styles.documentRow}>
            <Ionicons name="image" size={16} color="#10B981" />
            <Text style={styles.documentText}>License Image: Uploaded</Text>
          </View>
        )}
        {item.id_document && (
          <View style={styles.documentRow}>
            <Ionicons name="image" size={16} color="#10B981" />
            <Text style={styles.documentText}>ID Document: Uploaded</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => {
            setSelectedDriver(item);
            setShowRejectModal(true);
          }}
        >
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Verification</Text>
        <TouchableOpacity onPress={loadPendingDrivers}>
          <Ionicons name="refresh" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {loading && drivers.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : drivers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No pending verifications</Text>
          <Text style={styles.emptySubtext}>All drivers are verified!</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          renderItem={renderDriver}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadPendingDrivers} colors={['#4F46E5']} />
          }
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Driver</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Reason for rejection:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter reason (required)"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleReject}>
                <Text style={styles.modalButtonText}>Reject Driver</Text>
              </TouchableOpacity>
            </View>
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
  driverCard: {
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
  driverHeader: {
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  documentsSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  documentText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '60%',
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

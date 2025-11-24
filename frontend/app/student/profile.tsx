import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';

export default function StudentProfile() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [locationAddress, setLocationAddress] = useState(user?.home_location?.address || '');
  const [notifications, setNotifications] = useState({
    booking_updates: true,
    route_changes: true,
    driver_messages: false,
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleUpdateLocation = async () => {
    if (!locationAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid address');
      return;
    }

    try {
      // Update user location (simplified - in production, use geocoding API)
      const updatedUser = {
        ...user,
        home_location: {
          lat: 0,
          lng: 0,
          address: locationAddress,
        },
      };
      setUser(updatedUser);
      setShowLocationModal(false);
      Alert.alert('Success', 'Home location updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const InfoRow = ({ icon, label, value }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#4F46E5" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Student</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionContent}>
            <InfoRow icon="mail" label="Email" value={user?.email} />
            <InfoRow icon="call" label="Phone" value={user?.phone} />
            <InfoRow icon="school" label="School/College" value={user?.school_college} />
            <InfoRow 
              icon="home" 
              label="Home Location" 
              value={user?.home_location?.address || 'Not set'} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons name="location" size={20} color="#4F46E5" />
              <Text style={styles.actionText}>Update Home Location</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowNotificationModal(true)}
            >
              <Ionicons name="notifications" size={20} color="#4F46E5" />
              <Text style={styles.actionText}>Notification Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowHelpModal(true)}
            >
              <Ionicons name="help-circle" size={20} color="#4F46E5" />
              <Text style={styles.actionText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Location Update Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Home Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Enter your home address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 123 Main St, City, State"
                value={locationAddress}
                onChangeText={setLocationAddress}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleUpdateLocation}
              >
                <Text style={styles.modalButtonText}>Update Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Booking Updates</Text>
                  <Text style={styles.settingDesc}>Get notified about booking status</Text>
                </View>
                <Switch
                  value={notifications.booking_updates}
                  onValueChange={(value) => 
                    setNotifications({ ...notifications, booking_updates: value })
                  }
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={notifications.booking_updates ? '#4F46E5' : '#F3F4F6'}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Route Changes</Text>
                  <Text style={styles.settingDesc}>Alerts for schedule changes</Text>
                </View>
                <Switch
                  value={notifications.route_changes}
                  onValueChange={(value) => 
                    setNotifications({ ...notifications, route_changes: value })
                  }
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={notifications.route_changes ? '#4F46E5' : '#F3F4F6'}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Driver Messages</Text>
                  <Text style={styles.settingDesc}>Messages from your driver</Text>
                </View>
                <Switch
                  value={notifications.driver_messages}
                  onValueChange={(value) => 
                    setNotifications({ ...notifications, driver_messages: value })
                  }
                  trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                  thumbColor={notifications.driver_messages ? '#4F46E5' : '#F3F4F6'}
                />
              </View>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  Alert.alert('Success', 'Notification settings saved');
                  setShowNotificationModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>Common Questions</Text>
                
                <View style={styles.helpItem}>
                  <Ionicons name="help-circle" size={20} color="#4F46E5" />
                  <View style={styles.helpContent}>
                    <Text style={styles.helpQuestion}>How do I book a ride?</Text>
                    <Text style={styles.helpAnswer}>
                      Search for routes in the Search tab, select a route that matches your school and location, then tap "Book Seat". Wait for driver approval.
                    </Text>
                  </View>
                </View>

                <View style={styles.helpItem}>
                  <Ionicons name="help-circle" size={20} color="#4F46E5" />
                  <View style={styles.helpContent}>
                    <Text style={styles.helpQuestion}>How do I cancel a booking?</Text>
                    <Text style={styles.helpAnswer}>
                      Go to My Bookings tab, find your booking, and tap "Cancel". You can cancel pending or approved bookings.
                    </Text>
                  </View>
                </View>

                <View style={styles.helpItem}>
                  <Ionicons name="help-circle" size={20} color="#4F46E5" />
                  <View style={styles.helpContent}>
                    <Text style={styles.helpQuestion}>How do payments work?</Text>
                    <Text style={styles.helpAnswer}>
                      Monthly fees are shown when you book. Payment tracking is currently in mock mode for MVP. Full payment integration coming soon!
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>Contact Support</Text>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="mail" size={20} color="#4F46E5" />
                  <Text style={styles.contactText}>support@vanconnect.com</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="call" size={20} color="#4F46E5" />
                  <Text style={styles.contactText}>+1 (555) 123-4567</Text>
                </TouchableOpacity>
              </View>
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
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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
    maxHeight: '80%',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButton: {
    backgroundColor: '#4F46E5',
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  helpSection: {
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  helpAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#4F46E5',
    marginLeft: 12,
    fontWeight: '500',
  },
});

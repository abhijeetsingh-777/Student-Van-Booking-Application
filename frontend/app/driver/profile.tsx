import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function DriverProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
            <Ionicons name="car" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <View style={[styles.badge, !user?.is_verified && styles.badgeWarning]}>
            <Text style={[styles.badgeText, !user?.is_verified && styles.badgeTextWarning]}>
              {user?.is_verified ? 'Verified Driver' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionContent}>
            <InfoRow icon="mail" label="Email" value={user?.email} />
            <InfoRow icon="call" label="Phone" value={user?.phone} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.sectionContent}>
            <InfoRow icon="card" label="License Number" value={user?.license_number} />
            <InfoRow icon="car" label="Van Number" value={user?.van_number} />
            <InfoRow icon="people" label="Van Capacity" value={user?.van_capacity?.toString()} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document" size={20} color="#4F46E5" />
              <Text style={styles.actionText}>Upload Documents</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="notifications" size={20} color="#4F46E5" />
              <Text style={styles.actionText}>Notification Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeTextWarning: {
    color: '#D97706',
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
});

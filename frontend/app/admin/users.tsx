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
import { adminAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
      applyFilters(data, filter, search);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, filter, search);
  }, [filter, search]);

  const applyFilters = (usersList: any[], roleFilter: string, searchText: string) => {
    let filtered = usersList;

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (searchText) {
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
          u.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleVerifyDriver = async (driver: any) => {
    try {
      await adminAPI.verifyDriver(driver.id);
      Alert.alert('Success', 'Driver verified successfully');
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to verify driver');
    }
  };

  const FilterButton = ({ role, label }: { role: string; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === role && styles.filterButtonActive]}
      onPress={() => setFilter(role)}
    >
      <Text style={[styles.filterText, filter === role && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons
              name={item.role === 'student' ? 'school' : item.role === 'driver' ? 'car' : 'shield'}
              size={24}
              color="#4F46E5"
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.full_name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
          <Text style={styles.roleBadgeText}>{item.role}</Text>
        </View>
      </View>

      {item.role === 'driver' && (
        <View style={styles.driverInfo}>
          <View style={styles.driverDetailRow}>
            <Text style={styles.driverDetailLabel}>License:</Text>
            <Text style={styles.driverDetailValue}>{item.license_number || 'Not provided'}</Text>
          </View>
          <View style={styles.driverDetailRow}>
            <Text style={styles.driverDetailLabel}>Van:</Text>
            <Text style={styles.driverDetailValue}>{item.van_number || 'Not provided'}</Text>
          </View>
          <View style={styles.driverDetailRow}>
            <Text style={styles.driverDetailLabel}>Status:</Text>
            <Text
              style={[
                styles.driverDetailValue,
                { color: item.is_verified ? '#10B981' : '#F59E0B' },
              ]}
            >
              {item.is_verified ? 'Verified' : 'Pending'}
            </Text>
          </View>

          {!item.is_verified && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => handleVerifyDriver(item)}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Verify Driver</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return '#DBEAFE';
      case 'driver':
        return '#D1FAE5';
      case 'admin':
        return '#FEF3C7';
      default:
        return '#F3F4F6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.filterRow}>
          <FilterButton role="all" label="All" />
          <FilterButton role="student" label="Students" />
          <FilterButton role="driver" label="Drivers" />
          <FilterButton role="admin" label="Admins" />
        </View>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadUsers} colors={['#4F46E5']} />
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
  searchSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
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
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  driverInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  driverDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  driverDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  driverDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

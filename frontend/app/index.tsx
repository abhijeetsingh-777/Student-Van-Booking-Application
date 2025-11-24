import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on role
        if (user.role === 'student') {
          router.replace('/student');
        } else if (user.role === 'driver') {
          router.replace('/driver');
        } else if (user.role === 'admin') {
          router.replace('/admin');
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

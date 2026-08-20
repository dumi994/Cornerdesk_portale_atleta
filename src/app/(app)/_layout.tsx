import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

export default function AppGroupLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  return (
    <NotificationsProvider>
      <Slot />
    </NotificationsProvider>
  );
}

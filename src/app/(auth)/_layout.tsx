import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function AuthGroupLayout() {
  const { status } = useAuth();

  if (status === 'signedIn') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Password dimenticata' }} />
    </Stack>
  );
}

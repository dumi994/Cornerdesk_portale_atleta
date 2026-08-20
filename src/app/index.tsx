import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portale Atleta</Text>
      <Text style={styles.subtitle}>Scaffold in corso — login in arrivo.</Text>
      <Link href="/dashboard" style={styles.link}>
        Vai alla dashboard (provvisorio)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  link: { fontSize: 16, color: '#208AEF', marginTop: 16 },
});

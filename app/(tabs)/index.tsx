import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Healthcare App</Text>
      
      <Link href="/(tabs)/appointments" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>Appointments</Text>
          <Text>View and manage your appointments</Text>
        </TouchableOpacity>
      </Link>
      
      <Link href="/(tabs)/doctors" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>Doctors</Text>
          <Text>Find and book doctors</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

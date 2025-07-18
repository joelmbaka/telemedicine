import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'past';
};

export default function Index() {
  // Mock data - will be replaced with API calls
  const appointments: Appointment[] = [
    { id: '1', doctor: 'Dr. Jane Smith', specialty: 'Cardiology', date: '2023-06-15', time: '10:00 AM', status: 'upcoming' },
    { id: '2', doctor: 'Dr. Michael Chen', specialty: 'Dermatology', date: '2023-06-20', time: '2:30 PM', status: 'upcoming' },
    { id: '3', doctor: 'Dr. Sarah Johnson', specialty: 'Pediatrics', date: '2023-05-10', time: '9:15 AM', status: 'past' },
    { id: '4', doctor: 'Dr. Robert Kim', specialty: 'Orthopedics', date: '2023-04-28', time: '11:45 AM', status: 'past' },
  ];

  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const pastAppointments = appointments.filter(a => a.status === 'past');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      
      {/* Book New Appointment Button */}
      <TouchableOpacity style={styles.bookButton} onPress={() => alert('Booking new appointment')}>
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.bookButtonText}>Book New Appointment</Text>
      </TouchableOpacity>
      
      {/* Upcoming Appointments */}
      <Text style={styles.sectionHeader}>Upcoming Appointments</Text>
      {upcomingAppointments.length > 0 ? (
        upcomingAppointments.map(appointment => (
          <View key={appointment.id} style={styles.card}>
            <Text style={styles.cardTitle}>{appointment.doctor}</Text>
            <Text style={styles.cardSubtitle}>{appointment.specialty}</Text>
            <Text style={styles.cardText}>{appointment.date} at {appointment.time}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No upcoming appointments</Text>
      )}
      
      {/* Past Appointments */}
      <Text style={styles.sectionHeader}>Past Appointments</Text>
      {pastAppointments.length > 0 ? (
        pastAppointments.map(appointment => (
          <View key={appointment.id} style={[styles.card, styles.pastCard]}>
            <Text style={styles.cardTitle}>{appointment.doctor}</Text>
            <Text style={styles.cardSubtitle}>{appointment.specialty}</Text>
            <Text style={styles.cardText}>{appointment.date} at {appointment.time}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No past appointments</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  bookButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#2E7D32',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pastCard: {
    opacity: 0.7,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  cardText: {
    fontSize: 16,
    color: '#34495e',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});

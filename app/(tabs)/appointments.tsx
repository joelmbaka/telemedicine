import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppointmentCard from '../../components/AppointmentCard';
import { Appointment } from '../types';
import { Link } from 'expo-router';

export default function AppointmentsScreen() {
  // Mock data - will be replaced with API calls
  const appointments: Appointment[] = [
    {
      id: '1',
      doctor: {
        id: 'd1',
        name: 'Dr. Jane Smith',
        specialty: 'Cardiology',
        rating: 4.8,
        available: true,
      },
      date: '2023-06-15',
      time: '10:00 AM',
      status: 'upcoming',
    },
    {
      id: '2',
      doctor: {
        id: 'd2',
        name: 'Dr. Michael Chen',
        specialty: 'Dermatology',
        rating: 4.6,
        available: true,
      },
      date: '2023-06-20',
      time: '2:30 PM',
      status: 'upcoming',
    },
    {
      id: '3',
      doctor: {
        id: 'd3',
        name: 'Dr. Sarah Johnson',
        specialty: 'Pediatrics',
        rating: 4.9,
        available: false,
      },
      date: '2023-05-10',
      time: '9:15 AM',
      status: 'past',
    },
    {
      id: '4',
      doctor: {
        id: 'd4',
        name: 'Dr. Robert Kim',
        specialty: 'Orthopedics',
        rating: 4.7,
        available: true,
      },
      date: '2023-04-28',
      time: '11:45 AM',
      status: 'past',
    },
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
          <Link href={{ pathname: '/appointments/[id]', params: { id: appointment.id } }} asChild key={appointment.id}>
            <AppointmentCard appointment={appointment} />
          </Link>
        ))
      ) : (
        <Text style={styles.emptyText}>No upcoming appointments</Text>
      )}
      
      {/* Past Appointments */}
      <Text style={styles.sectionHeader}>Past Appointments</Text>
      {pastAppointments.length > 0 ? (
        pastAppointments.map(appointment => (
          <Link href={{ pathname: '/appointments/[id]', params: { id: appointment.id } }} asChild key={appointment.id}>
            <AppointmentCard appointment={appointment} />
          </Link>
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
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
});

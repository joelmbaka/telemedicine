import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Appointment } from '../types';
import { View, Text, StyleSheet } from 'react-native';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchAppointment = async () => {
      setLoading(true);
      // In a real app, you would fetch from your backend
      // const response = await fetch(`/api/appointments/${id}`);
      // const data = await response.json();
      
      // Mock data
      const mockAppointments: Appointment[] = [
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
          notes: 'Follow up on heart condition',
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
      
      const foundAppointment = mockAppointments.find(a => a.id === id) || null;
      setAppointment(foundAppointment);
      setLoading(false);
    };

    fetchAppointment();
  }, [id]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!appointment) {
    return <Text>Appointment not found</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Details</Text>
      <Text>Doctor: {appointment.doctor.name}</Text>
      <Text>Specialty: {appointment.doctor.specialty}</Text>
      <Text>Date: {appointment.date}</Text>
      <Text>Time: {appointment.time}</Text>
      <Text>Status: {appointment.status}</Text>
      {appointment.notes && <Text>Notes: {appointment.notes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
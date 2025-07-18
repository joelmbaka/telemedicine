import { View, Text, ScrollView, StyleSheet } from 'react-native';
import DoctorCard from '../../components/DoctorCard';
import { Doctor } from '../types';
import { Link } from 'expo-router';

export default function DoctorsScreen() {
  // Mock data for doctors
  const doctors: Doctor[] = [
    {
      id: 'd1',
      name: 'Dr. Jane Smith',
      specialty: 'Cardiology',
      rating: 4.8,
      available: true,
    },
    {
      id: 'd2',
      name: 'Dr. Michael Chen',
      specialty: 'Dermatology',
      rating: 4.6,
      available: true,
    },
    {
      id: 'd3',
      name: 'Dr. Sarah Johnson',
      specialty: 'Pediatrics',
      rating: 4.9,
      available: false,
    },
    {
      id: 'd4',
      name: 'Dr. Robert Kim',
      specialty: 'Orthopedics',
      rating: 4.7,
      available: true,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {doctors.map(doctor => (
        <Link href={`/doctors/${doctor.id}`} asChild key={doctor.id}>
          <DoctorCard doctor={doctor} />
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
});

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Doctor } from '../../lib/types';

export default function DoctorDetail() {
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchDoctor = async () => {
      setLoading(true);
      // In a real app, you would fetch from your backend
      // const response = await fetch(`/api/doctors/${id}`);
      // const data = await response.json();
      
      // Mock data
      const mockDoctors: Doctor[] = [
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
      
      const foundDoctor = mockDoctors.find(d => d.id === id) || null;
      setDoctor(foundDoctor);
      setLoading(false);
    };

    fetchDoctor();
  }, [id]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!doctor) {
    return <Text>Doctor not found</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Profile</Text>
      <Text>Name: {doctor.name}</Text>
      <Text>Specialty: {doctor.specialty}</Text>
      <Text>Rating: {doctor.rating}</Text>
      <Text>Availability: {doctor.available ? 'Available' : 'Not Available'}</Text>
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
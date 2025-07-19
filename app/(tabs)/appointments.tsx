import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppointmentCard from '../../components/AppointmentCard';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../lib/types';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `id, status, scheduled_at, doctor:doctors(id, name, specialty, rating, available)`
        )
        .eq('patient_id', userId)
        .order('scheduled_at', { ascending: true });
      if (!mounted) return;
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      const list: Appointment[] = (data || []).map((a: any) => {
        const dt = new Date(a.scheduled_at);
        return {
          id: a.id,
          doctor: a.doctor,
          date: dt.toLocaleDateString(),
          time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: a.status,
        } as Appointment;
      });
      setAppointments(list);
      setLoading(false);
    })().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#64d2ff" />
      </View>
    );
  }

  const upcomingAppointments = appointments.filter(a => {
    const dt = new Date(`${a.date} ${a.time}`);
    return dt >= new Date();
  });
  const pastAppointments = appointments.filter(a => {
    const dt = new Date(`${a.date} ${a.time}`);
    return dt < new Date();
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      
      {/* Book New Appointment Button */}
      <TouchableOpacity style={styles.bookButton} onPress={() => router.push('/(modals)/new-appointment')}>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1d23',
  },
});

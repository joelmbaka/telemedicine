import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppointmentCard from '../../components/AppointmentCard';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../lib/types';

export default function ScheduleScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          scheduled_at,
          patient:profiles(email)
        `)
        .eq('doctor_id', session.user.id)
        .order('scheduled_at', { ascending: true })
      if (isMounted && data) {
        // Map to mock Appointment type shape just for display
        setAppointments(
          data.map((a: any) => {
            const dt = new Date(a.scheduled_at);
            return {
              id: a.id,
              doctor: { id: session.user.id, name: '', specialty: '', rating: 0, available: true },
              patient: a.patient ? {
                email: a.patient.email || ''
              } : undefined,
              date: dt.toLocaleDateString(),
              time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: a.status,
            } as Appointment;
          }),
        );
      }
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#64d2ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Today & Upcoming</Text>
      {appointments.length === 0 ? (
        <Text style={styles.empty}>No appointments scheduled.</Text>
      ) : (
        appointments.map((appt) => <AppointmentCard key={appt.id} appointment={appt} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#2c3e50' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1d23' },
  empty: { textAlign: 'center', marginTop: 20, color: '#7f8c8d' },
});

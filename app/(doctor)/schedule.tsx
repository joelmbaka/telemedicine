import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import AppointmentCard from '../../components/AppointmentCard';
import { supabase } from '../../lib/supabase';
import { Appointment, Doctor } from '../../lib/types';

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

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          scheduled_at,
          symptoms,
          notes,
          video_call_url,
          fee_cents,
          stripe_payment_intent_id,
          created_at,
          updated_at,
          patient:profiles(id, email, full_name)
        `)
        .eq('doctor_id', session.user.id)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      if (isMounted && data) {
        // Get doctor's info for each appointment
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAppointments(
          data.map((a: any) => {
            const dt = new Date(a.scheduled_at);
            return {
              id: a.id,
              doctor: {
                id: session.user.id,
                name: doctorData?.name || doctorData?.full_name || 'Dr. Unknown',
                specialty: doctorData?.specialty || 'General Practitioner',
                rating_avg: doctorData?.rating_avg || 0,
                rating_count: doctorData?.rating_count || 0,
                available: doctorData?.available || false,
                consultation_fee_cents: doctorData?.consultation_fee_cents || 0,
                bio: doctorData?.bio,
                image_url: doctorData?.image_url,
                stripe_account_id: doctorData?.stripe_account_id,
                created_at: doctorData?.created_at,
              } as Doctor,
              patient: a.patient ? {
                id: a.patient.id,
                email: a.patient.email || '',
                full_name: a.patient.full_name
              } : undefined,
              date: dt.toLocaleDateString(),
              time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: a.status,
              symptoms: a.symptoms,
              notes: a.notes,
              video_call_url: a.video_call_url,
              fee_cents: a.fee_cents,
              stripe_payment_intent_id: a.stripe_payment_intent_id,
              scheduled_at: a.scheduled_at,
              created_at: a.created_at,
              updated_at: a.updated_at,
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
        appointments.map((appt) => (
          <AppointmentCard 
            key={appt.id} 
            appointment={appt} 
            onPress={() => {
              console.log('Navigating to appointment details:', appt.id);
              router.push({
                pathname: '/appointment/[id]',
                params: { id: appt.id }
              });
            }}
          />
        ))
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

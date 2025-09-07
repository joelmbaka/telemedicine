import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { COLORS } from '@/lib/theme';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppointmentCard from '../../components/AppointmentCard';
import { supabase } from '../../lib/supabase';
import { Appointment, Doctor } from '../../lib/types';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `id, status, scheduled_at,
           doctor:doctors(id, specialties, rating_avg, available, profiles(full_name, avatar_url)),
           patient:profiles(full_name, email)`
        )
        .eq('patient_id', userId)
        .order('scheduled_at', { ascending: true });
      if (error) {
        console.error(error);
        setAppointments([]);
        setLoading(false);
        return;
      }
      const list: Appointment[] = (data || []).map((a: any) => {
        const dt = new Date(a.scheduled_at);
        const { id: docId, specialties, rating_avg, available, profiles } = a.doctor || {};
        const doctorObj = {
          id: docId,
          name: profiles?.full_name ?? 'Doctor',
          specialties,
          rating: Number(rating_avg) || 0,
          available,
          image_url: profiles?.avatar_url,
        } as Doctor;
        return {
          id: a.id,
          doctor: doctorObj,
          patient: {
            full_name: a.patient?.full_name || 'Unknown Patient',
            email: a.patient?.email
          },
          date: dt.toLocaleDateString(),
          time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          scheduled_at: a.scheduled_at,
          status: a.status,
        } as Appointment;
      });
      setAppointments(list);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const upcomingAppointments = appointments.filter(a => {
    const dt = a.scheduled_at ? new Date(a.scheduled_at) : new Date(`${a.date} ${a.time}`);
    return dt >= new Date();
  });
  const pastAppointments = appointments.filter(a => {
    const dt = a.scheduled_at ? new Date(a.scheduled_at) : new Date(`${a.date} ${a.time}`);
    return dt < new Date();
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      
      {/* Book flow now starts from Skill or Doctor pages */}
      <TouchableOpacity style={styles.bookButton} onPress={() => router.push('/(tabs)')}>
        <Ionicons name="add-circle" size={24} color={COLORS.primary} />
        <Text style={styles.bookButtonText}>Browse skills to book</Text>
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
    backgroundColor: COLORS.dark,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  bookButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.textPrimary,
    backgroundColor: 'transparent',
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

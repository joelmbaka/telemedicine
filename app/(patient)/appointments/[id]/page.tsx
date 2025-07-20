import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Appointment } from '../../../../lib/types';

const PatientAppointmentDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          doctor_id,
          patient_id,
          status,
          scheduled_at,
          video_call_url,
          symptoms,
          notes,
          fee_cents,
          stripe_payment_intent_id,
          created_at,
          updated_at,
          doctor:doctors(*)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching appointment:', error);
      } else {
        // The doctor relationship is an array, so we take the first element
        const appointmentData: Appointment = {
          ...data,
          doctor: data.doctor ? data.doctor[0] : undefined
        };
        setAppointment(appointmentData);
      }
      setLoading(false);
    };

    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#64d2ff" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <Text>Appointment not found</Text>
      </View>
    );
  }

  const scheduledDate = new Date(appointment.scheduled_at);
  const dateStr = scheduledDate.toLocaleDateString();
  const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Details</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Doctor</Text>
        <Text>{appointment.doctor?.name || 'Dr. ' + appointment.doctor_id.substring(0, 8)}</Text>
        <Text>Specialty: {appointment.doctor?.specialty}</Text>
        <Text>Rating: {appointment.doctor?.rating_avg}</Text>
        <Text>Available: {appointment.doctor?.available ? 'Yes' : 'No'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <Text>{dateStr} at {timeStr}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text>{appointment.status}</Text>
      </View>
      
      {appointment.symptoms && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <Text>{appointment.symptoms}</Text>
        </View>
      )}
      
      {appointment.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor's Notes</Text>
          <Text>{appointment.notes}</Text>
        </View>
      )}
      
      {appointment.status === 'in_progress' && (
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Join Video Call</Text>
        </TouchableOpacity>
      )}
      
      {appointment.status === 'awaiting_payment' && (
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Make Payment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#64d2ff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PatientAppointmentDetail;
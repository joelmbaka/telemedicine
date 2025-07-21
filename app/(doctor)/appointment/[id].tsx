import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Appointment } from '../../../lib/types';

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    console.log('AppointmentDetailsScreen mounted for ID:', id);
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    console.log('Fetching appointment details for ID:', id);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const appointmentData = {
          ...data,
          date: new Date(data.scheduled_at).toLocaleDateString(),
          time: new Date(data.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setAppointment(appointmentData as Appointment);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchAppointment();

      if (newStatus === 'in_progress') {
        // Navigate the doctor straight to the consultation screen
        (router as any).push({ pathname: '/consultation/[appointmentId]', params: { appointmentId: id } });
      }

      Alert.alert('Success', `Appointment marked as ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = () => {
    if (!appointment) return { bg: '#f5f5f5', text: '#757575' };
    
    switch (appointment.status) {
      case 'paid':
        return { bg: '#e8f5e9', text: '#2E7D32' };
      case 'in_progress':
        return { bg: '#e3f2fd', text: '#1976d2' };
      case 'complete':
        return { bg: '#e8f5e9', text: '#2E7D32' };
      case 'cancelled':
        return { bg: '#ffebee', text: '#d32f2f' };
      case 'requested':
        return { bg: '#fff3e0', text: '#ff8f00' };
      default:
        return { bg: '#f5f5f5', text: '#757575' };
    }
  };

  const statusColors = getStatusColor();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.center}>
        <Text>Appointment not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.title}>Appointment Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.patientInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#7f8c8d" />
            </View>
            <View>
              <Text style={styles.patientName}>
                {appointment.patient?.full_name || 'Unknown Patient'}
              </Text>
              {appointment.patient?.email && (
                <Text style={styles.patientEmail}>
                  {appointment.patient.email}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#7f8c8d" />
            <Text style={styles.detailText}>{appointment.date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#7f8c8d" />
            <Text style={styles.detailText}>{appointment.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color="#7f8c8d" />
            <View>
              <Text style={styles.detailText}>
                Status: 
                <Text style={{ color: statusColors.text, fontWeight: 'bold' }}>
                  {appointment.status}
                </Text>
              </Text>
            </View>
          </View>

          {appointment.symptoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Symptoms</Text>
              <Text style={styles.sectionContent}>{appointment.symptoms}</Text>
            </View>
          )}

          {appointment.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.sectionContent}>{appointment.notes}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {appointment.status === 'paid' && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#4CAF50' }]}
                onPress={() => updateAppointmentStatus('in_progress')}
                disabled={updating}
              >
                <Text style={styles.buttonText}>Start Consultation</Text>
              </TouchableOpacity>
            )}

            {appointment.status === 'in_progress' && (
              <>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#2196F3' }]}
                  onPress={() => router.push({ pathname: '/consultation/[appointmentId]', params: { appointmentId: appointment.id } } as any)}
                  disabled={updating}
                >
                  <Text style={styles.buttonText}>Start Video Call (coming soon)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#4CAF50' }]}
                  onPress={() => updateAppointmentStatus('complete')}
                  disabled={updating}
                >
                  <Text style={styles.buttonText}>Complete Appointment</Text>
                </TouchableOpacity>
              </>
            )}

            {appointment.status !== 'cancelled' && appointment.status !== 'complete' && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#f44336' }]}
                onPress={() => updateAppointmentStatus('cancelled')}
                disabled={updating}
              >
                <Text style={styles.buttonText}>Cancel Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  patientEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#34495e',
  },
  section: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
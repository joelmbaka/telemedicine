import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { useRouter } from 'expo-router';

export default function NewAppointmentModal() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, profiles(full_name)')
        .eq('available', true);
      if (error) {
        console.error(error);
      } else {
        const list: Doctor[] = (data || []).map((d: any) => ({
          id: d.id,
          name: d.profiles?.full_name ?? 'Doctor',
          specialty: '',
          rating: 0,
          available: true,
        }));
        setDoctors(list);
      }
    })();
  }, []);

  // Fetch available slots when doctor and date selected
  useEffect(() => {
    if (!doctorId || !selectedDate) return;
    
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const { data, error } = await supabase
        .rpc('get_free_slots', { 
          _doctor: doctorId, 
          _day: selectedDate 
        });
      
      if (error) console.error(error);
      else setSlots(data || []);
      
      setLoadingSlots(false);
    };
    
    fetchSlots();
  }, [doctorId, selectedDate]);

  async function handleSubmit() {
    if (!doctorId || !selectedSlotId) return;
    
    setSubmitting(true);
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id;
    
    if (!userId) {
      console.error('No user session');
      setSubmitting(false);
      return;
    }
    
    const { data: appointmentId, error } = await supabase
      .rpc('book_slot', { 
        _slot: selectedSlotId, 
        _patient: userId 
      });
    
    if (error) {
      console.error(error);
    } else {
      console.log('Appointment booked:', appointmentId);
      
      // Fixed fee of $20 (2000 cents)
      const feeCents = 2000;
      
      // Create Stripe checkout session
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          appointment_id: appointmentId,
          amount_cents: 2000,
          success_url: `${baseUrl}/appointments/success`,
          cancel_url: `${baseUrl}/appointments/cancel`
        }
      });

      if (response.error) {
        console.error('Failed to create checkout session', response.error);
      } else {
        // Redirect to the Stripe checkout page
        router.push(response.data.sessionUrl);
      }
    }
    
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Book Appointment</Text>

      <Text style={styles.label}>Doctor</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={doctorId}
          onValueChange={(itemValue) => setDoctorId(itemValue)}
        >
          <Picker.Item label="Select doctor…" value={undefined} />
          {doctors.map((d) => (
            <Picker.Item key={d.id} label={d.name} value={d.id} />
          ))}
        </Picker>
      </View>

      <Calendar
        minDate={new Date().toISOString().split('T')[0]}
        onDayPress={day => {
          setSelectedDate(day.dateString);
          setSelectedSlotId(null);
        }}
        markedDates={{
          [selectedDate || '']: {selected: true, selectedColor: '#3b82f6'}
        }}
      />
      
      {selectedDate && (
        <View>
          <Text className="text-lg font-bold mt-4">Available Slots</Text>
          
          {loadingSlots ? (
            <ActivityIndicator />
          ) : slots.length === 0 ? (
            <Text>No available slots</Text>
          ) : (
            <View style={{ maxHeight: 200 }}>
              <ScrollView>
                {slots.map(slot => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotButton,
                      selectedSlotId === slot.id && styles.selectedSlot
                    ]}
                    onPress={() => setSelectedSlotId(slot.id)}
                  >
                    <Text style={selectedSlotId === slot.id 
                      ? styles.selectedSlotText 
                      : styles.slotText}>
                      {format(parseISO(slot.start_time), 'HH:mm')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <Button
        title="Confirm Appointment"
        disabled={!selectedSlotId || submitting}
        onPress={handleSubmit}
      />

      <View style={styles.buttonRow}>
        <Button title="Cancel" onPress={() => router.replace('/(tabs)/appointments')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  slotButton: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedSlot: {
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  slotText: {
    textAlign: 'center',
    color: '#1f2937',
  },
  selectedSlotText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
});

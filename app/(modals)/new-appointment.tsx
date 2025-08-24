import { Picker } from '@react-native-picker/picker';
import { COLORS } from '@/lib/theme';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';

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
          id: String(d.id),
          name: d.profiles?.full_name ?? 'Doctor',
          specialty: '',
          rating: 0,
          available: true,
        }));
        console.log('Fetched doctors', list);
        setDoctors(list);
      }
    })();
  }, []);

  // Fetch available slots when doctor and date selected
  useEffect(() => {
    if (!doctorId || !selectedDate) return;
    
    const fetchSlots = async () => {
      setLoadingSlots(true);
      console.log('Fetching slots for doctor', doctorId, 'on', selectedDate);
      const { data, error } = await supabase
        .rpc('get_free_slots', { 
          _doctor: doctorId, 
          _day: selectedDate 
        });
      
      if (error) console.error('Error fetching slots', error);
      else {
        console.log('Fetched slots', data);
        setSlots(data || []);
      }
      
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
      
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || window.location.origin;
      
      // Create Stripe checkout session
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          appointment_id: appointmentId,
          amount_cents: 2000,
          success_url: `${baseUrl}/appointments`,
          cancel_url: `${baseUrl}/appointments`
        }
      });

      if (response.error) {
        console.error('Failed to create checkout session', response.error);
      } else {
        // Open Stripe Checkout inside the app using in-app WebView screen
        router.push({
          pathname: '/checkout',
          params: { url: response.data.sessionUrl }
        });
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
          onValueChange={(itemValue) => {
            console.log('Doctor selected:', itemValue);
            setDoctorId(itemValue as string | undefined);
            // Reset selected slot when doctor changes
            setSelectedSlotId(null);
          }}
          style={styles.picker}
          dropdownIconColor="#000"
          mode="dropdown"
        >
          <Picker.Item label="Select doctor…" value={undefined} color="#888" />
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
          [selectedDate || '']: {selected: true, selectedColor: COLORS.secondary}
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
        color={COLORS.secondary}
      />

      <View style={styles.buttonRow}>
        <Button title="Cancel" onPress={() => router.replace('/(tabs)/appointments')} color={COLORS.dark} />
      </View>

      {submitting && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.overlayText}>Redirecting to Stripe...</Text>
          </View>
        </View>
      )}
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
    backgroundColor: '#fff',
  },
  picker: {
    color: '#000', // ensure text is visible against white background
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  slotButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedSlot: {
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.secondary,
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
  },
});

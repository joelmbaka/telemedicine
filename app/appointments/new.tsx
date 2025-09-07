import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { COLORS } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function NewAppointmentPage() {
  const { doctorId: paramDoctorId, skillId } = useLocalSearchParams<{ doctorId?: string; skillId?: string }>();

  const [doctorId, setDoctorId] = useState<string | undefined>(paramDoctorId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Resolve doctorId from skillId if needed
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!doctorId && skillId) {
        setLoadingDoctor(true);
        try {
          const { data, error } = await supabase
            .from('skill_cards')
            .select('doctor_id')
            .eq('id', skillId)
            .single();
          if (!mounted) return;
          if (error) {
            console.error('Failed to resolve doctor from skill:', error);
            setErrorText('Could not resolve doctor for this skill.');
          } else {
            setDoctorId((data as any)?.doctor_id || undefined);
          }
        } finally {
          if (mounted) setLoadingDoctor(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [skillId, doctorId]);

  // Fetch available slots when doctor and date selected
  useEffect(() => {
    if (!doctorId || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setErrorText(null);
      const { data, error } = await supabase.rpc('get_free_slots', {
        _doctor: doctorId,
        _day: selectedDate,
      });
      if (error) {
        console.error('Error fetching slots', error);
        setSlots([]);
      } else {
        setSlots(data || []);
      }
      setLoadingSlots(false);
    };

    fetchSlots();
  }, [doctorId, selectedDate]);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      if (!doctorId || !selectedSlotId) return;
      setSubmitting(true);

      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (!userId) {
        setErrorText('Please sign in to book an appointment.');
        setSubmitting(false);
        router.push('/auth/sign-in');
        return;
      }

      // Book slot via RPC (returns a row with id, fee_cents)
      const { data: bookData, error: bookErr } = await supabase.rpc('book_slot', {
        _slot: selectedSlotId,
        _patient: userId,
      });
      if (bookErr) {
        console.error(bookErr);
        setErrorText(bookErr.message);
        setSubmitting(false);
        return;
      }
      console.log('book_slot RPC result:', bookData);
      let appointmentId: string | undefined;
      if (typeof bookData === 'string') {
        appointmentId = bookData;
      } else if (Array.isArray(bookData)) {
        appointmentId = (bookData[0] as any)?.id;
      } else if (bookData && typeof bookData === 'object') {
        appointmentId = (bookData as any).id;
      }

      if (!appointmentId) {
        setErrorText('Failed to create appointment.');
        setSubmitting(false);
        return;
      }


      // Compute absolute base URL for Stripe redirect requirements.
      // In native, window is undefined so we must use a hard fallback if EXPO_PUBLIC_BASE_URL is not set.
      const baseUrl = (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_BASE_URL)
        || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');

      // Create Stripe checkout session (fixed $20)
      const accessToken = session.data.session?.access_token;
      const response = await supabase.functions.invoke('create-checkout-session', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        body: {
          appointment_id: appointmentId,
          amount_cents: 2000,
          success_url: `${baseUrl}/appointments`,
          cancel_url: `${baseUrl}/appointments`,
        },
      });

      if (response.error) {
        console.error('Failed to create checkout session', response.error);
        setErrorText(response.error.message || 'Failed to start checkout.');
        setSubmitting(false);
        return;
      }

      const sessionUrl = (response.data as any)?.sessionUrl;
      if (!sessionUrl) {
        console.error('No sessionUrl returned from Edge Function:', response.data);
        setErrorText('Checkout session did not return a URL. Please try again.');
        setSubmitting(false);
        return;
      }

      router.push({ pathname: '/checkout', params: { url: sessionUrl } });
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  const heading = useMemo(() => 'Book Appointment', []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'New Appointment' }} />
      <Text style={styles.header}>{heading}</Text>

      {!doctorId && (
        <Text style={styles.warn}>No doctor specified. Open this page from a skill or doctor.</Text>
      )}

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Calendar
        minDate={new Date().toISOString().split('T')[0]}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setSelectedSlotId(null);
        }}
        markedDates={{
          [selectedDate || '']: { selected: true, selectedColor: COLORS.secondary },
        }}
      />

      {selectedDate && doctorId && (
        <View>
          <Text style={styles.subheader}>Available Slots</Text>
          {loadingSlots ? (
            <ActivityIndicator />
          ) : slots.length === 0 ? (
            <Text>No available slots</Text>
          ) : (
            <View style={{ maxHeight: 200 }}>
              <ScrollView>
                {slots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotButton, selectedSlotId === slot.id && styles.selectedSlot]}
                    onPress={() => setSelectedSlotId(slot.id)}
                  >
                    <Text style={selectedSlotId === slot.id ? styles.selectedSlotText : styles.slotText}>
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
        disabled={!selectedSlotId || submitting || !doctorId}
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
  subheader: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  warn: {
    color: '#b45309',
    marginBottom: 8,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    color: '#000',
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

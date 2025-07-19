import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';
import { useRouter } from 'expo-router';

export default function NewAppointmentModal() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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

  const onAndroidChange = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    if (selected) setDate(selected);
  };

  async function handleSubmit() {
    if (!doctorId) return;
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const patientId = sessionData.session?.user.id;
      if (!patientId) throw new Error('Not logged in');

      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        scheduled_at: date.toISOString(),
        status: 'awaiting_payment',
      });
      if (error) throw error;
      router.back();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Book Appointment</Text>

      <Text style={styles.label}>Doctor</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={doctorId}
          onValueChange={(value) => setDoctorId(value)}
          style={{ flex: 1 }}
        >
          <Picker.Item label="Select doctor…" value={undefined} />
          {doctors.map((d) => (
            <Picker.Item key={d.id} label={d.name} value={d.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Date & Time</Text>
      <Button title={date.toLocaleString()} onPress={() => setShowDatePicker(true)} />

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(e, d) => {
            onAndroidChange(e, d);
            if (d) setShowTimePicker(true);
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          onChange={onAndroidChange}
        />
      )}

      <View style={styles.buttonRow}>
        <Button title="Cancel" onPress={() => router.back()} />
        <Button title={submitting ? 'Saving…' : 'Confirm'} onPress={handleSubmit} disabled={submitting || !doctorId} />
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
});

import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Button, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Slot {
  id: string;
  start_ts: string;
  end_ts: string;
  is_booked: boolean;
}

export default function AvailabilityScreen() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [months, setMonths] = useState('1');

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('doctor_availability_slots')
      .select('*')
      .eq('doctor_id', userId)
      .order('start_ts');
    if (error) Alert.alert('Error fetching slots');
    if (data) setSlots(data as Slot[]);
    setLoading(false);
  }

  async function generateSlots() {
    const monthsInt = parseInt(months, 10);
    if (isNaN(monthsInt) || monthsInt < 1 || monthsInt > 6) {
      Alert.alert('Months must be between 1 and 6');
      return;
    }
    setGenerating(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) { Alert.alert('User not found'); setGenerating(false); return; }
    const startDateStr = startDate.toISOString().split('T')[0];
    const { error } = await supabase.rpc('generate_slots', {
      _doctor: userId,
      _start_date: startDateStr,
      _months: monthsInt,
    });
    if (error) {
      Alert.alert('Error generating slots', error.message);
      setGenerating(false);
      return;
    }
    await loadSlots();
    setGenerating(false);
  }

  async function toggleSlot(slotId: string) {
    const { error } = await supabase
      .from('doctor_availability_slots')
      .update({ is_booked: false })
      .eq('id', slotId);
    if (error) Alert.alert('Error updating slot');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#64d2ff" />
      </View>
    );
  }

  if (!loading && slots.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No slots yet.</Text>
        <Button title={`Start Date: ${startDate.toLocaleDateString()}`} onPress={() => setShowPicker(true)} />
        {showPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}
            onChange={(e, date) => {
              setShowPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        <TextInput
          style={styles.monthInput}
          value={months}
          onChangeText={setMonths}
          keyboardType="numeric"
          placeholder="Months (1-6)"
        />
        <Button title={generating ? 'Generating...' : 'Generate Slots'} onPress={generateSlots} disabled={generating} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>My Availability</Text>
      <FlatList
      data={slots}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.slot, item.is_booked && styles.booked]}
          onPress={() => !item.is_booked && toggleSlot(item.id)}
        >
          <View style={styles.row}>
            <Text style={styles.text}>
              {new Date(item.start_ts).toLocaleString()} - {new Date(item.end_ts).toLocaleTimeString()}
            </Text>
            <View style={[styles.statusPill, item.is_booked ? styles.bookedPill : styles.freePill]}>
              <Text style={styles.statusText}>{item.is_booked ? 'Booked' : 'Available'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No slots yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: { padding: 16 },
  slot: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  booked: { backgroundColor: '#e0e0e0' },
  text: { color: '#2c3e50' },
  bookedText: { color: '#d32f2f', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  bookedPill: { backgroundColor: '#e57373' },
  freePill: { backgroundColor: '#4caf50' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1d23' },
  empty: { textAlign: 'center', marginTop: 20, color: '#7f8c8d' },
  monthInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#fff',
  }
});

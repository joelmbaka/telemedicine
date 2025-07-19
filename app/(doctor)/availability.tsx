import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      const { data } = await supabase
        .from('doctor_availability_slots')
        .select('*')
        .eq('doctor_id', userId)
        .order('start_ts');
      if (mounted && data) setSlots(data as Slot[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <FlatList
      data={slots}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.slot, item.is_booked && styles.booked]}
          onPress={() => !item.is_booked && toggleSlot(item.id)}
        >
          <Text style={styles.text}>
            {new Date(item.start_ts).toLocaleString()} - {new Date(item.end_ts).toLocaleTimeString()}
          </Text>
          {item.is_booked && <Text style={styles.bookedText}>Booked</Text>}
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No slots yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1d23' },
  empty: { textAlign: 'center', marginTop: 20, color: '#7f8c8d' },
});

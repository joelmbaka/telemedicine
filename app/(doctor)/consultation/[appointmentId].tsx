import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Appointment, Drug } from '../../../lib/types';



export default function ConsultationScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [drugSearch, setDrugSearch] = useState('');
  const [drugResults, setDrugResults] = useState<Drug[]>([]);
  const [items, setItems] = useState<Array<{ drug: Drug; qty: number; dosage: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
    }, [appointmentId]);

  // search drugs whenever query changes
  useEffect(() => {
    const fetchDrugs = async () => {
      if (drugSearch.trim().length < 2) {
        setDrugResults([]);
        return;
      }
      const { data, error } = await supabase
        .from('drugs')
        .select('id,name,unit_price_cents')
        .ilike('name', `%${drugSearch}%`)
        .limit(10);
      if (!error && data) {
        setDrugResults(data as Drug[]);
      }
    };
    fetchDrugs();
  }, [drugSearch]);

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      if (error) throw error;
      if (data) {
        setAppointment(data as Appointment);
        setSymptoms(data.symptoms ?? '');
        setNotes(data.notes ?? '');
      }
    } catch (error) {
      console.error('Error loading appointment', error);
      Alert.alert('Error', 'Could not load appointment');
    } finally {
      setLoading(false);
    }
  };

  const saveConsultation = async () => {
    if (!appointment) return;
    // build items json
    const itemsJson = items.map(it => ({
      drug_id: it.drug.id,
      qty: it.qty,
      dosage: it.dosage,
      price_cents: it.drug.unit_price_cents,
    }));
    if (!appointment) return;
    try {
      setSaving(true);

      // Call RPC – currently saves prescription with no items, will extend later
      const { error: rpcError } = await supabase.rpc('issue_prescription', {
        _appointment: appointment.id,
        _items: JSON.stringify(itemsJson),
      });
      if (rpcError) throw rpcError;

      // Update notes / symptoms
      const { error: apptErr } = await supabase
        .from('appointments')
        .update({
          symptoms,
          notes,
          status: 'complete',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointment.id);
      if (apptErr) throw apptErr;

      Alert.alert('Success', 'Consultation saved');
      router.back();
    } catch (error) {
      console.error('Save consultation error', error);
      Alert.alert('Error', 'Could not save consultation');
    } finally {
      setSaving(false);
    }
  };

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
      <Stack.Screen options={{ title: 'Consultation' }} />
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Symptoms</Text>
        <TextInput
          multiline
          style={styles.input}
          value={symptoms}
          onChangeText={setSymptoms}
          placeholder="Describe patient symptoms"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          multiline
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Doctor notes"
        />

        <Text style={styles.label}>Add Prescription Items</Text>
        <TextInput
          style={styles.input}
          placeholder="Search drug by name"
          value={drugSearch}
          onChangeText={setDrugSearch}
        />
        {drugResults.map(drug => (
          <TouchableOpacity
            key={drug.id}
            style={styles.searchResult}
            onPress={() => {
              setItems(prev => {
                if (prev.find(i => i.drug.id === drug.id)) return prev;
                return [...prev, { drug, qty: 1, dosage: '' }];
              });
              setDrugSearch('');
              setDrugResults([]);
            }}
          >
            <Text>{drug.name}</Text>
          </TouchableOpacity>
        ))}

        {items.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {items.map((it, idx) => (
              <View key={it.drug.id} style={styles.itemRow}>
                <Text style={{ flex: 1 }}>{it.drug.name}</Text>
                <TouchableOpacity onPress={() => setItems(p => p.map((d,i)=> i===idx?{...d, qty: Math.max(1,d.qty-1)}:d))}><Text style={styles.qtyBtn}>-</Text></TouchableOpacity>
                <Text style={{ marginHorizontal:4 }}>{it.qty}</Text>
                <TouchableOpacity onPress={() => setItems(p => p.map((d,i)=> i===idx?{...d, qty: d.qty+1}:d))}><Text style={styles.qtyBtn}>+</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, saving && { opacity: 0.6 }]}
          onPress={saveConsultation}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.buttonText}>Save & Complete</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    minHeight: 80,
    padding: 10,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
  },
  searchResult: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  qtyBtn: {
    paddingHorizontal:6,
    borderWidth:1,
    borderColor:'#ccc'
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
});
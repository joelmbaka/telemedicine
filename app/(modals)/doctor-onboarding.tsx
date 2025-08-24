import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Specialty {
  id: string;
  name: string;
  emoji: string;
}

export default function DoctorOnboardingModal() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [fee, setFee] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [genStartDate, setGenStartDate] = useState<Date>(new Date());
  const [genMonths, setGenMonths] = useState('3');
  const [showPicker, setShowPicker] = useState(false);
  // new rule state
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1,2,3,4,5]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  // Fetch specialties
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name, emoji')
        .order('name');

      if (!isMounted) return;
      if (error) console.error(error);
      else setSpecialties((data as Specialty[]) || []);
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (step === 0) {
      setSubmitting(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) {
        console.error('No user session');
        setSubmitting(false);
        return;
      }

      // 1. Upsert doctor profile
      const { error: docErr } = await supabase.from('doctors').upsert(
        {
          id: userId,
          bio: bio.trim() || null,
          consultation_fee_dollars: fee ? parseFloat(fee) : 0,
          specialties: selectedIds,
          available: true,
        },
        { onConflict: 'id' }
      );

      if (docErr) {
        console.error('Failed to save doctor:', docErr);
        setSubmitting(false);
        return;
      }

      // 2. Ensure at least one skill card exists (use first selected specialty)
      const primary = specialties.find((s) => s.id === selectedIds[0]);
      if (primary) {
        await supabase.from('skill_cards').upsert(
          {
            doctor_id: userId,
            title: primary.name,
            emoji: primary.emoji,
          },
          { onConflict: 'doctor_id' }
        );
      }

      // proceed to rule step
      setSubmitting(false);
      setStep(1);
    }

    if (step === 1) {
      if (selectedWeekdays.length === 0) { 
        alert('Select at least one weekday'); 
        return; 
      }
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { 
        setSubmitting(false); 
        return; 
      }
      const rows = selectedWeekdays.map(w => ({
        doctor_id: userId,
        weekday: w,
        start_time: startTime,
        end_time: endTime,
        timezone: 'UTC'
      }));
      const { error } = await supabase.from('doctor_availability_rules').insert(rows);
      setSubmitting(false);
      if (error) { 
        alert(error.message); 
        return; 
      }
      setStep(2);
    }

    if (step === 2) {
      // generate slots
      const monthsInt = parseInt(genMonths, 10);
      if (isNaN(monthsInt) || monthsInt < 1 || monthsInt > 6) {
        alert('Months must be between 1 and 6');
        return;
      }
      setSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setSubmitting(false); return; }
      const dateStr = genStartDate.toISOString().split('T')[0];
      const { error } = await supabase.rpc('generate_slots', {
        _doctor: userId,
        _start_date: dateStr,
        _months: monthsInt,
      });
      setSubmitting(false);
      if (error) {
        alert(error.message);
        return;
      }
      router.back();
      return;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.header}>Set Your Availability</Text>
          <Button title={`Start Date: ${genStartDate.toLocaleDateString()}`} onPress={() => setShowPicker(true)} />
          {showPicker && (
            // @ts-ignore
            <DateTimePicker
              value={genStartDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}
              onChange={(event: any, selected?: Date) => {
                setShowPicker(false);
                if (selected) setGenStartDate(selected);
              }}
            />
          )}
          <Text style={styles.label}>Months to generate (1-6)</Text>
          <TextInput
            style={styles.input}
            value={genMonths}
            onChangeText={setGenMonths}
            keyboardType="numeric"
            placeholder="e.g., 3"
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Generate Slots" onPress={handleSubmit} disabled={submitting} />
          <View style={{ height: 12 }} />
          <Button title="Skip" color="#888" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // Step 1 – rule creation
  if (step === 1) {
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.header}>Define Your Working Hours</Text>
          <Text style={styles.label}>Select Weekdays</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center' }}>
            {weekdays.map((name, idx) => {
              const day = idx + 1;
              const selected = selectedWeekdays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  onPress={() => setSelectedWeekdays(prev => prev.includes(day)? prev.filter(d=>d!==day): [...prev, day])}
                >
                  <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.label}>Start Time (HH:MM)</Text>
          <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="08:00" />
          <Text style={styles.label}>End Time (HH:MM)</Text>
          <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="17:00" />
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Save Rule" onPress={async () => {
            if (selectedWeekdays.length === 0) { alert('Select at least one weekday'); return; }
            setSubmitting(true);
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;
            if (!userId) { setSubmitting(false); return; }
            const rows = selectedWeekdays.map(w => ({
              doctor_id: userId,
              weekday: w,
              start_time: startTime,
              end_time: endTime,
              timezone: 'UTC'
            }));
            const { error } = await supabase.from('doctor_availability_rules').insert(rows);
            setSubmitting(false);
            if (error) { alert(error.message); return; }
            setStep(2);
          }} disabled={submitting} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Set Up Your Doctor Profile</Text>

      <Text style={styles.label}>Select Specialties</Text>
      {specialties.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={styles.checkboxRow}
          onPress={() => toggleId(s.id)}
        >
          <Text style={styles.checkbox}>{selectedIds.includes(s.id) ? '☑' : '☐'}</Text>
          <Text style={styles.specLabel}>{`${s.emoji} ${s.name}`}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={styles.input}
        multiline
        value={bio}
        onChangeText={setBio}
        placeholder="Brief description (e.g., 7 years experience)"
      />

      <Text style={styles.label}>Consultation Fee ($)</Text>
      <TextInput
        style={styles.input}
        value={fee}
        onChangeText={setFee}
        keyboardType="numeric"
        placeholder="e.g., 20"
      />

    </ScrollView>
    <View style={styles.footer}>
      <Button
        title="Save"
        onPress={handleSubmit}
        disabled={submitting || selectedIds.length === 0}
      />
      <View style={{ height: 12 }} />
      <Button title="Cancel" color="#888" onPress={() => router.back()} />
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 140,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkbox: {
    fontSize: 18,
    width: 24,
  },
  specLabel: {
    marginLeft: 4,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  dayChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  dayChipSelected: {
    backgroundColor: '#25292e',
    borderColor: '#25292e',
  },
  dayChipText: {
    color: '#000',
  },
  dayChipTextSelected: {
    color: '#fff',
  }
});

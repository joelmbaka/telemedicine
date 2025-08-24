import React, { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import DoctorCard from '../../components/DoctorCard';
import { supabase } from '../../lib/supabase';
import { Doctor } from '../../lib/types';

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, specialties, rating_avg, available, profiles(full_name)')
        .eq('available', true);
      if (!mounted) return;
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // Gather unique specialty IDs
      const specIds = new Set<string>();
      (data || []).forEach((d: any) => {
        (d.specialties || []).forEach((id: string) => specIds.add(id));
      });

      let specMap: Record<string, { id: string; name: string; emoji: string }> = {};
      if (specIds.size) {
        const { data: specs, error: specErr } = await supabase
          .from('specialties')
          .select('id,name,emoji')
          .in('id', Array.from(specIds));
        if (specErr) console.error(specErr);
        (specs || []).forEach((s: any) => {
          specMap[s.id] = s;
        });
      }

      const list: Doctor[] = (data || []).map((d: any) => {
        const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
        return {
          id: d.id,
          name: profile?.full_name ?? 'Doctor',
          rating: Number(d.rating_avg) || 0,
          available: d.available,
          specialties_info: (d.specialties || []).map((id: string) => specMap[id]).filter(Boolean),
        } as Doctor;
      });

      setDoctors(list);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#64d2ff" />
      </View>
    );
  }

  return doctors.length === 0 ? (
    <View style={styles.center}>
      <Text style={{ color: '#fff' }}>No doctors available</Text>
    </View>
  ) : (
    <ScrollView style={styles.container}>
      {doctors.map((doctor) => (
        <Link href={`/doctors/${doctor.id}`} asChild key={doctor.id}>
          <DoctorCard doctor={doctor} />
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1d23',
  },
});

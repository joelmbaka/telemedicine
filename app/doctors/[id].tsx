import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import SkillCard from '../../components/SkillCard';
import { Doctor } from '../../lib/types';

interface DoctorSkill {
  id: number;
  title: string;
  emoji: string | null;
  images: string[] | null;
  avg_rating: number | null;
  reviews_count: number | null;
  orders_count: number | null;
}

export default function DoctorDetail() {
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<DoctorSkill[]>([]);

  useEffect(() => {
    console.log('DoctorDetail param id:', id);
    if (!id) return;
    const fetchDoctor = async () => {
      setLoading(true);
      const { data: doc, error } = await supabase
        .from('doctors')
        .select('id, specialties, rating_avg, available, bio, consultation_fee_dollars, profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        setDoctor(null);
        setLoading(false);
        return;
      }

      let specialties_info: { id: string; name: string; emoji: string }[] = [];
      if (doc?.specialties?.length) {
        const { data: specs, error: specsErr } = await supabase
          .from('specialties')
          .select('id, name, emoji')
          .in('id', doc.specialties);

        if (specsErr) console.error(specsErr);
        specialties_info = specs || [];
      }

      const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;

      console.log('Raw doctor record:', doc);
      const doctorData: Doctor = {
        id: doc.id,
        name: profile?.full_name ?? 'Doctor',
        rating: Number(doc.rating_avg) || 0,
        available: doc.available,
        image_url: profile?.avatar_url ?? undefined,
        bio: doc.bio,
        consultation_fee_dollars: doc.consultation_fee_dollars,
        specialties_info,
      } as Doctor;
      console.log('Mapped doctorData:', doctorData);

      setDoctor(doctorData);

      // fetch doctor's skills
      const { data: skillCards, error: skillErr } = await supabase
        .from('skill_cards')
        .select('id, title, emoji, images, avg_rating, reviews_count, orders_count')
        .eq('doctor_id', id as string);
      if (skillErr) console.error(skillErr);
      else {
        console.log('Fetched skill cards:', skillCards);
        setSkills((skillCards as DoctorSkill[]) || []);
      }

      setLoading(false);
    };

    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#64d2ff" />
      </View>
    );
  }

  if (!doctor) {
    return <Text>Doctor not found</Text>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {doctor.image_url && <Image source={{ uri: doctor.image_url }} style={styles.image} />}
      <Text style={styles.title}>{doctor.name}</Text>
      {doctor.specialties_info?.length ? (
        <Text style={styles.specialties}>
          {doctor.specialties_info.map(s => `${s.emoji} ${s.name}`).join(', ')}
        </Text>
      ) : null}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => router.push(`/appointments/new?doctorId=${doctor.id}`)}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>{(doctor.rating ?? 0).toFixed(1)}</Text>
      </View>

      <Text style={styles.availability}>{doctor.available ? 'Available Today' : 'Not Available'}</Text>
      {doctor.bio ? <Text style={styles.bio}>{doctor.bio}</Text> : null}

      {skills.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Skills</Text>
          <FlatList
            data={skills}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            scrollEnabled={false}
            contentContainerStyle={styles.skillsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.skillCard}
                onPress={() => router.push({ pathname: '/(tabs)/(skill)/[id]', params: { id: item.id } })}
              >
                <SkillCard
                  title={item.title}
                  emoji={item.emoji || '💡'}
                  rating={typeof item.avg_rating === 'number' ? item.avg_rating : undefined}
                  reviewsCount={typeof item.reviews_count === 'number' ? item.reviews_count : undefined}
                  ordersCount={typeof item.orders_count === 'number' ? item.orders_count : undefined}
                />
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
  },
  specialties: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 4,
    color: '#f39c12',
    fontWeight: '600',
  },
  availability: {
    textAlign: 'center',
    marginTop: 8,
    color: '#2c3e50',
  },
  bio: {
    marginTop: 16,
    lineHeight: 20,
    color: '#2c3e50',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 24,
    marginBottom: 8,
  },
  skillsList: {
    paddingBottom: 16,
  },
  skillCard: {
    width: '48%',
    marginBottom: 12,
  },
  bookButton: {
    backgroundColor: '#FFD33D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'center',
  },
  bookButtonText: {
    color: '#000',
    fontWeight: '700',
  },
});
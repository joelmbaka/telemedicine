import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';

interface Skill {
  id: string;
  doctor_id: string | null;
  title: string;
  emoji: string | null;
  images: string[] | null;
  years_experience: number | null;
  description: string | null;
  created_at: string | null;
  avg_rating: number | null;
  reviews_count: number | null;
  orders_count: number | null;
}

interface Doctor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  specialization: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  patient_name: string;
}

export default function SkillDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSkillDetails();
    }
  }, [id]);

  const fetchSkillDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch skill details
      const { data: skillData, error: skillError } = await supabase
        .from('skill_cards')
        .select('id, doctor_id, title, emoji, images, years_experience, description, created_at, avg_rating, reviews_count, orders_count')
        .eq('id', id)
        .single();

      if (skillError) throw skillError;
      setSkill(skillData as Skill);

      // Fetch doctor details (prefer doctors -> profiles to avoid RLS issues)
      if (skillData?.doctor_id) {
        let resolvedDoctor: Doctor | null = null;

        const { data: docRow, error: docErr } = await supabase
          .from('doctors')
          .select('id, profiles(full_name, avatar_url)')
          .eq('id', skillData.doctor_id)
          .single();

        if (!docErr && docRow) {
          const profile = Array.isArray((docRow as any).profiles) ? (docRow as any).profiles[0] : (docRow as any).profiles;
          resolvedDoctor = {
            id: (docRow as any).id,
            full_name: profile?.full_name ?? 'Doctor',
            avatar_url: profile?.avatar_url ?? null,
            specialization: null,
          };
        } else {
          // Fallback: attempt profiles by id (in case doctor row hasn't been created yet)
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', skillData.doctor_id)
            .single();
          if (profileRow) {
            resolvedDoctor = {
              id: skillData.doctor_id,
              full_name: (profileRow as any).full_name ?? 'Doctor',
              avatar_url: (profileRow as any).avatar_url ?? null,
              specialization: null,
            };
          }
        }

        if (resolvedDoctor) setDoctor(resolvedDoctor);
      }

      // Placeholder reviews — replace with real reviews table
      const sampleReviews: Review[] = [
        { id: '1', rating: 5, comment: 'Excellent service! Very professional and knowledgeable.', created_at: '2024-01-15', patient_name: 'Sarah M.' },
        { id: '2', rating: 4, comment: 'Great experience, would recommend to others.', created_at: '2024-01-10', patient_name: 'John D.' }
      ];
      setReviews(sampleReviews);

    } catch (error) {
      console.error('Error fetching skill details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons key={star} name="star" size={16} color={star <= item.rating ? '#FFD700' : '#E0E0E0'} />
          ))}
        </View>
        <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.reviewAuthor}>— {item.patient_name}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Skill Details' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Skill Not Found' }} />
        <Text style={styles.errorText}>Skill not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: skill.title,
          headerBackTitle: 'Back',
          headerTintColor: COLORS.primary,
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.emoji}>{skill.emoji || '💡'}</Text>
          <Text style={styles.title}>{skill.title}</Text>
          
          {doctor && (
            <TouchableOpacity style={styles.doctorInfo} onPress={() => router.push(`/doctors/${doctor.id}`)}>
              <Text style={styles.doctorName}>Dr. {doctor.full_name}</Text>
              {doctor.specialization && <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>}
            </TouchableOpacity>
          )}
          {/* Rating and Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.ratingText}>{skill.avg_rating?.toFixed(1) || '0.0'}</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{skill.reviews_count || 0}</Text>
              <Text style={styles.statLabel}>reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{skill.orders_count || 0}</Text>
              <Text style={styles.statLabel}>orders</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {skill.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this skill</Text>
            <Text style={styles.description}>{skill.description}</Text>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReview}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
            />
          ) : (
            <Text style={styles.noReviews}>No reviews yet</Text>
          )}
        </View>

        {/* Book Appointment Button */}
        {doctor && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.bookButton} onPress={() => router.push(`/appointments/new?doctorId=${doctor.id}&skillId=${skill.id}`)}>
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  errorText: { fontSize: 16, color: '#666' },
  heroSection: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  doctorInfo: { alignItems: 'center', marginBottom: 12 },
  doctorName: { fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  doctorSpecialization: { fontSize: 14, color: '#7f8c8d' },
  experience: { fontSize: 16, color: '#7f8c8d', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  statItem: { alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  statLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  section: { backgroundColor: '#fff', marginTop: 12, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#2c3e50', marginBottom: 16 },
  description: { fontSize: 16, lineHeight: 24, color: '#34495e' },
  reviewCard: { padding: 16, backgroundColor: '#f8f9fa', borderRadius: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewRating: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 12, color: '#7f8c8d' },
  reviewComment: { fontSize: 14, lineHeight: 20, color: '#2c3e50', marginBottom: 8 },
  reviewAuthor: { fontSize: 12, color: '#7f8c8d', fontStyle: 'italic' },
  reviewSeparator: { height: 12 },
  noReviews: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', padding: 24 },
  bookButton: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  bookButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

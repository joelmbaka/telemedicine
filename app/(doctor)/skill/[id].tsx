import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { supabase } from '../../../lib/supabase';
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
}

export default function SkillDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchSkill();
    }, [id])
  );

  const handleEdit = () => {
    (router as any).push({ pathname: '/(modals)/edit-skill', params: { id } });
  };

  const deleteSkill = async () => {
    console.log('Attempting to delete skill', id);

    if (!id) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('No user');

      const { error } = await supabase
        .from('skill_cards')
        .delete()
        .eq('id', id)
        .eq('doctor_id', userId);
      if (error) throw error;

      Alert.alert('Deleted', 'Skill deleted successfully');
      router.replace('/(doctor)/skills');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (window.confirm('Are you sure you want to delete this skill?')) {
        deleteSkill();
      }
    } else {
      Alert.alert('Delete Skill', 'Are you sure you want to delete this skill?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteSkill },
      ]);
    }
  };

  const fetchSkill = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('skill_cards')
        .select('id, doctor_id, title, emoji, images, years_experience, description, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSkill(data as Skill);
    } catch (error) {
      console.error('Error fetching skill:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={styles.center}>
        <Text>Skill not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skill Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {skill.images && skill.images.length ? (
            <Image source={{ uri: skill.images[0] }} style={styles.cardImage} contentFit="cover" />
          ) : (
            skill.emoji && <Text style={styles.emoji}>{skill.emoji}</Text>
          )}
          <Text style={styles.title}>{skill.title}</Text>
          {skill.years_experience !== null && (
            <Text style={styles.subTitle}>{skill.years_experience} years experience</Text>
          )}
          {skill.description && <Text style={styles.description}>{skill.description}</Text>}
          {skill.created_at && (
            <Text style={styles.meta}>Created: {new Date(skill.created_at).toLocaleDateString()}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit} disabled={deleting}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={confirmDelete}
            disabled={deleting}
          >
            <Text style={styles.actionText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const cardBase: ViewStyle = {
  borderRadius: 12,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
  marginHorizontal: 16,
  marginTop: 16,
  overflow: 'hidden',
  alignItems: 'center',
  paddingBottom: 16,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  } as ViewStyle,
  card: {
    ...cardBase,
  } as ViewStyle,
  cardImage: {
    width: '100%',
    height: 200,
  },
  emoji: {
    fontSize: 64,
    marginTop: 32,
  } as TextStyle,
  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
  } as TextStyle,
  subTitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#7f8c8d',
  } as TextStyle,
  description: {
    marginTop: 12,
    marginHorizontal: 16,
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
  } as TextStyle,
  meta: {
    marginTop: 8,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 16,
  } as ViewStyle,
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  } as ViewStyle,
  deleteBtn: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  } as ViewStyle,
  actionText: {
    color: '#fff',
    fontWeight: '600',
  } as TextStyle,
});
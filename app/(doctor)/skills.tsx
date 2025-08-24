import React, { useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS } from '@/lib/theme';

import { Image } from 'expo-image';

interface Skill {
  id: number;
  title: string;
  emoji: string | null;
  images: string[] | null;
  avg_rating: number | null;
  reviews_count: number | null;
  orders_count: number | null;
}

export default function SkillsScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('skill_cards')
      .select('id, title, emoji, images, avg_rating, reviews_count, orders_count')
      .eq('doctor_id', userId)
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    else setSkills((data as Skill[]) || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        await fetchSkills();
      })();
      return () => {
        isActive = false;
      };
    }, [fetchSkills])
  );

  const renderItem = ({ item }: { item: Skill }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/skill/[id]', params: { id: item.id } })}
    >
      {item.images && item.images.length ? (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.cardImage}
          contentFit="cover"
        />
      ) : (
        item.emoji && <Text style={styles.emoji}>{item.emoji}</Text>
      )}
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.metricsRow}>
        <Ionicons name="star" size={14} color="#f1c40f" />
        <Text style={styles.metricText}>{item.avg_rating?.toFixed(1) ?? '0.0'}</Text>
        <Text style={styles.metricText}>· {item.reviews_count} reviews</Text>
      </View>
      <Text style={styles.metricText}>{item.orders_count} orders</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Skills</Text>
      <FlatList
        data={skills}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={() => (
          <TouchableOpacity style={styles.addCard} onPress={() => router.push('/(modals)/new-skill')}>
            <Ionicons name="add" size={40} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        renderItem={renderItem}
      />
    </View>
  );
}

const cardBase: ViewStyle = {
  height: 200,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginVertical: 8,
  width: '48%',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  } as ViewStyle,
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    paddingHorizontal: 16,
    paddingVertical: 8,
  } as TextStyle,
  list: {
    paddingHorizontal: 8,
  } as ViewStyle,
  columnWrapper: {
    justifyContent: 'space-between',
  } as ViewStyle,
  addCard: {
    ...cardBase,
    width: '100%',
    height: 60,
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: COLORS.primary,
  } as ViewStyle,
  card: {
    ...cardBase,
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  } as ViewStyle,
  cardImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  emoji: {
    fontSize: 36,
  } as TextStyle,
  title: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  } as TextStyle,
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  } as ViewStyle,
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  } as ViewStyle,
  metricText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  } as TextStyle,
});
